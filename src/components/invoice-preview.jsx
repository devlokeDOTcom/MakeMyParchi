"use client";

import { InvoiceDocument } from "@/components/invoice-document";
import { useInvoice } from "@/context/invoice-context";

/**
 * Live invoice preview: renders the shared {@link InvoiceDocument} from context.
 * Layout is only edited in `invoice-document.jsx`.
 */
export function InvoicePreview({ className }) {
  const { business, bank, customer, invoiceMeta, lineItems, totalAmount } =
    useInvoice();

  return (
    <InvoiceDocument
      business={business}
      bank={bank}
      customer={customer}
      invoiceMeta={invoiceMeta}
      lineItems={lineItems}
      totalAmount={totalAmount}
      className={className}
    />
  );
}
