import { jsPDF } from "jspdf";
import html2canvas from "html2canvas-pro";
import { INVOICE_DOCUMENT_ROOT_ID } from "@/components/invoice-document";

/**
 * Exports the DOM node `#invoice-document-root` (from `InvoiceDocument`) to PDF.
 * Same markup as preview & print — customize layout only in `invoice-document.jsx`.
 */
export async function generateInvoicePdfFromElement(element, invoiceMeta) {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: "#ffffff",
  });

  const imgData = canvas.toDataURL("image/png", 1.0);
  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
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
