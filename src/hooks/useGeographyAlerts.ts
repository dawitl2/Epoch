"use client";

import { useEffect, useState } from "react";
import type { GeographyAlert } from "@/src/lib/contracts";
import { fetchAlerts } from "@/src/services/epochApi";

export function useGeographyAlerts() {
  const [alerts, setAlerts] = useState<GeographyAlert[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let activeController: AbortController | null = null;
    const load = () => {
      activeController?.abort();
      activeController = new AbortController();
      fetchAlerts(activeController.signal)
        .then((body) => {
          setAlerts(body.alerts);
          setError(null);
        })
        .catch((caught) => {
          if (caught instanceof Error && caught.name !== "AbortError") setError(caught.message);
        });
    };
    load();
    const interval = window.setInterval(load, 5 * 60 * 1000);
    return () => {
      window.clearInterval(interval);
      activeController?.abort();
    };
  }, []);

  return { alerts, error };
}
