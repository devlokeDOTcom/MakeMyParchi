import { cn, numberToWords } from "@/lib/utils";

export const INVOICE_DOCUMENT_ROOT_ID = "invoice-document-root";

function formatCurrency(amount) {
  return Number(amount || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * Single source of truth for invoice layout: preview in the app, browser print,
 * and PDF export (canvas snapshot) all render this component.
 *
 * Customize the invoice here only.
 */
export function InvoiceDocument({
  business,
  bank,
  customer,
  invoiceMeta,
  lineItems,
  totalAmount,
  className = "",
}) {
  const amountWords = numberToWords(Math.round(totalAmount))
    .toLowerCase()
    .replace(/(^\s*\w|[.!?]\s*\w)/g, (c) => c.toUpperCase());

  return (
    <div
      id={INVOICE_DOCUMENT_ROOT_ID}
      data-invoice-document
      className={cn(
        "w-full bg-white text-sm text-black [color-scheme:light]",
        className,
      )}
    >
      <header className="flex justify-between gap-6 border-b border-black/10 pb-6 mb-6">
        <section>
          <h2 className="text-2xl font-bold">
            {business.name || "Your Business"}
          </h2>
          {business.description ? (
            <p className="text-black/60 mt-1">{business.description}</p>
          ) : null}
          {business.address ? (
            <p className="text-black/70 mt-2 whitespace-pre-wrap">
              {business.address}
            </p>
          ) : null}
          <div className="mt-3 space-y-1 text-black/60">
            {business.gstin ? <p>GSTIN: {business.gstin}</p> : null}
            {business.phone ? <p>Phone: {business.phone}</p> : null}
            {business.email ? <p>Email: {business.email}</p> : null}
          </div>
        </section>

        <section className="text-right shrink-0">
          <p className="text-xl font-bold tracking-wide">TAX INVOICE</p>
          <p className="mt-3">
            <span className="text-black/50">Invoice No.</span>
            <br />
            {invoiceMeta.invoiceNumber || "—"}
          </p>
          <p className="mt-2">
            <span className="text-black/50">Date</span>
            <br />
            {formatDate(invoiceMeta.invoiceDate)}
          </p>
          <p className="mt-2">
            <span className="text-black/50">Due Date</span>
            <br />
            {formatDate(invoiceMeta.dueDate)}
          </p>
          {invoiceMeta.memoNo ? (
            <p className="mt-2">
              <span className="text-black/50">Memo</span>
              <br />
              {invoiceMeta.memoNo}
            </p>
          ) : null}
        </section>
      </header>

      <section className="mb-6">
        <p className="text-xs uppercase tracking-wider text-black/50 mb-2">
          Bill To
        </p>
        <p className="font-semibold">{customer.name || "Customer"}</p>
        {customer.address ? (
          <p className="text-black/70 mt-1 whitespace-pre-wrap">
            {customer.address}
          </p>
        ) : null}
        <div className="mt-2 space-y-1 text-black/60">
          {customer.gstin ? <p>GSTIN: {customer.gstin}</p> : null}
          {customer.phone ? <p>Phone: {customer.phone}</p> : null}
          {customer.email ? <p>Email: {customer.email}</p> : null}
        </div>
      </section>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-black/[3%] border-y border-black/10">
            <th className="p-2 text-left w-12">#</th>
            <th className="p-2 text-left">Description</th>
            <th className="p-2 text-center w-16">Qty</th>
            <th className="p-2 text-right w-24">Unit Price</th>
            <th className="p-2 text-center w-16">GST</th>
            <th className="p-2 text-right w-28">Amount</th>
          </tr>
        </thead>
        <tbody>
          {lineItems.length > 0 ? (
            lineItems.map((item, index) => (
              <tr key={item.id} className="border-b border-black/5">
                <td className="p-2 text-center">{index + 1}</td>
                <td className="p-2">{item.desc}</td>
                <td className="p-2 text-center">{item.qtn}</td>
                <td className="p-2 text-right">
                  ₹ {formatCurrency(item.unitPrice)}
                </td>
                <td className="p-2 text-center">
                  {item.gst ? `${item.gst}%` : "—"}
                </td>
                <td className="p-2 text-right">
                  ₹ {formatCurrency(item.totalAmount)}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6} className="p-4 text-center text-black/40">
                No line items yet
              </td>
            </tr>
          )}
        </tbody>
        <tfoot>
          <tr className="border-t border-black/10 font-semibold">
            <td colSpan={5} className="p-3 text-right">
              Total
            </td>
            <td className="p-3 text-right">₹ {formatCurrency(totalAmount)}</td>
          </tr>
          <tr>
            <td colSpan={2} className="p-3 text-black/60">
              Amount in words
            </td>
            <td colSpan={4} className="p-3 text-right">
              {amountWords} rupees only
            </td>
          </tr>
        </tfoot>
      </table>

      {(bank.bankName || bank.accountNo || bank.ifsc) && (
        <section className="mt-8 pt-6 border-t border-black/10">
          <p className="text-xs uppercase tracking-wider text-black/50 mb-2">
            Bank Details
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-black/70">
            {bank.bankName ? <p>Bank: {bank.bankName}</p> : null}
            {bank.accountName ? (
              <p>Account Name: {bank.accountName}</p>
            ) : null}
            {bank.accountNo ? <p>Account No: {bank.accountNo}</p> : null}
            {bank.ifsc ? <p>IFSC: {bank.ifsc}</p> : null}
            {bank.branchCode ? <p>Branch: {bank.branchCode}</p> : null}
            {bank.pan ? <p>PAN: {bank.pan}</p> : null}
          </div>
        </section>
      )}
    </div>
  );
}
