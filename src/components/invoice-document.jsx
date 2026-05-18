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

  let netWithOutTax = 0;
  let grossWithTax = 0;
  let totalTax = 0;
  let getTotal = (type) => {
    if (lineItems) {
      if (type === "net") {
        for (let i = 0; i < lineItems.length; i++) {
          let subTotal = lineItems[i].unitPrice * lineItems[i].qtn;
          let afterDiscount =
            subTotal - (subTotal * lineItems[i].discount) / 100;
          netWithOutTax += afterDiscount;
        }
        return netWithOutTax;
      }
      if (type === "gross") {
        for (let i = 0; i < lineItems.length; i++) {
          let subTotal = lineItems[i].unitPrice * lineItems[i].qtn;
          let afterDiscount =
            subTotal - (subTotal * lineItems[i].discount) / 100;
          grossWithTax +=
            afterDiscount + (afterDiscount * lineItems[i].gst) / 100;
        }
        return grossWithTax;
      }
      if (type === "tax") {
        for (let i = 0; i < lineItems.length; i++) {
          let subTotal = lineItems[i].unitPrice * lineItems[i].qtn;
          let afterDiscount =
            subTotal - (subTotal * lineItems[i].discount) / 100;
          totalTax += (afterDiscount * lineItems[i].gst) / 100;
        }
        return totalTax;
      }
    }
    return 0;
  };
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
        <section className="w-1/2 flex flex-col justify-between">
          <div className="flex flex-col w-full">
            <h2 className="text-4xl font-bold">
              {business.name || "Your Business"}
            </h2>
            {business.description ? (
              <p className="text-black/40 text-xs">{business.description}</p>
            ) : null}
            {business.address ? (
              <p className="text-black/70 whitespace-pre-wrap">
                {business.address}
              </p>
            ) : null}
          </div>
          <div className="mt-3 space-y-1 text-black/60">
            {business.gstin ? (
              <p>
                <span className="font-bold">GSTIN: </span>
                {business.gstin}
              </p>
            ) : null}
            {business.phone ? (
              <p>
                {" "}
                <span className="font-bold">Phone: </span> {business.phone}
              </p>
            ) : null}
            {business.email ? (
              <p>
                {" "}
                <span className="font-bold">Email: </span> {business.email}
              </p>
            ) : null}
          </div>
        </section>

        <section className="text-right shrink-0">
          <p className="text-lg font-bold tracking-wide">
            <span>Tax Invoice</span>{" "}
          </p>
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
        </section>
      </header>

      <section className="mb-6 w-full flex justify-between">
        <div className="w-[400px] pr-4">
          <p className="text-xs uppercase tracking-wider text-black/50 mb-2">
            Bill To
          </p>
          <p className="font-semibold text-sm">{customer.name || "Customer"}</p>
          {customer.address ? (
            <p className="text-black/70 text-xs whitespace-pre-wrap">
              {customer.address}
            </p>
          ) : null}
          <div className="my-4 space-y-1 text-black/60 text-xs">
            {customer.gstin ? <p>GSTIN: {customer.gstin}</p> : null}
            {customer.phone ? <p>Phone: {customer.phone}</p> : null}
            {customer.email ? <p>Email: {customer.email}</p> : null}
          </div>
        </div>
        <div className="flex flex-col w-fit h-full text-xs">
          {invoiceMeta.memoNo ? (
            <p className="mt-2">
              <span className="text-black/50">Order Memo no.</span>
              <br />
              {invoiceMeta.memoNo}
            </p>
          ) : null}
          <p className="mt-2">
            <span className="text-black/50">Date</span>
            <br />
            {formatDate(invoiceMeta.orderDate)}
          </p>
        </div>
      </section>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-black/[3%] border-y border-black/10">
            <th className="p-2 text-left w-12">SL No.</th>
            <th className="p-2 text-left">Description</th>
            <th className="p-2 text-center w-16">Qty</th>
            <th className="p-2 text-right w-24">Unit Price</th>
            <th className="p-2 text-center w-16 text-nowrap">Discount (%)</th>
            <th className="p-2 text-center w-16 text-nowrap">GST (%)</th>
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
                  ₹ {formatCurrency(Math.round(item.unitPrice))}
                </td>
                <td className="p-2 text-center">
                  {item.discount ? `${item.discount}%` : "—"}
                </td>
                <td className="p-2 text-center">
                  {item.gst ? `${item.gst}%` : "—"}
                </td>
                <td className="p-2 text-right">
                  ₹ {formatCurrency(Math.round(item.totalAmount))}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={7} className="p-4 text-center text-black/40">
                No line items yet
              </td>
            </tr>
          )}
        </tbody>
        <tfoot>
          <tr className="border-t border-black/10 font-semibold">
            <td colSpan={4} className="p-3 text-right">
              Net Total
            </td>
            <td className="p-3 text-right">
              ₹ {formatCurrency(getTotal("net"))}
            </td>
            <td className="p-3 text-right"></td>
          </tr>
          <tr className="border-t border-black/10 font-semibold">
            <td colSpan={4} className="p-3 text-right">
              Taxes{" "}
              <span className="text-xs italic font-light mx-2">
                (CGST + SGST)
              </span>
            </td>
            <td className="p-3 text-right">
              ₹ {formatCurrency(getTotal("tax"))}
            </td>
            <td className="p-3 text-right"></td>
          </tr>
          <tr className="border-t border-black/10 font-semibold">
            <td colSpan={6} className="p-3 text-right">
              Gross Total{" "}
              <span className="text-xs italic font-light mx-2">(Payable)</span>
            </td>
            <td className="p-3 text-right">
              ₹ {formatCurrency(getTotal("gross"))}
            </td>
          </tr>
          <tr className="border-y">
            <td colSpan={2} className="p-3 text-black/60">
              Amount in words
            </td>
            <td colSpan={5} className="p-3 text-right">
              {amountWords} rupees only
            </td>
          </tr>
        </tfoot>
      </table>

      <div className="w-full flex gap-10">
        {(bank.bankName || bank.accountNo || bank.ifsc) && (
          <section className="w-1/2 mt-8 pt-6 border-black/10">
            <p className="text-xs uppercase tracking-wider text-black/50 mb-2">
              Bank Details
            </p>
            <div className="grid grid-cols-1 gap-1 text-black/70">
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
        <div className="w-1/2 flex flex-col justify-end text-xs">
          <div className="w-full flex justify-end py-4">
            <p className="border-y py-1 w-fit px-10 italic text-xs font-medium text-black/50">
              Authority Signature
            </p>
          </div>
        </div>
      </div>
      <div className="w-full mt-6">
        <p className="text-slate-500 text-xs w-full mb-2 italic">
          {"This is Challan cum Tax invoice. No separate Challan is required"}
        </p>
        <p className="text-black/30 text-xs">
          {
            "**Remarks** This invoice is valid only with an authorized signature and is issued in accordance with applicable GST laws and regulations. Company seal/stamp may not be required in all cases as per digital invoicing and business policies. After full payment, the seller is bound to sign all copies of the invoice generated."
          }
        </p>
      </div>
    </div>
  );
}
