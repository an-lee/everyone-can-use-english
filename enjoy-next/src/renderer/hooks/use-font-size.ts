import { useEffect } from "react";
import { useSettingsStore } from "../store";

export function useFontSize() {
  const { fontSize } = useSettingsStore();

  useEffect(() => {
    const root = window.document.documentElement;

    // Also set the CSS variable directly for compatibility
    root.style.setProperty("font-size", `${fontSize}px`);
  }, [fontSize]);

  return { fontSize };
}
