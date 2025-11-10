import React, { FormEvent, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../auth/AuthProvider";
import "./login.css";

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: Location })?.from?.pathname ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch (err) {
      console.error("Login error:", err);
      setError((err as Error).message ?? "Credenciales inválidas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1>Backoffice Saloom</h1>
        <p>Ingresa tus credenciales para continuar.</p>

        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />

        <label htmlFor="password">Contraseña</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        {error ? <p className="error">{error}</p> : null}

        <button type="submit" disabled={loading}>
          {loading ? "Validando..." : "Ingresar"}
        </button>
      </form>
    </div>
  );
};
