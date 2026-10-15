"use client";

import { useEffect } from "react";
import { GOOGLE_FONTS_URL } from "../core/fonts";

/** Memasang stylesheet Google Fonts satu kali. */
export function useGoogleFonts() {
  useEffect(() => {
    const id = "layoot-google-fonts";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = GOOGLE_FONTS_URL;
    document.head.appendChild(link);
  }, []);
}