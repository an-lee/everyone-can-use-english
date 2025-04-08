import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/documents/")({
  component: DocumentsComponent,
});

function DocumentsComponent() {
  return <div className="p-2">Hello from Documents!</div>;
}
