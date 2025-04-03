import * as React from "react";

export function useSystem() {
  const [system, setSystem] = React.useState<"macos" | "windows" | "linux">(
    "macos"
  );

  React.useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (userAgent.includes("mac")) {
      setSystem("macos");
    } else if (userAgent.includes("win")) {
      setSystem("windows");
    } else {
      setSystem("linux");
    }
  }, []);

  return system;
}
