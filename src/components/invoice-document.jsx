"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  calculateItemAmounts,
  formatCurrency,
  formatDate,
  formatRoundOff,
  summarizeLineItems,
  toNumber,
} from "@/lib/invoice-calc";
import { isBookTemplate } from "@/lib/invoice-templates";
import { cn, numberToWords } from "@/lib/utils";

export const INVOICE_DOCUMENT_ROOT_ID = "invoice-document-root";
export const INVOICE_PAGE_SELECTOR = "[data-invoice-page]";

const PAGE_WIDTH = "210mm";
const PAGE_HEIGHT = "297mm";
const PAGE_PADDING = 28;
// Safety margin so rounding differences never push a row past the footer.
const BODY_BUFFER = 8;

function InvoiceHeader({ business, invoiceMeta }) {
  return (
    <header className="flex justify-between gap-6 border-b border-black/10 pb-3 mb-3">
      <section className="w-1/2 flex flex-col">
        <div className="flex flex-col w-full">
          <h2 className="text-3xl font-bold leading-tight">
            {business.name || "Your Business"}
          </h2>
          {business.description ? (
            <p className="text-black/40 text-xs">{business.description}</p>
          ) : null}
          {business.address ? (
            <p className="text-black/70 text-xs whitespace-pre-wrap">
              {business.address}
            </p>
          ) : null}
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-black/60">
          {business.gstin ? (
            <p>
              <span className="font-bold">GSTIN: </span>
              {business.gstin}
            </p>
          ) : null}
          {business.phone ? (
            <p>
              <span className="font-bold">Phone: </span> {business.phone}
            </p>
          ) : null}
          {business.email ? (
            <p>
              <span className="font-bold">Email: </span> {business.email}
            </p>
          ) : null}
        </div>
      </section>

      <section className="text-right shrink-0">
        <p className="text-lg font-bold tracking-wide">
          <span>Tax Invoice</span>
        </p>
        <div className="mt-2 flex flex-col items-end gap-1.5 text-xs">
          <p>
            <span className="text-black/50">Invoice No.</span>
            <br />
            {invoiceMeta.invoiceNumber || "—"}
          </p>
          <p>
            <span className="text-black/50">Date</span>
            <br />
            {formatDate(invoiceMeta.invoiceDate)}
          </p>
          <p>
            <span className="text-black/50">Due Date</span>
            <br />
            {formatDate(invoiceMeta.dueDate)}
          </p>
        </div>
      </section>
    </header>
  );
}

function InvoiceCustomer({ customer, invoiceMeta }) {
  return (
    <section className="mb-3 w-full flex justify-between">
      <div className="w-[400px] pr-4">
        <p className="text-xs uppercase tracking-wider text-black/50 mb-1">
          Bill To
        </p>
        <p className="font-semibold text-sm">{customer.name || "Customer"}</p>
        {customer.address ? (
          <p className="text-black/70 text-xs whitespace-pre-wrap">
            {customer.address}
          </p>
        ) : null}
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-black/60 text-xs">
          {customer.gstin ? <p>GSTIN: {customer.gstin}</p> : null}
          {customer.phone ? <p>Phone: {customer.phone}</p> : null}
          {customer.email ? <p>Email: {customer.email}</p> : null}
        </div>
      </div>
      <div className="flex flex-col w-fit h-full text-right text-xs">
        {invoiceMeta.memoNo ? (
          <p className="mb-1">
            <span className="text-black/50">Order Memo no.</span>
            <br />
            {invoiceMeta.memoNo}
          </p>
        ) : null}
        <p>
          <span className="text-black/50">Order Date</span>
          <br />
          {formatDate(invoiceMeta.orderDate)}
        </p>
      </div>
    </section>
  );
}

function InvoiceFooter({ bank, pageNumber, pageCount, isLast }) {
  return (
    <footer className="mt-3">
      {isLast ? (
      <div className="w-full flex gap-10">
        {(bank.bankName || bank.accountNo || bank.ifsc) ? (
          <section className="w-2/3">
            <p className="text-xs uppercase tracking-wider text-black/50 mb-1">
              Bank Details
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-black/70">
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
        ) : null}
        <div className="flex-1 flex flex-col justify-end text-xs">
          <div className="w-full flex justify-end py-1">
            <p className="border-y py-1 w-fit px-6 italic text-xs font-medium text-black/50">
              Authority Signature
            </p>
          </div>
        </div>
      </div>
      ) : null}
      <div className="w-full mt-3">
        <p className="text-slate-500 text-xs w-full mb-1 italic">
          {"This is Challan cum Tax invoice. No separate Challan is required"}
        </p>
        <p className="text-black/30 text-[10px] leading-snug">
          {
            "**Remarks** This invoice is valid only with an authorized signature and is issued in accordance with applicable GST laws and regulations. Company seal/stamp may not be required in all cases as per digital invoicing and business policies. After full payment, the seller is bound to sign all copies of the invoice generated."
          }
        </p>
      </div>
      {pageCount > 1 ? (
        <p className="mt-1 text-right text-[10px] text-black/40">
          Page {pageNumber} of {pageCount}
        </p>
      ) : null}
    </footer>
  );
}

const STANDARD_COLUMNS = [
  { label: "SL No.", width: 40, align: "text-left" },
  { label: "Description", align: "text-left" },
  { label: "Qty", width: 48, align: "text-center" },
  { label: "Unit Price", width: 84, align: "text-right" },
  { label: "Taxable Amount", width: 96, align: "text-center" },
  { label: "GST (%)", width: 56, align: "text-center text-nowrap" },
  { label: "GST Value", width: 84, align: "text-center text-nowrap" },
  { label: "Amount", width: 96, align: "text-right" },
];

const BOOK_COLUMNS = [
  { label: "SL No.", width: 34, align: "text-left" },
  { label: "Book Name", align: "text-left" },
  { label: "Author Name", width: 84, align: "text-left" },
  { label: "Publishers", width: 84, align: "text-left" },
  { label: "Quantity", width: 50, align: "text-center" },
  { label: "Unit Price", width: 80, align: "text-right" },
  { label: "Amount", width: 84, align: "text-right" },
  { label: "Discount", width: 60, align: "text-right" },
  { label: "Total Amount", width: 98, align: "text-right" },
];

function StandardRow({ item, number }) {
  const line = calculateItemAmounts(item, "standard");
  return (
    <>
      <td className="px-2 py-[3px] text-center">{number}</td>
      <td className="px-2 py-[3px] break-words">{item.desc}</td>
      <td className="px-2 py-[3px] text-center">{item.qtn}</td>
      <td className="px-2 py-[3px] text-right">₹ {formatCurrency(item.unitPrice)}</td>
      <td className="px-2 py-[3px] text-center">
        {item.qtn && item.unitPrice ? `₹ ${line.taxable.toFixed(2)}` : "—"}
      </td>
      <td className="px-2 py-[3px] text-center">{item.gst ? `${item.gst}%` : "—"}</td>
      <td className="px-2 py-[3px] text-center">
        {item.gst ? `₹ ${line.gstValue.toFixed(2)}` : "—"}
      </td>
      <td className="px-2 py-[3px] text-right">₹ {line.total.toFixed(2)}</td>
    </>
  );
}

function BookRow({ item, number }) {
  const line = calculateItemAmounts(item, "book");
  return (
    <>
      <td className="px-2 py-[3px] text-center">{number}</td>
      <td className="px-2 py-[3px] break-words">{item.desc}</td>
      <td className="px-2 py-[3px] break-words">{item.author || "—"}</td>
      <td className="px-2 py-[3px] break-words">{item.publisher || "—"}</td>
      <td className="px-2 py-[3px] text-center">{item.qtn}</td>
      <td className="px-2 py-[3px] text-right whitespace-nowrap">
        ₹ {formatCurrency(item.unitPrice)}
      </td>
      <td className="px-2 py-[3px] text-right whitespace-nowrap">
        ₹ {line.amount.toFixed(2)}
      </td>
      <td className="px-2 py-[3px] text-right">
        {toNumber(item.discount) ? `${toNumber(item.discount)}%` : "—"}
      </td>
      <td className="px-2 py-[3px] text-right whitespace-nowrap">
        ₹ {line.total.toFixed(2)}
      </td>
    </>
  );
}

function InvoiceItemsTable({
  rows,
  startIndex,
  summary,
  template,
  showTotals,
  isEmpty,
}) {
  const isBook = isBookTemplate(template);
  const columns = isBook ? BOOK_COLUMNS : STANDARD_COLUMNS;
  const Row = isBook ? BookRow : StandardRow;
  const columnCount = columns.length;
  const amountWords = numberToWords(summary.payable)
    .toLowerCase()
    .replace(/(^\s*\w|[.!?]\s*\w)/g, (c) => c.toUpperCase());

  return (
    <table className="w-full table-fixed border-collapse text-xs">
      <colgroup>
        {columns.map(({ label, width }) => (
          <col key={label} style={width ? { width } : undefined} />
        ))}
      </colgroup>
      <thead>
        <tr className="bg-black/[3%] border-y border-black/10">
          {columns.map(({ label, align }) => (
            <th key={label} className={cn("px-2 py-1.5", align)}>
              {label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length > 0 ? (
          rows.map((item, index) => (
            <tr
              key={item.id}
              data-invoice-row
              className="border-b border-black/5"
            >
              <Row item={item} number={startIndex + index + 1} />
            </tr>
          ))
        ) : isEmpty ? (
          <tr>
            <td
              colSpan={columnCount}
              className="p-4 text-center text-black/40"
            >
              No line items yet
            </td>
          </tr>
        ) : null}
      </tbody>
      {showTotals ? (
        <tfoot>
          <tr className="border-t border-black/10 font-semibold">
            <td colSpan={isBook ? 6 : 4} className="px-3 py-1.5 text-right border-r">
              Total :
            </td>
            {isBook ? (
              <>
                <td className="px-3 py-1.5 text-right border-r whitespace-nowrap">
                  ₹ {summary.amount.toFixed(2)}
                </td>
                <td className="px-3 py-1.5 border-r"></td>
              </>
            ) : (
              <>
                <td className="px-3 py-1.5 text-center border-r whitespace-nowrap">
                  ₹ {summary.taxable.toFixed(2)}
                </td>
                <td className="px-3 py-1.5 text-right"></td>
                <td className="px-3 py-1.5 text-center border-x whitespace-nowrap">
                  ₹ {summary.gstValue.toFixed(2)}
                </td>
              </>
            )}
            <td className="px-3 py-1.5 text-right whitespace-nowrap">
              ₹ {summary.total.toFixed(2)}
            </td>
          </tr>
          <tr className="border-y">
            <td
              colSpan={columnCount - 1}
              className="px-3 py-1.5 text-right italic border-r"
            >
              Round off :
            </td>
            <td className="px-3 py-1.5 text-right italic whitespace-nowrap">
              {formatRoundOff(summary.roundOff)}
            </td>
          </tr>
          <tr className="border-y">
            <td
              colSpan={isBook ? 6 : 5}
              className="px-3 py-1.5 text-slate-500 border-r"
            >
              Amount in words :{" "}
              <span className="text-right text-slate-900 pl-5">
                {amountWords} rupees only
              </span>
            </td>
            <td colSpan={2} className="px-3 py-1.5 text-right font-bold border-r">
              Amount to pay :
            </td>
            <td className="px-3 py-1.5 text-right font-bold text-[13px] whitespace-nowrap">
              ₹ {summary.payable.toFixed(2)}
            </td>
          </tr>
        </tfoot>
      ) : null}
    </table>
  );
}

function outerHeight(element) {
  if (!element) return 0;
  const style = getComputedStyle(element);
  return (
    element.getBoundingClientRect().height +
    parseFloat(style.marginTop || 0) +
    parseFloat(style.marginBottom || 0)
  );
}

/**
 * Splits rows into pages given measured heights. The header and footer are
 * repeated on every page, "Bill To" only sits on page 1, and the totals and
 * bank details only on the last page (which therefore has a taller footer).
 * @returns {number[][]} row indices per page
 */
function paginate(rowHeights, m) {
  const bodyHeight = (isFirst, isLast = false) =>
    m.pageInner -
    m.header -
    (isLast ? m.footerLast : m.footer) -
    (isFirst ? m.customer : 0) -
    m.thead -
    BODY_BUFFER;

  const pages = [];
  let current = [];
  let used = 0;
  let available = bodyHeight(true);

  rowHeights.forEach((height, index) => {
    if (current.length && used + height > available) {
      pages.push(current);
      current = [];
      used = 0;
      available = bodyHeight(false);
    }
    current.push(index);
    used += height;
  });
  pages.push(current);

  // Totals and the taller last-page footer must fit; otherwise carry one row
  // over to a new last page.
  if (used + m.tfoot > bodyHeight(pages.length === 1, true)) {
    if (current.length > 1) {
      pages.push([current.pop()]);
    } else {
      pages.push([]);
    }
  }

  return pages;
}

export function InvoiceDocument({
  business,
  bank,
  customer,
  invoiceMeta,
  lineItems,
  template = "standard",
  className = "",
}) {
  const summary = useMemo(
    () => summarizeLineItems(lineItems, template),
    [lineItems, template],
  );
  const sandboxRef = useRef(null);
  const rootRef = useRef(null);
  const pagesRef = useRef(null);
  const [pageBreaks, setPageBreaks] = useState(null);
  // Shrinks the fixed-size A4 pages to fit narrow screens (display only).
  const [fit, setFit] = useState({ scale: 1, height: 0 });

  useEffect(() => {
    const root = rootRef.current;
    const pagesEl = pagesRef.current;
    if (!root || !pagesEl || typeof ResizeObserver === "undefined") return;

    const update = () => {
      const available = root.clientWidth;
      const scale =
        available > 0 ? Math.min(1, available / pagesEl.offsetWidth) : 1;
      setFit((prev) =>
        prev.scale === scale && prev.height === pagesEl.offsetHeight
          ? prev
          : { scale, height: pagesEl.offsetHeight },
      );
    };

    const observer = new ResizeObserver(update);
    observer.observe(root);
    observer.observe(pagesEl);
    update();
    return () => observer.disconnect();
  }, []);

  // Measure a hidden, unpaginated copy and work out where pages break.
  useEffect(() => {
    let cancelled = false;
    let timer = 0;

    const measure = () => {
      const sandbox = sandboxRef.current;
      if (cancelled || !sandbox) return;

      const pick = (name) => sandbox.querySelector(`[data-measure="${name}"]`);
      const pageHeight = pick("page").getBoundingClientRect().height;
      const rowHeights = [
        ...sandbox.querySelectorAll("[data-invoice-row]"),
      ].map((row) => row.getBoundingClientRect().height);

      setPageBreaks(
        paginate(rowHeights, {
          pageInner: pageHeight - PAGE_PADDING * 2,
          header: outerHeight(pick("header")),
          footer: outerHeight(pick("footer")),
          footerLast: outerHeight(pick("footer-last")),
          customer: outerHeight(pick("customer")),
          thead: sandbox.querySelector("thead").getBoundingClientRect().height,
          tfoot: sandbox.querySelector("tfoot").getBoundingClientRect().height,
        }),
      );
    };

    timer = setTimeout(measure, 0);
    document.fonts?.ready.then(() => {
      if (!cancelled) timer = setTimeout(measure, 0);
    });

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [business, bank, customer, invoiceMeta, lineItems, template]);

  const pages = (
    pageBreaks ?? [lineItems.map((_, index) => index)]
  ).map((indices) => indices.filter((index) => lineItems[index]));

  const pageStarts = pages.map((_, index) =>
    pages.slice(0, index).reduce((count, page) => count + page.length, 0),
  );

  return (
    <div
      ref={rootRef}
      id={INVOICE_DOCUMENT_ROOT_ID}
      data-invoice-document
      className={cn(
        "w-full overflow-hidden text-sm text-black [color-scheme:light] print:overflow-visible",
        className,
      )}
    >
      <div
        ref={sandboxRef}
        aria-hidden
        className="pointer-events-none invisible fixed top-0 -left-[10000px] print:hidden"
        style={{ width: PAGE_WIDTH, padding: PAGE_PADDING }}
      >
        <div data-measure="page" className="absolute" style={{ height: PAGE_HEIGHT }} />
        <div data-measure="header" className="flow-root">
          <InvoiceHeader business={business} invoiceMeta={invoiceMeta} />
        </div>
        <div data-measure="customer" className="flow-root">
          <InvoiceCustomer customer={customer} invoiceMeta={invoiceMeta} />
        </div>
        <InvoiceItemsTable
          rows={lineItems}
          startIndex={0}
          summary={summary}
          template={template}
          showTotals
          isEmpty={lineItems.length === 0}
        />
        <div data-measure="footer" className="flow-root">
          <InvoiceFooter bank={bank} pageNumber={1} pageCount={2} />
        </div>
        <div data-measure="footer-last" className="flow-root">
          <InvoiceFooter bank={bank} pageNumber={2} pageCount={2} isLast />
        </div>
      </div>

      <div
        data-invoice-scaler
        className="mx-auto print:!h-auto print:!w-full"
        style={{
          width: `calc((${PAGE_WIDTH} + 2px) * ${fit.scale})`,
          height: fit.scale < 1 && fit.height ? fit.height * fit.scale : undefined,
        }}
      >
      <div
        ref={pagesRef}
        data-invoice-pages
        className="flex flex-col gap-6 print:gap-0 print:!transform-none"
        style={{
          width: `calc(${PAGE_WIDTH} + 2px)`,
          transform: fit.scale < 1 ? `scale(${fit.scale})` : undefined,
          transformOrigin: "top left",
        }}
      >
      {pages.map((indices, pageIndex) => {
        const rows = indices.map((index) => lineItems[index]);
        const isFirst = pageIndex === 0;
        const isLast = pageIndex === pages.length - 1;

        return (
          <div
            key={pageIndex}
            className="invoice-page-frame mx-auto shrink-0 border border-black/10 shadow print:border-0 print:shadow-none"
          >
            <div
              data-invoice-page={pageIndex + 1}
              className="flex flex-col overflow-hidden bg-white"
              style={{
                width: PAGE_WIDTH,
                height: isLast ? undefined : PAGE_HEIGHT,
                maxHeight: PAGE_HEIGHT,
                padding: PAGE_PADDING,
              }}
            >
              <InvoiceHeader business={business} invoiceMeta={invoiceMeta} />
              {isFirst ? (
                <InvoiceCustomer
                  customer={customer}
                  invoiceMeta={invoiceMeta}
                />
              ) : null}
              <div className={cn("min-h-0", !isLast && "flex-1")}>
                <InvoiceItemsTable
                  rows={rows}
                  startIndex={pageStarts[pageIndex]}
                  summary={summary}
                  template={template}
                  showTotals={isLast}
                  isEmpty={lineItems.length === 0}
                />
              </div>
              <InvoiceFooter
                bank={bank}
                pageNumber={pageIndex + 1}
                pageCount={pages.length}
                isLast={isLast}
              />
            </div>
          </div>
        );
      })}
      </div>
      </div>
    </div>
  );
}
