"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ExportButton({ onExport }: { onExport: () => void }) {
  return (
    <Button size="sm" onClick={onExport}>
      <Download aria-hidden className="size-3.5" /> Export CSV
    </Button>
  );
}
