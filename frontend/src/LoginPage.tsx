import { useState, useEffect, useRef, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./auth";

interface LoginErrorBody {
  error?: string;
  message?: string;
}

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [invalidField, setInvalidField] = useState<"username" | "password" | "both" | null>(null);
  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.title = "Log in – BuggyBoard";
    usernameRef.current?.focus();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setInvalidField(null);
    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = (await res.json().catch(() => ({}))) as LoginErrorBody;

      if (res.ok) {
        const name = (data as { username?: string }).username ?? username.trim();
        login(name);
        navigate("/board", { replace: true });
        return;
      }

      const message =
        typeof data.message === "string"
          ? data.message
          : data.error === "blank_username"
            ? "Username cannot be blank."
            : data.error === "blank_password"
              ? "Password cannot be blank."
              : data.error === "missing_credentials"
                ? "Please enter your username and password."
                : "Invalid username or password.";
      setError(message);
      // Put the user back in the field they need to fix, rather than leaving focus nowhere.
      const field =
        data.error === "blank_password" ? "password" : data.error === "blank_username" ? "username" : "both";
      setInvalidField(field);
      (field === "password" ? passwordRef : usernameRef).current?.focus();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-stone-100">
      <div className="w-full max-w-sm rounded-lg bg-white p-8 shadow-md">
        <div className="flex flex-col items-center mb-6">
          <div className="rounded-lg overflow-hidden bg-stone-200 ring-1 ring-stone-300 mb-3">
            <img
              src="/logo_50x50.png"
              alt=""
              width={50}
              height={50}
              className="block"
            />
          </div>
          <h1 className="text-2xl font-bold text-stone-800">BuggyBoard</h1>
          <h2 className="text-stone-600 mt-1 font-medium">Log in</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-stone-700 mb-1"
            >
              Username
            </label>
            <input
              id="username"
              ref={usernameRef}
              type="text"
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded border border-stone-500 px-3 py-2 text-stone-800 focus:border-stone-600 focus:outline-none focus:ring-1 focus:ring-stone-600"
              readOnly={loading}
              aria-invalid={invalidField === "username" || invalidField === "both" || undefined}
              aria-describedby={invalidField === "username" || invalidField === "both" ? "login-error" : undefined}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-stone-700 mb-1"
            >
              Password
            </label>
            <input
              id="password"
              ref={passwordRef}
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded border border-stone-500 px-3 py-2 text-stone-800 focus:border-stone-600 focus:outline-none focus:ring-1 focus:ring-stone-600"
              readOnly={loading}
              aria-invalid={invalidField === "password" || invalidField === "both" || undefined}
              aria-describedby={invalidField === "password" || invalidField === "both" ? "login-error" : undefined}
            />
          </div>

          {error && (
            <p id="login-error" className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            aria-disabled={loading || undefined}
            className="w-full rounded bg-primary py-2 px-4 font-medium text-stone-800 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-stone-600 focus:ring-offset-2 aria-disabled:opacity-50 aria-disabled:cursor-not-allowed"
          >
            {loading ? "Logging in…" : "Login"}
          </button>
        </form>
      </div>
    </main>
  );
}
