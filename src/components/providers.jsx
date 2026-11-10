"use client";

import { CommandPalette } from "@/components/command-palette";
import { DevServiceWorkerReset } from "@/components/dev-sw-reset";
import { InvoiceProvider } from "@/context/invoice-context";

export function Providers({ children }) {
  return (
    <InvoiceProvider>
      <DevServiceWorkerReset />
      {children}
      <CommandPalette />
    </InvoiceProvider>
  );
}
