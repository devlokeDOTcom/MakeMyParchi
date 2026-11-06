export const INVOICE_TEMPLATES = [
  { value: "standard", label: "Standard Invoice" },
  { value: "book", label: "Book Invoice" },
];

export const DEFAULT_TEMPLATE = "standard";

export function isBookTemplate(template) {
  return template === "book";
}
