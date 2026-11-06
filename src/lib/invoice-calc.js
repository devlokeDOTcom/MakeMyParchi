/**
 * Single source of truth for invoice maths. Used by the editor, the invoice
 * document, saved-invoice totals and the invoice list.
 */

export function toNumber(value) {
  return Number(value) || 0;
}

export function calculateLineAmounts(qtn, unitPrice, gst) {
  const taxable = toNumber(qtn) * toNumber(unitPrice);
  const gstValue = (taxable * toNumber(gst)) / 100;
  return { taxable, gstValue, total: taxable + gstValue };
}

export function summarizeLineItems(lineItems = []) {
  let taxable = 0;
  let gstValue = 0;
  let total = 0;

  for (const item of lineItems) {
    const line = calculateLineAmounts(item.qtn, item.unitPrice, item.gst);
    taxable += line.taxable;
    gstValue += line.gstValue;
    total += line.total;
  }

  const rounded = Number(total.toFixed(2));
  const payable = Math.ceil(rounded);

  return {
    taxable,
    gstValue,
    total: rounded,
    roundOff: payable - rounded,
    payable,
  };
}

export function validateInvoiceForExport({ lineItems, business }) {
  const errors = [];

  if (!business?.name?.trim()) {
    errors.push("Add your business name under the Business tab.");
  }
  if (!lineItems?.length) {
    errors.push("Add at least one line item on the Invoice tab.");
  }

  return errors;
}

export function formatCurrency(amount) {
  return Number(amount || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatDate(dateStr) {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
