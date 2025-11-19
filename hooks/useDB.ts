"use client";
import { useEffect, useState } from "react";
import { initDB, VeroDb } from "@/lib/db";

export function useDB() {
  const [db, setDb] = useState<VeroDb | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    initDB()
      .then((db) => {
        if (isMounted) {
          setDb(db);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return { db, loading, error };
}
