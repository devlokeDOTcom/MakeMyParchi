/**
 * PLACEHOLDER — Supabase implementation of the data repository.
 *
 * Not wired up yet. To connect Supabase:
 *   1. `npm i @supabase/supabase-js` and create a client from
 *      NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY.
 *   2. Create the tables below (and add row-level security per user).
 *   3. Implement each method with the same signature and return shape as
 *      `local-repository.js` (camelCase records; map to/from snake_case columns).
 *   4. Set NEXT_PUBLIC_DATA_PROVIDER=supabase.
 *
 * Suggested schema:
 *
 *   create table invoices (
 *     id uuid primary key default gen_random_uuid(),
 *     user_id uuid not null references auth.users,
 *     invoice_number text not null,
 *     status text not null check (status in ('draft','sent','paid')),
 *     due_date date,
 *     payable numeric(12,2) not null default 0,
 *     data jsonb not null,            -- business, bank, customer, invoiceMeta, lineItems, totals
 *     paid_at timestamptz,
 *     created_at timestamptz not null default now(),
 *     updated_at timestamptz not null default now(),
 *     unique (user_id, invoice_number)
 *   );
 *
 *   create table customers (
 *     id uuid primary key default gen_random_uuid(),
 *     user_id uuid not null references auth.users,
 *     name text not null,
 *     address text, gstin text, phone text, email text,
 *     created_at timestamptz not null default now()
 *   );
 *
 *   -- peekNextInvoiceNumber: use a per-user counter row (or a sequence) so
 *   -- numbers are never reused after a delete.
 */

function notImplemented(method) {
  return async () => {
    throw new Error(
      `Supabase repository: "${method}" is not implemented yet. See src/lib/repositories/supabase-repository.js.`,
    );
  };
}

export const supabaseRepository = {
  listInvoices: notImplemented("listInvoices"),
  getInvoice: notImplemented("getInvoice"),
  saveInvoice: notImplemented("saveInvoice"),
  deleteInvoice: notImplemented("deleteInvoice"),
  peekNextInvoiceNumber: notImplemented("peekNextInvoiceNumber"),
  listCustomers: notImplemented("listCustomers"),
  saveCustomer: notImplemented("saveCustomer"),
  deleteCustomer: notImplemented("deleteCustomer"),
};
