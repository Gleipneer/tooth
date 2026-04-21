import { LoginForm } from "../components/LoginForm";
import { useSession } from "../app/session";
import { Navigate } from "react-router-dom";

export function AuthScreen() {
  const { signIn, error, token } = useSession();

  if (token) {
    return <Navigate to="/write" replace />;
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1>Tooth</h1>
        <p className="muted">Conversation-first writing workspace.</p>
        {error ? (
          <p className="form-error" role="alert">
            {error}
          </p>
        ) : null}
        <LoginForm onLoggedIn={signIn} />
      </section>
    </main>
  );
}
