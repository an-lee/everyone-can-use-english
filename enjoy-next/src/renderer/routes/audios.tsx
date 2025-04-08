import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/audios")({
  component: Audios,
});

function Audios() {
  return <div className="p-2">Hello from Audios!</div>;
}
