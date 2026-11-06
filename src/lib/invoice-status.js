export const INVOICE_STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "paid", label: "Paid" },
];

export const STATUS_BADGE_CLASS = {
  draft: "bg-black/5 text-black/60",
  sent: "bg-blue-50 text-blue-700",
  paid: "bg-green-50 text-green-700",
  overdue: "bg-red-50 text-red-700",
};

export const STATUS_LABEL = {
  draft: "Draft",
  sent: "Sent",
  paid: "Paid",
  overdue: "Overdue",
};

function todayIso() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** "overdue" is derived: a sent invoice whose due date has passed. */
export function getDisplayStatus(invoice) {
  const dueDate = invoice.invoiceMeta?.dueDate;
  if (invoice.status === "sent" && dueDate && dueDate < todayIso()) {
    return "overdue";
  }
  return invoice.status;
}
