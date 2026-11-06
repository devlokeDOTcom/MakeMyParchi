import { formatInvoiceNumber, parseInvoiceSequence } from "./invoice-number";

const INVOICES_KEY = "make-my-parchi:invoices";
const CUSTOMERS_KEY = "make-my-parchi:customers";
const SEQUENCE_KEY = "make-my-parchi:invoice-sequence";

function read(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

/**
 * Browser-only implementation of the data repository. Every method is async
 * so it can be swapped for the Supabase one without touching callers.
 */
export const localRepository = {
  async listInvoices() {
    return read(INVOICES_KEY, []).sort((a, b) =>
      b.updatedAt.localeCompare(a.updatedAt),
    );
  },

  async getInvoice(id) {
    return read(INVOICES_KEY, []).find((invoice) => invoice.id === id) ?? null;
  },

  async saveInvoice(input) {
    const invoices = read(INVOICES_KEY, []);
    const number = String(input.invoiceMeta?.invoiceNumber || "").trim();
    if (!number) throw new Error("Invoice number is required.");

    const clash = invoices.find(
      (invoice) =>
        invoice.id !== input.id && invoice.invoiceMeta.invoiceNumber === number,
    );
    if (clash) throw new Error(`Invoice number ${number} already exists.`);

    const existing = invoices.find((invoice) => invoice.id === input.id);
    const now = new Date().toISOString();
    const record = {
      ...input,
      id: existing ? existing.id : crypto.randomUUID(),
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      paidAt: input.status === "paid" ? (existing?.paidAt ?? now) : null,
    };

    write(
      INVOICES_KEY,
      existing
        ? invoices.map((invoice) => (invoice.id === record.id ? record : invoice))
        : [...invoices, record],
    );

    // Keep the counter monotonic so numbers are never reused after a delete.
    const sequence = parseInvoiceSequence(number);
    if (sequence > read(SEQUENCE_KEY, 0)) write(SEQUENCE_KEY, sequence);

    return record;
  },

  async deleteInvoice(id) {
    write(
      INVOICES_KEY,
      read(INVOICES_KEY, []).filter((invoice) => invoice.id !== id),
    );
  },

  async peekNextInvoiceNumber() {
    const highestSaved = read(INVOICES_KEY, []).reduce(
      (max, invoice) =>
        Math.max(max, parseInvoiceSequence(invoice.invoiceMeta.invoiceNumber)),
      0,
    );
    return formatInvoiceNumber(Math.max(read(SEQUENCE_KEY, 0), highestSaved) + 1);
  },

  async listCustomers() {
    return read(CUSTOMERS_KEY, []).sort((a, b) => a.name.localeCompare(b.name));
  },

  async saveCustomer(input) {
    const name = String(input.name || "").trim();
    if (!name) throw new Error("Customer name is required.");

    const customers = read(CUSTOMERS_KEY, []);
    const existing = customers.find((customer) => customer.id === input.id);
    const record = {
      id: existing ? existing.id : crypto.randomUUID(),
      name,
      address: input.address || "",
      gstin: input.gstin || "",
      phone: input.phone || "",
      email: input.email || "",
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    };

    write(
      CUSTOMERS_KEY,
      existing
        ? customers.map((customer) =>
            customer.id === record.id ? record : customer,
          )
        : [...customers, record],
    );
    return record;
  },

  async deleteCustomer(id) {
    write(
      CUSTOMERS_KEY,
      read(CUSTOMERS_KEY, []).filter((customer) => customer.id !== id),
    );
  },
};
