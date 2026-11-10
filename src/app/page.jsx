"use client";

import { InvoiceDataTable } from "@/components/invoice-data-table";
import { InvoicePreview } from "@/components/invoice-preview";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { AppNav } from "@/components/app-nav";
import { useInvoice } from "@/context/invoice-context";
import { INVOICE_STATUSES } from "@/lib/invoice-status";
import { INVOICE_TEMPLATES } from "@/lib/invoice-templates";
import { repository } from "@/lib/repositories";
import { generateInvoicePdf } from "@/lib/generate-invoice-pdf";
import { validateInvoiceForExport } from "@/lib/invoice-calc";
import {
  NewspaperClippingIcon,
  ArrowDownIcon,
  PrinterIcon,
  PlusIcon,
  AsteriskIcon,
  BuildingsIcon,
  PiggyBankIcon,
  AddressBookIcon,
  CalendarBlankIcon,
  BarcodeIcon,
  FloppyDiskIcon,
  EyeIcon,
  XIcon,
} from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

function useInvoiceDownload() {
  const { invoiceData } = useInvoice();

  return async () => {
    const errors = validateInvoiceForExport(invoiceData);
    if (errors.length) {
      window.alert(errors.join("\n"));
      return;
    }
    try {
      await generateInvoicePdf(invoiceData);
    } catch (e) {
      window.alert(
        e instanceof Error
          ? e.message
          : "Could not create PDF. Turn Preview on once or try again.",
      );
    }
  };
}

export default function Home() {
  const { createNewInvoice, invoiceId, invoiceMeta, showPreview } =
    useInvoice();

  return (
    <>
      {/* In preview mode the editor stays visible but blurred and inert. */}
      <div
        inert={showPreview}
        aria-hidden={showPreview}
        className={cn(
          "no-print flex flex-col flex-1 font-sans p-3 sm:p-4 pb-40 md:pb-4 mx-auto max-w-6xl gap-5 transition-[filter]",
          showPreview && "pointer-events-none select-none blur-sm",
        )}
      >
        <AppNav />
        <div className="w-full flex justify-between">
          <div className="flex min-w-0 items-center gap-2 text-base sm:text-2xl">
            <NewspaperClippingIcon
              weight="light"
              className="size-6 shrink-0 sm:size-10"
            />
            <span className="truncate">
              {invoiceId
                ? `Edit Invoice ${invoiceMeta.invoiceNumber}`
                : "New Invoice"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              className={"border border-black/20"}
              onClick={createNewInvoice}
            >
              <PlusIcon />
              Create New
            </Button>
          </div>
        </div>
        <DashboardTabs />
        {/* <div className="flex items-end flex-col gap-2">
          <Image
            src="/assets/brand_logo.png"
            alt="Profile Picture"
            width={100}
            height={100}
            className="grayscale opacity-50"
          />
        </div> */}
      </div>
      <InvoicePreviewPanel />
    </>
  );
}

function DashboardTabs() {
  const {
    saveMessage,
    saveMessageTone,
    saveInvoice,
    invoiceId,
    dirty,
    showPreview,
    setShowPreview,
    template,
    setTemplate,
  } = useInvoice();

  const handleDownload = useInvoiceDownload();
  const [tab, setTab] = useState("invoice");

  // Ctrl/Cmd + S saves the invoice instead of the browser's "save page".
  useEffect(() => {
    const onKey = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        if (!showPreview) saveInvoice();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [saveInvoice, showPreview]);

  let saveState = null;
  if (saveMessage) {
    saveState = {
      text: saveMessage,
      className: saveMessageTone === "error" ? "text-red-700" : "text-green-700",
    };
  } else if (dirty) {
    saveState = { text: "● Unsaved changes", className: "text-amber-700" };
  } else if (invoiceId) {
    saveState = { text: "✓ Saved", className: "text-black/40" };
  }

  return (
    <Tabs value={tab} onValueChange={setTab} className="w-full">
      {/* Sticky toolbar: the main actions stay in reach while you scroll. */}
      <div className="sm:sticky sm:top-0 z-30 -mx-3 sm:-mx-4 mb-4 border-b border-black/10 bg-background/95 px-3 sm:px-4 py-2 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <div className="flex w-full flex-col items-start gap-2 sm:w-auto">
          <TabsList className={"border border-black/10 shadow-md w-full sm:w-fit"}>
            <TabsTrigger value="invoice" className={"flex-1 text-sm px-3 sm:px-4"}>
              Invoice
            </TabsTrigger>
            <TabsTrigger value="account" className={"flex-1 text-sm px-3 sm:px-4"}>
              Customer
            </TabsTrigger>
            <TabsTrigger value="admin" className={"flex-1 text-sm px-3 sm:px-4"}>
              Business
            </TabsTrigger>
          </TabsList>

          {tab === "invoice" ? (
          <div
            role="group"
            aria-label="Invoice template"
            className="flex w-full sm:w-auto border border-black/20"
          >
            {INVOICE_TEMPLATES.map(({ value, label }) => (
              <Button
                key={value}
                size="sm"
                className="flex-1 sm:flex-none"
                variant={template === value ? "default" : "secondary"}
                aria-pressed={template === value}
                onClick={() => setTemplate(value)}
              >
                {label}
              </Button>
            ))}
          </div>
          ) : null}
          </div>

          <div className="hidden flex-col items-end justify-center gap-2 sm:ml-auto sm:flex">
            <div className="flex items-center gap-3">
              <span
                aria-live="polite"
                className={cn("min-w-[90px] text-right text-xs font-medium", saveState?.className)}
              >
                {saveState?.text}
              </span>
              <ButtonGroup>
                <Button variant="secondary" onClick={saveInvoice} title="Ctrl + S">
                  <FloppyDiskIcon /> Save
                </Button>
                <Button onClick={handleDownload}>
                  <ArrowDownIcon /> Download
                </Button>
              </ButtonGroup>
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-xs text-black/60">
              <Switch checked={showPreview} onCheckedChange={setShowPreview} />
              Preview
            </label>
          </div>
        </div>
      </div>

      {/* Phones: Save / Preview / Download stay pinned above the tab bar, so
          they are one tap away however long the item list gets. */}
      <div className="fixed inset-x-0 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-30 border-t border-black/10 bg-white/95 px-3 py-2 backdrop-blur sm:hidden">
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            className="relative flex-1 border border-black/10"
            onClick={saveInvoice}
          >
            <FloppyDiskIcon /> Save
            {dirty ? (
              <span
                aria-label="Unsaved changes"
                className="absolute right-1.5 top-1.5 size-2 rounded-full bg-amber-500"
              />
            ) : null}
          </Button>
          <Button
            variant="secondary"
            className="flex-1 border border-black/10"
            onClick={() => setShowPreview(true)}
          >
            <EyeIcon /> Preview
          </Button>
          <Button className="flex-1" onClick={handleDownload}>
            <ArrowDownIcon /> Download
          </Button>
        </div>
        {/* Status floats at the bar's top-right corner, out of the way. */}
        {saveState ? (
          <p
            aria-live="polite"
            className={cn(
              "absolute -top-6 right-3 border border-black/10 bg-white/95 px-2 py-0.5 text-[11px] font-medium shadow-sm",
              saveState.className,
            )}
          >
            {saveState.text}
          </p>
        ) : null}
      </div>
      {
        <>
          <TabsContent value="admin" className={""}>
            <div className="w-full bg-white p-2 sm:p-4 border border-black/10 shadow">
              <BusinessDetails />
            </div>
          </TabsContent>
          <TabsContent value="account" className={""}>
            <div className="w-full bg-white p-2 sm:p-4 border border-black/10 shadow">
              <AccountDetails />
            </div>
          </TabsContent>
          <TabsContent value="invoice">
            <div className="w-full flex flex-col gap-5">
              <div className="w-full bg-white p-2 sm:p-4 border border-black/10 shadow">
                <Invoice />
              </div>
            </div>
          </TabsContent>
        </>
      }
    </Tabs>
  );
}

function InvoicePreviewPanel() {
  const { showPreview, setShowPreview, invoiceMeta } = useInvoice();
  const handleDownload = useInvoiceDownload();

  return (
    <div
      className={cn(
        showPreview
          ? "fixed inset-0 z-40 overflow-y-auto bg-white/50 backdrop-blur-md"
          : "fixed inset-0 mx-auto opacity-0 pointer-events-none w-[210mm] max-w-[210mm]",
        "print:static print:!left-auto print:z-auto print:w-full print:max-w-none print:overflow-visible print:bg-transparent print:p-0 print:opacity-100 print:backdrop-blur-none",
      )}
    >
      {showPreview ? (
        <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-2 bg-black px-3 sm:px-4 py-2.5 text-white shadow print:hidden">
          <div className="flex items-center gap-2 text-sm">
            <EyeIcon size={18} />
            <span>
              You are now in <strong>Preview mode</strong>
              {invoiceMeta.invoiceNumber
                ? ` — ${invoiceMeta.invoiceNumber}`
                : ""}
              . Editing is paused.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={() => setShowPreview(false)}>
              <XIcon /> Exit Preview
            </Button>
            <Button size="sm" variant="secondary" onClick={handleDownload}>
              <ArrowDownIcon /> Download
            </Button>
          </div>
        </div>
      ) : null}
      <div className={cn(showPreview && "mx-auto max-w-6xl p-2 sm:p-4", "print:p-0")}>
        <InvoicePreview />
      </div>
    </div>
  );
}

function SaveActions({ onSave }) {
  return (
    <div className="flex gap-5 h-full items-end justify-end">
      <ButtonGroup>
        <Button type="button" onClick={onSave}>
          Save
        </Button>
      </ButtonGroup>
    </div>
  );
}

function BusinessDetails() {
  const { business, bank, updateBusiness, updateBank, persistNow } =
    useInvoice();

  return (
    <div className="w-full p-1 sm:p-4 flex flex-col gap-5 relative">
      <span className="hidden sm:flex gap-2 items-center text-black/30 absolute top-0 right-0">
        <AsteriskIcon />
        <p className="text-xs">
          The system includes default data that you can edit anytime to suit
          your needs.
        </p>
      </span>
      <div className="flex flex-col gap-2 text-lg items-start">
        <span className="flex gap-2 items-center">
          <BuildingsIcon size={30} weight="light" />
          <h1>Business Details</h1>
        </span>
      </div>

      <div className="flex flex-col lg:flex-row gap-5 w-full border rounded shadow p-3 sm:p-5 mb-5">
        <div className="flex flex-col gap-5 flex-1">
          <Field>
            <Label>Business Name</Label>
            <Input
              placeholder="Your Business Name"
              value={business.name}
              onChange={(e) => updateBusiness("name", e.target.value)}
            />
          </Field>
          <Field>
            <Label>Business Description</Label>
            <Textarea
              placeholder="Short description"
              className={"w-full"}
              value={business.description}
              onChange={(e) => updateBusiness("description", e.target.value)}
            />
          </Field>
          <Field>
            <Label>Business Address</Label>
            <Textarea
              placeholder="Your Address"
              className={"w-full"}
              value={business.address}
              onChange={(e) => updateBusiness("address", e.target.value)}
            />
          </Field>
        </div>
        <div className="flex flex-col gap-5 flex-1 relative">
          <Field>
            <Label>GSTIN</Label>
            <Input
              placeholder="15 digit GSTIN"
              value={business.gstin}
              onChange={(e) => updateBusiness("gstin", e.target.value)}
            />
          </Field>
          <Field>
            <Label>Phone no.</Label>
            <Input
              placeholder="+91 9876543210"
              value={business.phone}
              onChange={(e) => updateBusiness("phone", e.target.value)}
            />
          </Field>
          <Field>
            <Label>Email Address</Label>
            <Input
              placeholder="you@business.com"
              value={business.email}
              onChange={(e) => updateBusiness("email", e.target.value)}
            />
          </Field>
          <SaveActions onSave={persistNow} />
        </div>
      </div>

      <div className="flex flex-col gap-2 text-lg items-start">
        <span className="flex gap-2 items-center">
          <PiggyBankIcon size={30} weight="light" />
          <h1>Bank Details</h1>
        </span>
      </div>
      <div className="flex flex-col lg:flex-row gap-5 w-full border rounded shadow p-3 sm:p-5">
        <div className="flex flex-col gap-5 flex-1">
          <Field>
            <Label>Account Name</Label>
            <Input
              placeholder="Account Holder's name eg. John Doe"
              value={bank.accountName}
              onChange={(e) => updateBank("accountName", e.target.value)}
            />
          </Field>
          <Field>
            <Label>Account No</Label>
            <Input
              placeholder="Account number"
              value={bank.accountNo}
              onChange={(e) => updateBank("accountNo", e.target.value)}
            />
          </Field>
          <Field>
            <Label>Branch Code</Label>
            <Input
              placeholder="Branch code"
              value={bank.branchCode}
              onChange={(e) => updateBank("branchCode", e.target.value)}
            />
          </Field>
        </div>
        <div className="flex flex-col gap-5 flex-1 relative">
          <Field>
            <Label>Bank Name</Label>
            <Input
              placeholder="eg. ABC Bank"
              value={bank.bankName}
              onChange={(e) => updateBank("bankName", e.target.value)}
            />
          </Field>
          <Field>
            <Label>IFSC Code</Label>
            <Input
              placeholder="BANK0001234"
              value={bank.ifsc}
              onChange={(e) => updateBank("ifsc", e.target.value)}
            />
          </Field>
          <Field>
            <Label>PAN no.</Label>
            <Input
              placeholder="PAN number"
              value={bank.pan}
              onChange={(e) => updateBank("pan", e.target.value)}
            />
          </Field>
          <SaveActions onSave={persistNow} />
        </div>
      </div>
    </div>
  );
}

function CustomerPicker() {
  const { customer, applyCustomer } = useInvoice();
  const [customers, setCustomers] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    repository
      .listCustomers()
      .then((list) => {
        if (!cancelled) setCustomers(list);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSaveToBook = async () => {
    try {
      const existing = customers.find(
        (entry) => entry.name.toLowerCase() === customer.name.trim().toLowerCase(),
      );
      const saved = await repository.saveCustomer({ ...existing, ...customer });
      setCustomers(await repository.listCustomers());
      setMessage(existing ? `Updated ${saved.name}` : `Added ${saved.name}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save.");
    }
  };

  return (
    <div className="flex flex-wrap items-end gap-3 w-full border rounded shadow p-3 sm:p-5">
      <Field className="w-full sm:w-1/2">
        <Label>Pick from customer book</Label>
        <select
          className="h-8 w-full border border-input bg-transparent px-2.5 text-xs outline-none"
          value=""
          onChange={(e) => {
            const entry = customers.find((c) => c.id === e.target.value);
            if (entry) applyCustomer(entry);
          }}
        >
          <option value="">
            {customers.length ? "Select a saved customer…" : "No saved customers yet"}
          </option>
          {customers.map((entry) => (
            <option key={entry.id} value={entry.id}>
              {entry.name}
            </option>
          ))}
        </select>
      </Field>
      <Button type="button" variant="secondary" className="border border-black/20" onClick={handleSaveToBook}>
        <PlusIcon /> Save to customer book
      </Button>
      {message ? <span className="text-xs text-black/50">{message}</span> : null}
    </div>
  );
}

function AccountDetails() {
  const { customer, updateCustomer, persistNow } = useInvoice();

  return (
    <div className="w-full p-1 sm:p-4 flex flex-col gap-5 relative">
      <span className="hidden sm:flex gap-2 items-center text-black/30 absolute top-0 right-0">
        <AsteriskIcon />
        <p className="text-xs">
          The system includes default data that you can edit anytime to suit
          your needs.
        </p>
      </span>

      <div className="flex flex-col gap-2 text-lg items-start">
        <span className="flex gap-2 items-center">
          <AddressBookIcon size={30} weight="light" />
          <h1>Customer Details</h1>
        </span>
      </div>

      <CustomerPicker />

      <div className="flex flex-col lg:flex-row gap-5 w-full border rounded shadow p-3 sm:p-5">
        <div className="flex flex-col gap-5 flex-1">
          <Field>
            <Label>Customer Name</Label>
            <Input
              placeholder="Customer name"
              value={customer.name}
              onChange={(e) => updateCustomer("name", e.target.value)}
            />
          </Field>
          <Field>
            <Label>Business Address</Label>
            <Textarea
              placeholder="Customer address"
              className={"w-full h-full"}
              value={customer.address}
              onChange={(e) => updateCustomer("address", e.target.value)}
            />
          </Field>
        </div>
        <div className="flex flex-col gap-5 flex-1 relative">
          <Field>
            <Label>GSTIN</Label>
            <Input
              placeholder="15 digit GSTIN"
              value={customer.gstin}
              onChange={(e) => updateCustomer("gstin", e.target.value)}
            />
          </Field>
          <Field>
            <Label>Phone no.</Label>
            <Input
              placeholder="+91 9876543210"
              value={customer.phone}
              onChange={(e) => updateCustomer("phone", e.target.value)}
            />
          </Field>
          <Field>
            <Label>Email Address</Label>
            <Input
              placeholder="customer@email.com"
              value={customer.email}
              onChange={(e) => updateCustomer("email", e.target.value)}
            />
          </Field>
          <SaveActions onSave={persistNow} />
        </div>
      </div>
    </div>
  );
}

function Invoice() {
  const { invoiceMeta, updateInvoiceMeta, status, setStatus, persistNow } =
    useInvoice();

  return (
    <div className="w-full p-1 sm:p-4 flex flex-col gap-5 relative">
      <div className="w-full flex justify-between">
        <span className="flex gap-2 text-lg">
          <CalendarBlankIcon size={30} weight="light" />
          <h1>Invoice Details</h1>
        </span>
      </div>
      <div className="w-full flex flex-col gap-5 border rounded shadow p-5 mb-5">
        <div className="flex flex-wrap gap-2 items-center">
          <Field>
            <Label>Invoice Number</Label>
            <Input
              placeholder="000/000-000"
              value={invoiceMeta.invoiceNumber}
              onChange={(e) =>
                updateInvoiceMeta("invoiceNumber", e.target.value)
              }
            />
          </Field>
          <Field>
            <Label>Invoice Date</Label>
            <Input
              type="date"
              value={invoiceMeta.invoiceDate}
              onChange={(e) => updateInvoiceMeta("invoiceDate", e.target.value)}
            />
          </Field>
          <Field>
            <Label>Due Date</Label>
            <Input
              type="date"
              value={invoiceMeta.dueDate}
              onChange={(e) => updateInvoiceMeta("dueDate", e.target.value)}
            />
          </Field>
          <Field>
            <Label>Status</Label>
            <select
              className="h-8 w-full border border-input bg-transparent px-2.5 text-xs outline-none"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {INVOICE_STATUSES.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="flex justify-between items-end gap-2 flex-wrap">
          <Field className={"w-full sm:w-1/3"}>
            <Label>Order Memo No.</Label>
            <Input
              placeholder="ABC/DEF/000-00/00"
              value={invoiceMeta.memoNo}
              onChange={(e) => updateInvoiceMeta("memoNo", e.target.value)}
            />
          </Field>
          <Field className={"w-full sm:w-1/3"}>
            <Label>Order Date</Label>
            <Input
              type="date"
              value={invoiceMeta.orderDate}
              onChange={(e) => updateInvoiceMeta("orderDate", e.target.value)}
            />
          </Field>
          <SaveActions onSave={persistNow} />
        </div>
      </div>
      <span className="flex gap-2 text-lg">
        <BarcodeIcon size={30} weight="light" />
        <h1>Line Items</h1>
      </span>
      <div className="w-full flex flex-col gap-5 border rounded shadow p-5">
        <InvoiceDataTable />
      </div>
    </div>
  );
}
