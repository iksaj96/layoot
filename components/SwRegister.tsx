"use client";

import { useEffect } from "react";

export default function SwRegister() {
  useEffect(() => {
    if (
      process.env.NODE_ENV !== "production" ||
      !("serviceWorker" in navigator)
    )
      return;

    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .catch((err) => console.error("SW gagal didaftarkan:", err));
  }, []);

  return null;
}