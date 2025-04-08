import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/documents")({
  component: Documents,
});

function Documents() {
  return <div className="p-2">Hello from Documents!</div>;
}
