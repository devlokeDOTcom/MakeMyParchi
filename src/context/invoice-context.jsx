"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  calculateLineAmounts,
  summarizeLineItems,
  validateInvoiceForExport,
} from "@/lib/invoice-calc";
import {
  createDefaultInvoiceMeta,
  getDefaultInvoiceState,
} from "@/lib/invoice-defaults";
import { loadInvoiceState, saveInvoiceState } from "@/lib/invoice-storage";
import { repository } from "@/lib/repositories";

const InvoiceContext = createContext(null);

function withLineTotals(item) {
  const { taxable, gstValue, total } = calculateLineAmounts(
    item.qtn,
    item.unitPrice,
    item.gst,
  );
  return {
    ...item,
    totalAmount: total,
    totalTaxableAmount: taxable,
    totalGSTValue: gstValue,
  };
}

async function peekInvoiceNumber() {
  try {
    return await repository.peekNextInvoiceNumber();
  } catch {
    return "";
  }
}

export function InvoiceProvider({ children }) {
  const [initial] = useState(getDefaultInvoiceState);
  const [hydrated, setHydrated] = useState(false);
  const [business, setBusiness] = useState(initial.business);
  const [bank, setBank] = useState(initial.bank);
  const [customer, setCustomer] = useState(initial.customer);
  const [invoiceMeta, setInvoiceMeta] = useState(initial.invoiceMeta);
  const [lineItems, setLineItems] = useState(initial.lineItems);
  const [invoiceId, setInvoiceId] = useState(initial.invoiceId);
  const [status, setStatus] = useState(initial.status);
  const [showPreview, setShowPreview] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [saveMessageTone, setSaveMessageTone] = useState("success");
  const messageTimer = useRef(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const stored = loadInvoiceState();
      const invoiceNumber =
        stored.invoiceMeta.invoiceNumber || (await peekInvoiceNumber());
      if (cancelled) return;

      setBusiness(stored.business);
      setBank(stored.bank);
      setCustomer(stored.customer);
      setInvoiceMeta({ ...stored.invoiceMeta, invoiceNumber });
      setLineItems(stored.lineItems);
      setInvoiceId(stored.invoiceId);
      setStatus(stored.status);
      setHydrated(true);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => () => clearTimeout(messageTimer.current), []);

  useEffect(() => {
    if (!hydrated) return;
    saveInvoiceState({
      business,
      bank,
      customer,
      invoiceMeta,
      lineItems,
      invoiceId,
      status,
    });
  }, [
    hydrated,
    business,
    bank,
    customer,
    invoiceMeta,
    lineItems,
    invoiceId,
    status,
  ]);

  const summary = useMemo(() => summarizeLineItems(lineItems), [lineItems]);
  const totalAmount = summary.total;
  const totalGSTValue = summary.gstValue;
  const totalTaxableAmount = summary.taxable;

  const flashMessage = useCallback((text, tone = "success") => {
    setSaveMessage(text);
    setSaveMessageTone(tone);
    clearTimeout(messageTimer.current);
    messageTimer.current = setTimeout(() => setSaveMessage(""), 2500);
  }, []);

  const updateBusiness = useCallback((key, value) => {
    setBusiness((prev) => ({ ...prev, [key]: value }));
  }, []);

  const updateBank = useCallback((key, value) => {
    setBank((prev) => ({ ...prev, [key]: value }));
  }, []);

  const updateCustomer = useCallback((key, value) => {
    setCustomer((prev) => ({ ...prev, [key]: value }));
  }, []);

  /** Fill the invoice's customer from a customer-book entry. */
  const applyCustomer = useCallback((entry) => {
    setCustomer({
      name: entry.name || "",
      address: entry.address || "",
      gstin: entry.gstin || "",
      phone: entry.phone || "",
      email: entry.email || "",
    });
  }, []);

  const updateInvoiceMeta = useCallback((key, value) => {
    setInvoiceMeta((prev) => ({ ...prev, [key]: value }));
  }, []);

  const addLineItem = useCallback((item) => {
    setLineItems((prev) => [
      ...prev,
      withLineTotals({
        id: crypto.randomUUID(),
        desc: item.desc,
        qtn: Number(item.qtn),
        unitPrice: Number(item.unitPrice),
        gst: Number(item.gst || 0),
      }),
    ]);
  }, []);

  const updateLineItem = useCallback((id, key, value) => {
    setLineItems((prev) =>
      prev.map((item) =>
        item.id === id ? withLineTotals({ ...item, [key]: value }) : item,
      ),
    );
  }, []);

  const removeLineItem = useCallback((id) => {
    setLineItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const createNewInvoice = useCallback(async () => {
    const invoiceNumber = await peekInvoiceNumber();
    setInvoiceMeta(createDefaultInvoiceMeta(invoiceNumber));
    setLineItems([]);
    setInvoiceId(null);
    setStatus("draft");
    setShowPreview(false);
  }, []);

  /** Load a saved invoice into the editor. Resolves to false if not found. */
  const openInvoice = useCallback(async (id) => {
    const saved = await repository.getInvoice(id);
    if (!saved) return false;

    setBusiness(saved.business);
    setBank(saved.bank);
    setCustomer(saved.customer);
    setInvoiceMeta(saved.invoiceMeta);
    setLineItems(saved.lineItems);
    setInvoiceId(saved.id);
    setStatus(saved.status);
    setShowPreview(false);
    return true;
  }, []);

  /** Persist the current invoice to the repository (insert or update). */
  const saveInvoice = useCallback(async () => {
    const errors = validateInvoiceForExport({ business, lineItems });
    if (errors.length) {
      flashMessage(errors[0], "error");
      return { ok: false, error: errors.join("\n") };
    }

    try {
      const saved = await repository.saveInvoice({
        id: invoiceId,
        status,
        business,
        bank,
        customer,
        invoiceMeta,
        lineItems,
        totals: summary,
      });
      setInvoiceId(saved.id);
      flashMessage("Invoice saved");
      return { ok: true, invoice: saved };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not save the invoice.";
      flashMessage(message, "error");
      return { ok: false, error: message };
    }
  }, [
    business,
    bank,
    customer,
    invoiceMeta,
    lineItems,
    invoiceId,
    status,
    summary,
    flashMessage,
  ]);

  const persistNow = useCallback(() => {
    saveInvoiceState({
      business,
      bank,
      customer,
      invoiceMeta,
      lineItems,
      invoiceId,
      status,
    });
    flashMessage("Saved");
  }, [
    business,
    bank,
    customer,
    invoiceMeta,
    lineItems,
    invoiceId,
    status,
    flashMessage,
  ]);

  const invoiceData = useMemo(
    () => ({
      business,
      bank,
      customer,
      invoiceMeta,
      lineItems,
      totalAmount,
      totalGSTValue,
      totalTaxableAmount,
    }),
    [
      business,
      bank,
      customer,
      invoiceMeta,
      lineItems,
      totalAmount,
      totalTaxableAmount,
      totalGSTValue,
    ],
  );

  const value = useMemo(
    () => ({
      hydrated,
      business,
      bank,
      customer,
      invoiceMeta,
      lineItems,
      invoiceId,
      status,
      setStatus,
      showPreview,
      setShowPreview,
      totalAmount,
      totalTaxableAmount,
      totalGSTValue,
      saveMessage,
      saveMessageTone,
      invoiceData,
      updateBusiness,
      updateBank,
      updateCustomer,
      applyCustomer,
      updateInvoiceMeta,
      addLineItem,
      updateLineItem,
      removeLineItem,
      createNewInvoice,
      openInvoice,
      saveInvoice,
      persistNow,
    }),
    [
      hydrated,
      business,
      bank,
      customer,
      invoiceMeta,
      lineItems,
      invoiceId,
      status,
      showPreview,
      totalAmount,
      totalTaxableAmount,
      totalGSTValue,
      saveMessage,
      saveMessageTone,
      invoiceData,
      updateBusiness,
      updateBank,
      updateCustomer,
      applyCustomer,
      updateInvoiceMeta,
      addLineItem,
      updateLineItem,
      removeLineItem,
      createNewInvoice,
      openInvoice,
      saveInvoice,
      persistNow,
    ],
  );

  return (
    <InvoiceContext.Provider value={value}>{children}</InvoiceContext.Provider>
  );
}

export function useInvoice() {
  const context = useContext(InvoiceContext);
  if (!context) {
    throw new Error("useInvoice must be used within InvoiceProvider");
  }
  return context;
}
