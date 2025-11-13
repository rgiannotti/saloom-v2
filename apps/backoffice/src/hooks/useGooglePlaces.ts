import { useEffect, useState } from "react";

declare global {
  interface Window {
    initSaloomPlaces?: () => void;
  }
}

const SCRIPT_ID = "saloom-google-maps";

export const useGooglePlaces = (apiKey: string | undefined, enabled = true, region?: string) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setLoaded(false);
      setError(null);
      return;
    }
    if (!apiKey) {
      setError("Falta configurar VITE_GOOGLE_MAPS_API_KEY.");
      return;
    }

    if (typeof window === "undefined") {
      return;
    }

    if (window.google && window.google.maps && window.google.maps.places) {
      setLoaded(true);
      return;
    }

    if (document.getElementById(SCRIPT_ID)) {
      const handler = () => setLoaded(true);
      window.initSaloomPlaces = handler;
      return;
    }

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    const regionParam = region ? `&region=${encodeURIComponent(region)}` : "";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initSaloomPlaces&loading=async${regionParam}`;
    script.async = true;
    script.onerror = () => setError("No se pudo cargar Google Maps.");
    window.initSaloomPlaces = () => setLoaded(true);
    document.body.appendChild(script);

    return () => {
      if (window.initSaloomPlaces) {
        delete window.initSaloomPlaces;
      }
    };
  }, [apiKey, enabled, region]);

  return { loaded, error };
};
