import { useState, type FormEvent } from "react";

type AuthMode = "login" | "register";

type AuthViewProps = {
  error: string;
  isSubmitting: boolean;
  onSubmit: (
    mode: AuthMode,
    name: string,
    email: string,
    password: string,
  ) => Promise<void>;
};

function AuthView({ error, isSubmitting, onSubmit }: AuthViewProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit(mode, name, email, password);
  };

  return (
    <div className="auth-shell">
      <section className="auth-card">
        <p className="eyebrow">Brewer</p>
        <h1>
          {mode === "login"
            ? "Sign in to your coffee logbook"
            : "Create your Brewer account"}
        </h1>

        <div className="auth-toggle">
          <button
            className={
              mode === "login"
                ? "auth-toggle-button active"
                : "auth-toggle-button"
            }
            onClick={() => setMode("login")}
            type="button"
          >
            Sign In
          </button>
          <button
            className={
              mode === "register"
                ? "auth-toggle-button active"
                : "auth-toggle-button"
            }
            onClick={() => setMode("register")}
            type="button"
          >
            Register
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === "register" ? (
            <label>
              Name
              <input
                autoComplete="name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </label>
          ) : null}
          <label>
            Email
            <input
              autoComplete="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label>
            Password
            <input
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              minLength={8}
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          {error ? <p className="auth-error">{error}</p> : null}
          <button
            className="primary-button"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting
              ? "Working..."
              : mode === "login"
                ? "Sign In"
                : "Create Account"}
          </button>
        </form>
      </section>
    </div>
  );
}

export default AuthView;
