"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createDefaultInvoiceMeta } from "@/lib/invoice-defaults";
import { loadInvoiceState, saveInvoiceState } from "@/lib/invoice-storage";

const InvoiceContext = createContext(null);

function calculateLineTotal(qtn, unitPrice, gst = 0) {
  const quantity = Number(qtn) || 0;
  const price = Number(unitPrice) || 0;
  const tax = Number(gst) || 0;
  const subtotal = quantity * price;
  return subtotal + (subtotal * tax) / 100;
}

export function InvoiceProvider({ children }) {
  const [hydrated, setHydrated] = useState(false);
  const [business, setBusiness] = useState(() => loadInvoiceState().business);
  const [bank, setBank] = useState(() => loadInvoiceState().bank);
  const [customer, setCustomer] = useState(() => loadInvoiceState().customer);
  const [invoiceMeta, setInvoiceMeta] = useState(
    () => loadInvoiceState().invoiceMeta,
  );
  const [lineItems, setLineItems] = useState(() => loadInvoiceState().lineItems);
  const [showPreview, setShowPreview] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    const stored = loadInvoiceState();
    setBusiness(stored.business);
    setBank(stored.bank);
    setCustomer(stored.customer);
    setInvoiceMeta(stored.invoiceMeta);
    setLineItems(stored.lineItems);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveInvoiceState({ business, bank, customer, invoiceMeta, lineItems });
  }, [hydrated, business, bank, customer, invoiceMeta, lineItems]);

  const totalAmount = useMemo(
    () =>
      lineItems.reduce((acc, item) => acc + Number(item.totalAmount || 0), 0),
    [lineItems],
  );

  const updateBusiness = useCallback((key, value) => {
    setBusiness((prev) => ({ ...prev, [key]: value }));
  }, []);

  const updateBank = useCallback((key, value) => {
    setBank((prev) => ({ ...prev, [key]: value }));
  }, []);

  const updateCustomer = useCallback((key, value) => {
    setCustomer((prev) => ({ ...prev, [key]: value }));
  }, []);

  const updateInvoiceMeta = useCallback((key, value) => {
    setInvoiceMeta((prev) => ({ ...prev, [key]: value }));
  }, []);

  const addLineItem = useCallback((item) => {
    const qtn = Number(item.qtn);
    const unitPrice = Number(item.unitPrice);
    const gst = Number(item.gst || 0);
    const totalAmount = calculateLineTotal(qtn, unitPrice, gst);

    setLineItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        desc: item.desc,
        qtn,
        unitPrice,
        gst,
        totalAmount,
      },
    ]);
  }, []);

  const updateLineItem = useCallback((id, key, value) => {
    setLineItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        const updated = { ...item, [key]: value };
        updated.totalAmount = calculateLineTotal(
          key === "qtn" ? value : updated.qtn,
          key === "unitPrice" ? value : updated.unitPrice,
          key === "gst" ? value : updated.gst,
        );
        return updated;
      }),
    );
  }, []);

  const removeLineItem = useCallback((id) => {
    setLineItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const createNewInvoice = useCallback(() => {
    setInvoiceMeta(createDefaultInvoiceMeta());
    setLineItems([]);
    setShowPreview(false);
  }, []);

  const flashSaveMessage = useCallback(() => {
    setSaveMessage("Saved");
    const timer = setTimeout(() => setSaveMessage(""), 2000);
    return () => clearTimeout(timer);
  }, []);

  const persistNow = useCallback(() => {
    saveInvoiceState({ business, bank, customer, invoiceMeta, lineItems });
    flashSaveMessage();
  }, [business, bank, customer, invoiceMeta, lineItems, flashSaveMessage]);

  const invoiceData = useMemo(
    () => ({
      business,
      bank,
      customer,
      invoiceMeta,
      lineItems,
      totalAmount,
    }),
    [business, bank, customer, invoiceMeta, lineItems, totalAmount],
  );

  const value = useMemo(
    () => ({
      hydrated,
      business,
      bank,
      customer,
      invoiceMeta,
      lineItems,
      showPreview,
      setShowPreview,
      totalAmount,
      saveMessage,
      invoiceData,
      updateBusiness,
      updateBank,
      updateCustomer,
      updateInvoiceMeta,
      addLineItem,
      updateLineItem,
      removeLineItem,
      createNewInvoice,
      persistNow,
    }),
    [
      hydrated,
      business,
      bank,
      customer,
      invoiceMeta,
      lineItems,
      showPreview,
      totalAmount,
      saveMessage,
      invoiceData,
      updateBusiness,
      updateBank,
      updateCustomer,
      updateInvoiceMeta,
      addLineItem,
      updateLineItem,
      removeLineItem,
      createNewInvoice,
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
