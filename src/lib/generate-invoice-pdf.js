import { jsPDF } from "jspdf";
import html2canvas from "html2canvas-pro";
import {
  INVOICE_DOCUMENT_ROOT_ID,
  INVOICE_PAGE_SELECTOR,
} from "@/components/invoice-document";

export { validateInvoiceForExport } from "./invoice-calc";

/**
 * Exports every `[data-invoice-page]` inside the invoice document as one A4 PDF
 * page (the last page is only as tall as its content). Pagination (and the repeated header/footer) is decided by
 * `InvoiceDocument`, so preview, print and PDF always match.
 */
export async function generateInvoicePdfFromElement(root, invoiceMeta) {
  const pages = root.querySelectorAll(INVOICE_PAGE_SELECTOR);
  if (!pages.length) {
    throw new Error("Invoice pages not found in the document.");
  }

  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const pageWidth = pdf.internal.pageSize.getWidth();

  for (let index = 0; index < pages.length; index += 1) {
    const canvas = await html2canvas(pages[index], {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
    });

    // The last page is only as tall as its content, so keep its aspect ratio.
    const imageHeight = (canvas.height * pageWidth) / canvas.width;

    if (index > 0) pdf.addPage();
    pdf.addImage(
      canvas.toDataURL("image/png", 1.0),
      "PNG",
      0,
      0,
      pageWidth,
      imageHeight,
    );
  }

  const fileName =
    `invoice-${invoiceMeta?.invoiceNumber || "draft"}.pdf`.replace(
      /[/\\?%*:|"<>]/g,
      "-",
    );
  pdf.save(fileName);
}

/**
 * @param {{ invoiceMeta: { invoiceNumber?: string } }} invoiceData
 */
export async function generateInvoicePdf(invoiceData) {
  const el = document.getElementById(INVOICE_DOCUMENT_ROOT_ID);
  if (!el) {
    throw new Error("Invoice template not found in the page.");
  }
  await generateInvoicePdfFromElement(el, invoiceData.invoiceMeta);
}
