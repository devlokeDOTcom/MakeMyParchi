/**
 * Single source of truth for invoice maths. Used by the editor, the invoice
 * document, saved-invoice totals and the invoice list.
 */

export function toNumber(value) {
  return Number(value) || 0;
}

/**
 * `amount` is qty x price, `discountValue` is `discount` percent of it, and
 * GST is charged on what is left (`taxable`).
 */
export function calculateLineAmounts(qtn, unitPrice, gst, discount = 0) {
  const amount = toNumber(qtn) * toNumber(unitPrice);
  const discountValue = (amount * toNumber(discount)) / 100;
  const taxable = amount - discountValue;
  const gstValue = (taxable * toNumber(gst)) / 100;
  return { amount, discountValue, taxable, gstValue, total: taxable + gstValue };
}

/** Standard invoices charge GST and ignore discount; book invoices the reverse. */
export function calculateItemAmounts(item, template) {
  return template === "book"
    ? calculateLineAmounts(item.qtn, item.unitPrice, 0, item.discount)
    : calculateLineAmounts(item.qtn, item.unitPrice, item.gst, 0);
}

export function summarizeLineItems(lineItems = [], template = "standard") {
  let amount = 0;
  let discount = 0;
  let taxable = 0;
  let gstValue = 0;
  let total = 0;

  for (const item of lineItems) {
    const line = calculateItemAmounts(item, template);
    amount += line.amount;
    discount += line.discountValue;
    taxable += line.taxable;
    gstValue += line.gstValue;
    total += line.total;
  }

  // Round the grand total (never individual lines) to the nearest rupee:
  // .50 and above goes up, below .50 goes down.
  const rounded = Number(total.toFixed(2));
  const payable = Math.round(rounded);

  return {
    amount,
    discount,
    taxable,
    gstValue,
    total: rounded,
    roundOff: Number((payable - rounded).toFixed(2)) || 0,
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

/** "+ ₹ 0.37", "- ₹ 0.12" or "₹ 0.00". */
export function formatRoundOff(value) {
  if (!value) return "₹ 0.00";
  return `${value < 0 ? "-" : "+"} ₹ ${Math.abs(value).toFixed(2)}`;
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
