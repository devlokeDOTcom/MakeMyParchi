export const STORAGE_KEY = "make-my-parchi-invoice";

export const DEFAULT_BUSINESS = {
  name: "Sagar Enterprise",
  description:
    "General Order, Stationery Item, All Lab Accessories & Chemicals Supplier",
  address:
    "Uttar Kalyanpur (Sipai para), Baruipur, South 24 Parganas, Kolkata - 700144",
  gstin: "19BROPD8437N1ZZ",
  phone: "+91 8334808046",
  email: "sagarbaruipur9@gmail.com",
};

export const DEFAULT_BANK = {
  accountName: "Sagar Enterprise",
  accountNo: "1234567890",
  branchCode: "001",
  bankName: "UCO Bank ( Baruipur Branch )",
  ifsc: "UCBA0000199",
  pan: "",
};

export const DEFAULT_CUSTOMER = {
  name: "Customer Name",
  address: "Customer address line",
  gstin: "",
  phone: "",
  email: "",
};

export function createDefaultInvoiceMeta() {
  const today = new Date();
  const due = new Date(today);
  due.setDate(due.getDate() + 15);

  const pad = (n) => String(n).padStart(2, "0");
  const dateStr = `${today.getFullYear()}${pad(today.getMonth() + 1)}${pad(today.getDate())}`;

  return {
    invoiceNumber: `INV-${dateStr}-001`,
    invoiceDate: today.toISOString().slice(0, 10),
    dueDate: due.toISOString().slice(0, 10),
    orderDate: due.toISOString().slice(0, 10),
    memoNo: "",
  };
}

export function getDefaultInvoiceState() {
  return {
    business: { ...DEFAULT_BUSINESS },
    bank: { ...DEFAULT_BANK },
    customer: { ...DEFAULT_CUSTOMER },
    invoiceMeta: createDefaultInvoiceMeta(),
    lineItems: [],
    showPreview: false,
  };
}
