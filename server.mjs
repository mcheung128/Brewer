import { createServer } from "node:http";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { existsSync, createReadStream } from "node:fs";
import { extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { OAuth2Client } from "google-auth-library";
import pg from "pg";

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, "..");
const DIST_DIR = join(__dirname, "dist");
const PUBLIC_DIR = join(__dirname, "public");
const PORT = Number(process.env.PORT ?? 3001);
const DATABASE_URL = process.env.DATABASE_URL;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14;

const createId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const template = (
  name,
  method,
  dose,
  water,
  grindSize,
  waterTemp,
  numberOfPours,
  pourTiming,
  totalBrewTime,
  filterType,
) => ({
  id: createId(),
  name,
  method,
  dose,
  water,
  grindSize,
  waterTemp,
  numberOfPours,
  pourTiming,
  totalBrewTime,
  filterType,
});

const seededTemplates = () => [
  template(
    "Hoffmann Method",
    "V60",
    15,
    250,
    "Medium-fine",
    96,
    5,
    "0:00 bloom, then pours every 30s",
    "3:30",
    "Paper",
  ),
];

const createDefaultState = () => ({
  beans: [],
  brews: [],
  templates: seededTemplates(),
});

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is required.");
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl:
    process.env.PGSSL === "disable" || DATABASE_URL.includes("localhost")
      ? false
      : { rejectUnauthorized: false },
});
const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

const sanitizeUser = (user) => ({
  id: user.id,
  name: user.name ?? user.email,
  email: user.email,
  createdAt: user.created_at,
});

const createSessionForUser = async (userId) => {
  const token = randomBytes(32).toString("hex");
  await pool.query(
    `
      INSERT INTO sessions (token, user_id, created_at, expires_at)
      VALUES ($1, $2, NOW(), NOW() + INTERVAL '14 days')
    `,
    [token, userId],
  );
  return token;
};

const sendJson = (response, statusCode, payload) => {
  response.writeHead(statusCode, {
    "Content-Type": "application/json",
  });
  response.end(JSON.stringify(payload));
};

const sendError = (response, statusCode, error) => {
  sendJson(response, statusCode, { error });
};

const parseBody = (request) =>
  new Promise((resolveBody, rejectBody) => {
    const chunks = [];
    request.on("data", (chunk) => chunks.push(chunk));
    request.on("end", () => {
      if (chunks.length === 0) {
        resolveBody({});
        return;
      }

      try {
        resolveBody(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch {
        rejectBody(new Error("Invalid JSON body"));
      }
    });
    request.on("error", rejectBody);
  });

const getToken = (request) => {
  const header = request.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return null;
  }
  return header.slice("Bearer ".length);
};

const hashPassword = (password, salt = randomBytes(16).toString("hex")) => {
  const hash = scryptSync(password, salt, 64).toString("hex");
  return { salt, hash };
};

const verifyPassword = (password, salt, expectedHash) => {
  const actualHash = scryptSync(password, salt, 64);
  const expected = Buffer.from(expectedHash, "hex");
  return (
    actualHash.length === expected.length &&
    timingSafeEqual(actualHash, expected)
  );
};

const validateState = (state) => {
  if (!state || typeof state !== "object") {
    return false;
  }

  return (
    Array.isArray(state.beans) &&
    Array.isArray(state.brews) &&
    Array.isArray(state.templates)
  );
};

const ensureSchema = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_salt TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL
    );

    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS google_subject TEXT;

    CREATE UNIQUE INDEX IF NOT EXISTS users_google_subject_key
      ON users(google_subject)
      WHERE google_subject IS NOT NULL;

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL
    );

    CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions(expires_at);

    CREATE TABLE IF NOT EXISTS app_states (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      state JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL
    );
  `);
};

const getSession = async (token) => {
  if (!token) {
    return null;
  }

  const { rows } = await pool.query(
    `
      SELECT token, user_id, created_at, expires_at
      FROM sessions
      WHERE token = $1
    `,
    [token],
  );

  const session = rows[0];
  if (!session) {
    return null;
  }

  if (Date.now() > new Date(session.expires_at).getTime()) {
    await pool.query(`DELETE FROM sessions WHERE token = $1`, [token]);
    return null;
  }

  return session;
};

const getUserById = async (userId) => {
  const { rows } = await pool.query(
    `
      SELECT id, name, email, created_at
      FROM users
      WHERE id = $1
    `,
    [userId],
  );

  return rows[0] ?? null;
};

const verifyGoogleCredential = async (credential) => {
  if (!googleClient || !GOOGLE_CLIENT_ID) {
    throw new Error("Google sign-in is not configured.");
  }

  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();

  if (!payload?.sub || !payload.email || !payload.email_verified) {
    throw new Error("Google account email could not be verified.");
  }

  return {
    subject: payload.sub,
    email: payload.email.toLowerCase(),
    name:
      typeof payload.name === "string" && payload.name.trim()
        ? payload.name.trim()
        : payload.email,
  };
};

const getStateForUser = async (userId) => {
  const { rows } = await pool.query(
    `
      SELECT state
      FROM app_states
      WHERE user_id = $1
    `,
    [userId],
  );

  if (rows[0]?.state) {
    return rows[0].state;
  }

  const state = createDefaultState();
  await pool.query(
    `
      INSERT INTO app_states (user_id, state, updated_at)
      VALUES ($1, $2::jsonb, NOW())
      ON CONFLICT (user_id)
      DO NOTHING
    `,
    [userId, JSON.stringify(state)],
  );
  return state;
};

const saveStateForUser = async (userId, state) => {
  await pool.query(
    `
      INSERT INTO app_states (user_id, state, updated_at)
      VALUES ($1, $2::jsonb, NOW())
      ON CONFLICT (user_id)
      DO UPDATE
      SET state = EXCLUDED.state,
          updated_at = EXCLUDED.updated_at
    `,
    [userId, JSON.stringify(state)],
  );
};

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

const serveFile = (response, filePath) => {
  const ext = extname(filePath);
  const mimeType = mimeTypes[ext] ?? "application/octet-stream";
  response.writeHead(200, { "Content-Type": mimeType });
  createReadStream(filePath).pipe(response);
};

const serveStatic = (request, response) => {
  if (!existsSync(DIST_DIR)) {
    sendError(response, 404, "Frontend build not found. Run npm run build first.");
    return;
  }

  const url = new URL(request.url ?? "/", `http://${request.headers.host}`);
  const assetPath = url.pathname === "/" ? "/index.html" : url.pathname;
  const candidate = join(DIST_DIR, assetPath);
  const publicCandidate = join(PUBLIC_DIR, assetPath);

  if (existsSync(candidate) && !candidate.endsWith("\\")) {
    serveFile(response, candidate);
    return;
  }

  if (existsSync(publicCandidate) && !publicCandidate.endsWith("\\")) {
    serveFile(response, publicCandidate);
    return;
  }

  serveFile(response, join(DIST_DIR, "index.html"));
};

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", `http://${request.headers.host}`);

  if (url.pathname === "/health" && request.method === "GET") {
    try {
      await pool.query("SELECT 1");
      sendJson(response, 200, { ok: true });
    } catch {
      sendError(response, 503, "Database unavailable");
    }
    return;
  }

  if (url.pathname === "/api/auth/google/config" && request.method === "GET") {
    sendJson(response, 200, {
      clientId: GOOGLE_CLIENT_ID ?? null,
    });
    return;
  }

  if (url.pathname === "/api/auth/register" && request.method === "POST") {
    try {
      const body = await parseBody(request);
      const name = String(body.name ?? "").trim();
      const email = String(body.email ?? "").trim().toLowerCase();
      const password = String(body.password ?? "");

      if (!name || !email || !password) {
        sendError(response, 400, "Name, email, and password are required.");
        return;
      }

      if (password.length < 8) {
        sendError(response, 400, "Password must be at least 8 characters.");
        return;
      }

      const existingUser = await pool.query(
        `
          SELECT id
          FROM users
          WHERE email = $1
        `,
        [email],
      );
      if (existingUser.rowCount) {
        sendError(response, 409, "An account with that email already exists.");
        return;
      }

      const userId = createId();
      const token = randomBytes(32).toString("hex");
      const createdAt = new Date().toISOString();
      const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
      const { salt, hash } = hashPassword(password);
      const client = await pool.connect();

      try {
        await client.query("BEGIN");
        await client.query(
          `
            INSERT INTO users (id, name, email, password_salt, password_hash, created_at)
            VALUES ($1, $2, $3, $4, $5, $6)
          `,
          [userId, name, email, salt, hash, createdAt],
        );
        await client.query(
          `
            INSERT INTO sessions (token, user_id, created_at, expires_at)
            VALUES ($1, $2, $3, $4)
          `,
          [token, userId, createdAt, expiresAt],
        );
        await client.query(
          `
            INSERT INTO app_states (user_id, state, updated_at)
            VALUES ($1, $2::jsonb, NOW())
          `,
          [userId, JSON.stringify(createDefaultState())],
        );
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }

      sendJson(response, 201, {
        token,
        user: {
          id: userId,
          name,
          email,
          createdAt,
        },
      });
    } catch (error) {
      sendError(
        response,
        400,
        error instanceof Error ? error.message : "Registration failed",
      );
    }
    return;
  }

  if (url.pathname === "/api/auth/login" && request.method === "POST") {
    try {
      const body = await parseBody(request);
      const email = String(body.email ?? "").trim().toLowerCase();
      const password = String(body.password ?? "");
      const { rows } = await pool.query(
        `
          SELECT id, name, email, password_salt, password_hash, created_at
          FROM users
          WHERE email = $1
        `,
        [email],
      );
      const user = rows[0];

      if (
        !user ||
        !verifyPassword(password, user.password_salt, user.password_hash)
      ) {
        sendError(response, 401, "Invalid email or password.");
        return;
      }

      const token = await createSessionForUser(user.id);

      sendJson(response, 200, {
        token,
        user: sanitizeUser(user),
      });
    } catch (error) {
      sendError(
        response,
        400,
        error instanceof Error ? error.message : "Login failed",
      );
    }
    return;
  }

  if (url.pathname === "/api/auth/google" && request.method === "POST") {
    try {
      const body = await parseBody(request);
      const credential = String(body.credential ?? "");
      if (!credential) {
        sendError(response, 400, "Google credential is required.");
        return;
      }

      const googleUser = await verifyGoogleCredential(credential);
      const client = await pool.connect();

      try {
        await client.query("BEGIN");
        const { rows: subjectRows } = await client.query(
          `
            SELECT id, name, email, created_at
            FROM users
            WHERE google_subject = $1
          `,
          [googleUser.subject],
        );

        let user = subjectRows[0] ?? null;

        if (!user) {
          const { rows: emailRows } = await client.query(
            `
              SELECT id, name, email, created_at, google_subject
              FROM users
              WHERE email = $1
            `,
            [googleUser.email],
          );

          if (emailRows[0]) {
            const { rows: updatedRows } = await client.query(
              `
                UPDATE users
                SET google_subject = $1,
                    name = $2
                WHERE id = $3
                RETURNING id, name, email, created_at
              `,
              [googleUser.subject, googleUser.name, emailRows[0].id],
            );
            user = updatedRows[0];
          } else {
            const userId = createId();
            const createdAt = new Date().toISOString();
            const randomPassword = randomBytes(32).toString("hex");
            const { salt, hash } = hashPassword(randomPassword);

            const { rows: insertedRows } = await client.query(
              `
                INSERT INTO users (
                  id,
                  name,
                  email,
                  password_salt,
                  password_hash,
                  created_at,
                  google_subject
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING id, name, email, created_at
              `,
              [
                userId,
                googleUser.name,
                googleUser.email,
                salt,
                hash,
                createdAt,
                googleUser.subject,
              ],
            );
            user = insertedRows[0];

            await client.query(
              `
                INSERT INTO app_states (user_id, state, updated_at)
                VALUES ($1, $2::jsonb, NOW())
              `,
              [userId, JSON.stringify(createDefaultState())],
            );
          }
        }

        const token = randomBytes(32).toString("hex");
        await client.query(
          `
            INSERT INTO sessions (token, user_id, created_at, expires_at)
            VALUES ($1, $2, NOW(), NOW() + INTERVAL '14 days')
          `,
          [token, user.id],
        );

        await client.query("COMMIT");
        sendJson(response, 200, {
          token,
          user: sanitizeUser(user),
        });
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      sendError(
        response,
        400,
        error instanceof Error ? error.message : "Google sign-in failed",
      );
    }
    return;
  }

  if (url.pathname.startsWith("/api/")) {
    try {
      const token = getToken(request);
      const session = await getSession(token);

      if (url.pathname === "/api/auth/logout" && request.method === "POST") {
        if (!session) {
          sendError(response, 401, "Unauthorized");
          return;
        }

        await pool.query(`DELETE FROM sessions WHERE token = $1`, [session.token]);
        sendJson(response, 200, { ok: true });
        return;
      }

      if (!session) {
        sendError(response, 401, "Unauthorized");
        return;
      }

      const user = await getUserById(session.user_id);
      if (!user) {
        sendError(response, 401, "Unauthorized");
        return;
      }

      if (url.pathname === "/api/auth/me" && request.method === "GET") {
        sendJson(response, 200, { user: sanitizeUser(user) });
        return;
      }

      if (url.pathname === "/api/state" && request.method === "GET") {
        const state = await getStateForUser(user.id);
        sendJson(response, 200, { state });
        return;
      }

      if (url.pathname === "/api/state" && request.method === "PUT") {
        const body = await parseBody(request);
        if (!validateState(body.state)) {
          sendError(response, 400, "Invalid state payload.");
          return;
        }

        await saveStateForUser(user.id, body.state);
        sendJson(response, 200, { ok: true });
        return;
      }

      sendError(response, 404, "Not found");
    } catch (error) {
      sendError(
        response,
        500,
        error instanceof Error ? error.message : "Server error",
      );
    }
    return;
  }

  serveStatic(request, response);
});

await ensureSchema();

server.listen(PORT, () => {
  console.log(`Brewer server listening on http://localhost:${PORT}`);
});
