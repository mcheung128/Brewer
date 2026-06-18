import { useEffect, useRef, useState, type FormEvent } from "react";

type AuthMode = "login" | "register";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: Record<string, string | number | boolean>,
          ) => void;
        };
      };
    };
  }
}

type AuthViewProps = {
  error: string;
  googleClientId?: string;
  isSubmitting: boolean;
  onSubmit: (
    mode: AuthMode,
    name: string,
    email: string,
    password: string,
  ) => Promise<void>;
  onGoogleLogin: (credential: string) => Promise<void>;
};

function AuthView({
  error,
  googleClientId,
  isSubmitting,
  onSubmit,
  onGoogleLogin,
}: AuthViewProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const googleButtonRef = useRef<HTMLDivElement | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit(mode, name, email, password);
  };

  useEffect(() => {
    if (!googleClientId || mode !== "login") {
      return;
    }

    const renderGoogleButton = () => {
      if (!window.google || !googleButtonRef.current) {
        return;
      }

      googleButtonRef.current.innerHTML = "";
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: ({ credential }) => {
          if (credential) {
            void onGoogleLogin(credential);
          }
        },
      });
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: "outline",
        size: "large",
        text: "signin_with",
        shape: "pill",
        width: 320,
      });
    };

    if (window.google) {
      renderGoogleButton();
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://accounts.google.com/gsi/client"]',
    );

    if (existingScript) {
      existingScript.addEventListener("load", renderGoogleButton);
      return () => existingScript.removeEventListener("load", renderGoogleButton);
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.addEventListener("load", renderGoogleButton);
    document.head.appendChild(script);

    return () => script.removeEventListener("load", renderGoogleButton);
  }, [googleClientId, mode, onGoogleLogin]);

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
        {mode === "login" && googleClientId ? (
          <div className="auth-google">
            <div className="auth-divider">
              <span>or</span>
            </div>
            <div className="auth-google-button" ref={googleButtonRef} />
          </div>
        ) : null}
      </section>
    </div>
  );
}

export default AuthView;
