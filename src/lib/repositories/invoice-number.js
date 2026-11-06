export const INVOICE_PREFIX = "INV-";

export function formatInvoiceNumber(sequence) {
  return `${INVOICE_PREFIX}${String(sequence).padStart(4, "0")}`;
}

/** Returns the numeric part of `INV-0007`, or 0 for custom/other formats. */
export function parseInvoiceSequence(invoiceNumber) {
  const match = /^INV-(\d+)$/.exec(String(invoiceNumber || "").trim());
  return match ? Number(match[1]) : 0;
}
