import { createServer } from "node:http";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync, createReadStream } from "node:fs";
import { extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, "..");
const DATA_DIR = join(__dirname, ".data");
const DATA_FILE = join(DATA_DIR, "db.json");
const DIST_DIR = join(__dirname, "dist");
const PUBLIC_DIR = join(__dirname, "public");
const PORT = Number(process.env.PORT ?? 3001);
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14;

const BREW_METHODS = ["V60", "Chemex", "Kalita", "AeroPress", "French press", "Espresso", "Cold brew"];

const createId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const template = (name, method, dose, water, grindSize, waterTemp, numberOfPours, pourTiming, totalBrewTime, filterType) => ({
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
  template("James Hoffmann V60", "V60", 30, 500, "Medium-fine", 96, 5, "0:00 bloom, then pours every 30s", "3:30", "Paper"),
  template("My Daily V60", "V60", 18, 300, "Medium", 94, 4, "Pulse pours every 25s", "2:50", "Paper"),
  template("Stronger Iced Pourover", "Kalita", 24, 220, "Medium-fine", 95, 4, "Short aggressive pulses", "2:40", "Wave paper"),
];

const createDefaultState = () => ({
  beans: [],
  brews: [],
  templates: seededTemplates(),
});

const ensureDb = () => {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!existsSync(DATA_FILE)) {
    writeFileSync(
      DATA_FILE,
      JSON.stringify(
        {
          users: [],
          sessions: [],
          states: {},
        },
        null,
        2,
      ),
    );
  }
};

const readDb = () => {
  ensureDb();
  return JSON.parse(readFileSync(DATA_FILE, "utf8"));
};

const writeDb = (db) => {
  writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
};

const hashPassword = (password, salt = randomBytes(16).toString("hex")) => {
  const hash = scryptSync(password, salt, 64).toString("hex");
  return { salt, hash };
};

const verifyPassword = (password, salt, expectedHash) => {
  const actualHash = scryptSync(password, salt, 64);
  const expected = Buffer.from(expectedHash, "hex");
  return actualHash.length === expected.length && timingSafeEqual(actualHash, expected);
};

const sanitizeUser = (user) => ({
  id: user.id,
  name: user.name ?? user.email,
  email: user.email,
  createdAt: user.createdAt,
});

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

const getSession = (db, token) => {
  if (!token) {
    return null;
  }

  const session = db.sessions.find((entry) => entry.token === token);
  if (!session) {
    return null;
  }

  if (Date.now() > new Date(session.expiresAt).getTime()) {
    db.sessions = db.sessions.filter((entry) => entry.token !== token);
    writeDb(db);
    return null;
  }

  return session;
};

const validateState = (state) => {
  if (!state || typeof state !== "object") {
    return false;
  }

  return Array.isArray(state.beans) && Array.isArray(state.brews) && Array.isArray(state.templates);
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

      const db = readDb();
      if (db.users.some((user) => user.email === email)) {
        sendError(response, 409, "An account with that email already exists.");
        return;
      }

      const { salt, hash } = hashPassword(password);
      const user = {
        id: createId(),
        name,
        email,
        passwordSalt: salt,
        passwordHash: hash,
        createdAt: new Date().toISOString(),
      };
      const token = randomBytes(32).toString("hex");

      db.users.push(user);
      db.sessions.push({
        token,
        userId: user.id,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
      });
      db.states[user.id] = createDefaultState();
      writeDb(db);

      sendJson(response, 201, {
        token,
        user: sanitizeUser(user),
      });
    } catch (error) {
      sendError(response, 400, error instanceof Error ? error.message : "Registration failed");
    }
    return;
  }

  if (url.pathname === "/api/auth/login" && request.method === "POST") {
    try {
      const body = await parseBody(request);
      const email = String(body.email ?? "").trim().toLowerCase();
      const password = String(body.password ?? "");
      const db = readDb();
      const user = db.users.find((entry) => entry.email === email);

      if (!user || !verifyPassword(password, user.passwordSalt, user.passwordHash)) {
        sendError(response, 401, "Invalid email or password.");
        return;
      }

      const token = randomBytes(32).toString("hex");
      db.sessions.push({
        token,
        userId: user.id,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
      });
      writeDb(db);

      sendJson(response, 200, {
        token,
        user: sanitizeUser(user),
      });
    } catch (error) {
      sendError(response, 400, error instanceof Error ? error.message : "Login failed");
    }
    return;
  }

  if (url.pathname.startsWith("/api/")) {
    const db = readDb();
    const token = getToken(request);
    const session = getSession(db, token);

    if (url.pathname === "/api/auth/logout" && request.method === "POST") {
      if (!session) {
        sendError(response, 401, "Unauthorized");
        return;
      }

      db.sessions = db.sessions.filter((entry) => entry.token !== session.token);
      writeDb(db);
      sendJson(response, 200, { ok: true });
      return;
    }

    if (!session) {
      sendError(response, 401, "Unauthorized");
      return;
    }

    const user = db.users.find((entry) => entry.id === session.userId);
    if (!user) {
      sendError(response, 401, "Unauthorized");
      return;
    }

    if (url.pathname === "/api/auth/me" && request.method === "GET") {
      sendJson(response, 200, { user: sanitizeUser(user) });
      return;
    }

    if (url.pathname === "/api/state" && request.method === "GET") {
      const state = db.states[user.id] ?? createDefaultState();
      if (!db.states[user.id]) {
        db.states[user.id] = state;
        writeDb(db);
      }
      sendJson(response, 200, { state });
      return;
    }

    if (url.pathname === "/api/state" && request.method === "PUT") {
      try {
        const body = await parseBody(request);
        if (!validateState(body.state)) {
          sendError(response, 400, "Invalid state payload.");
          return;
        }

        db.states[user.id] = body.state;
        writeDb(db);
        sendJson(response, 200, { ok: true });
      } catch (error) {
        sendError(response, 400, error instanceof Error ? error.message : "Could not save state");
      }
      return;
    }

    sendError(response, 404, "Not found");
    return;
  }

  serveStatic(request, response);
});

server.listen(PORT, () => {
  console.log(`Brewer server listening on http://localhost:${PORT}`);
});
