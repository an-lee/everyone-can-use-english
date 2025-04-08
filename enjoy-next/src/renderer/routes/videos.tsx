import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/videos")({
  component: Videos,
});

function Videos() {
  return <div className="p-2">Hello from Videos!</div>;
}
