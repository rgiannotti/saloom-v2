import React, { FormEvent, useEffect, useMemo, useState } from "react";
import { MdFolderOpen, MdLock, MdSave, MdVisibility, MdVisibilityOff } from "react-icons/md";

import { useAuth } from "../auth/AuthProvider";
import { API_BASE_URL } from "../config";
import "./settings.css";

interface FtpSettings {
  host: string;
  port: number;
  username: string;
  password: string;
  remotePath: string;
  passive: boolean;
  secure: boolean;
  publicDomain: string;
}

interface SettingsData {
  ftp: FtpSettings;
}

const defaultFtp: FtpSettings = {
  host: "",
  port: 21,
  username: "",
  password: "",
  remotePath: "/",
  passive: true,
  secure: false,
  publicDomain: ""
};

export const SettingsPage = () => {
  const { token } = useAuth();
  const [ftp, setFtp] = useState<FtpSettings>(defaultFtp);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [validating, setValidating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const authHeaders = useMemo(() => {
    if (!token) return null;
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    };
  }, [token]);

  const fetchSettings = async () => {
    if (!authHeaders) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/settings`, { headers: authHeaders });
      if (!response.ok) throw new Error("No se pudo cargar la configuración");
      const data = (await response.json()) as SettingsData;
      if (data.ftp) {
        setFtp({ ...defaultFtp, ...data.ftp });
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authHeaders]);

  const handleFtpChange = (field: keyof FtpSettings, value: string | number | boolean) => {
    setFtp((prev) => ({ ...prev, [field]: value }));
    setSuccess(false);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!authHeaders) return;
    setError(null);
    setSuccess(false);

    // Step 1: validate FTP connection
    setValidating(true);
    try {
      const testRes = await fetch(`${API_BASE_URL}/settings/ftp/test`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify(ftp)
      });
      const testData = (await testRes.json()) as { ok: boolean; message: string };
      if (!testData.ok) {
        setError(`Validación FTP fallida: ${testData.message}`);
        return;
      }
    } catch (err) {
      setError(`No se pudo validar la conexión FTP: ${(err as Error).message}`);
      return;
    } finally {
      setValidating(false);
    }

    // Step 2: save settings
    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/settings`, {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify({ ftp })
      });
      if (!response.ok) throw new Error("No se pudo guardar la configuración");
      setSuccess(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!token) return <p>Inicia sesión para acceder a la configuración.</p>;

  return (
    <div className="settings-page">
      <header className="settings-page__header">
        <div>
          <h1>Configuración</h1>
          <p>Administra los parámetros del sistema.</p>
        </div>
      </header>

      {loading ? (
        <p className="settings-page__loading">Cargando configuración…</p>
      ) : (
        <form className="settings-page__form" onSubmit={handleSubmit}>
          <section className="settings-section">
            <div className="settings-section__title">
              <span className="settings-section__icon" aria-hidden="true">
                <MdFolderOpen />
              </span>
              <div>
                <h2>Configuración FTP</h2>
                <p>Servidor de transferencia de archivos para subida de contenido.</p>
              </div>
            </div>

            <div className="settings-section__body">
              <div className="settings-grid">
                <div className="settings-field settings-field--wide">
                  <label htmlFor="ftp-host">Host</label>
                  <input
                    id="ftp-host"
                    type="text"
                    placeholder="ftp.ejemplo.com"
                    value={ftp.host}
                    onChange={(e) => handleFtpChange("host", e.target.value)}
                  />
                </div>

                <div className="settings-field">
                  <label htmlFor="ftp-port">Puerto</label>
                  <input
                    id="ftp-port"
                    type="number"
                    min={1}
                    max={65535}
                    value={ftp.port}
                    onChange={(e) => handleFtpChange("port", Number(e.target.value))}
                  />
                </div>

                <div className="settings-field">
                  <label htmlFor="ftp-username">Usuario</label>
                  <input
                    id="ftp-username"
                    type="text"
                    autoComplete="off"
                    value={ftp.username}
                    onChange={(e) => handleFtpChange("username", e.target.value)}
                  />
                </div>

                <div className="settings-field">
                  <label htmlFor="ftp-password">
                    <span>
                      <MdLock size={14} />
                    </span>{" "}
                    Contraseña
                  </label>
                  <div className="settings-field__password">
                    <input
                      id="ftp-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      value={ftp.password}
                      onChange={(e) => handleFtpChange("password", e.target.value)}
                    />
                    <button
                      type="button"
                      className="ghost-button settings-field__eye"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    >
                      {showPassword ? <MdVisibilityOff /> : <MdVisibility />}
                    </button>
                  </div>
                </div>

                <div className="settings-field settings-field--wide">
                  <label htmlFor="ftp-remote-path">Ruta remota</label>
                  <input
                    id="ftp-remote-path"
                    type="text"
                    placeholder="/public_html/uploads"
                    value={ftp.remotePath}
                    onChange={(e) => handleFtpChange("remotePath", e.target.value)}
                  />
                </div>

                <div className="settings-field settings-field--wide">
                  <label htmlFor="ftp-public-domain">Dominio público</label>
                  <input
                    id="ftp-public-domain"
                    type="text"
                    placeholder="https://cdn.ejemplo.com"
                    value={ftp.publicDomain}
                    onChange={(e) => handleFtpChange("publicDomain", e.target.value)}
                  />
                </div>

                <div className="settings-field settings-field--checkbox">
                  <input
                    id="ftp-passive"
                    type="checkbox"
                    checked={ftp.passive}
                    onChange={(e) => handleFtpChange("passive", e.target.checked)}
                  />
                  <label htmlFor="ftp-passive">Modo pasivo</label>
                </div>

                <div className="settings-field settings-field--checkbox">
                  <input
                    id="ftp-secure"
                    type="checkbox"
                    checked={ftp.secure}
                    onChange={(e) => handleFtpChange("secure", e.target.checked)}
                  />
                  <label htmlFor="ftp-secure">Conexión segura (FTPS)</label>
                </div>
              </div>
            </div>
          </section>

          {error ? (
            <p className="error" role="alert">
              {error}
            </p>
          ) : null}

          {success ? (
            <p className="settings-page__success" role="status">
              Configuración guardada correctamente.
            </p>
          ) : null}

          <div className="settings-page__actions">
            <button type="submit" className="primary-button" disabled={validating || submitting}>
              <MdSave />
              {validating ? "Validando conexión…" : submitting ? "Guardando…" : "Guardar cambios"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
