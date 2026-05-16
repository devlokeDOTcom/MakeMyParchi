import { STORAGE_KEY, getDefaultInvoiceState } from "./invoice-defaults";

export function loadInvoiceState() {
  if (typeof window === "undefined") {
    return getDefaultInvoiceState();
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultInvoiceState();

    const parsed = JSON.parse(raw);
    return {
      ...getDefaultInvoiceState(),
      ...parsed,
      business: { ...getDefaultInvoiceState().business, ...parsed.business },
      bank: { ...getDefaultInvoiceState().bank, ...parsed.bank },
      customer: { ...getDefaultInvoiceState().customer, ...parsed.customer },
      invoiceMeta: {
        ...getDefaultInvoiceState().invoiceMeta,
        ...parsed.invoiceMeta,
      },
      lineItems: Array.isArray(parsed.lineItems) ? parsed.lineItems : [],
    };
  } catch {
    return getDefaultInvoiceState();
  }
}

export function saveInvoiceState(state) {
  if (typeof window === "undefined") return;

  const { business, bank, customer, invoiceMeta, lineItems } = state;
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ business, bank, customer, invoiceMeta, lineItems }),
  );
}
