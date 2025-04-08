import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/videos/")({
  component: VideosComponent,
});

function VideosComponent() {
  return <div className="p-2">Hello from Videos!</div>;
}
