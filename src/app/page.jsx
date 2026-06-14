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
import { InvoiceProvider, useInvoice } from "@/context/invoice-context";
import {
  generateInvoicePdf,
  validateInvoiceForExport,
} from "@/lib/generate-invoice-pdf";
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
} from "@phosphor-icons/react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <InvoiceProvider>
      <HomeContent />
    </InvoiceProvider>
  );
}

function HomeContent() {
  const { createNewInvoice } = useInvoice();

  return (
    <>
      <div className="no-print flex flex-col flex-1 font-sans p-4 mx-auto max-w-6xl gap-5">
        <div className="w-full flex justify-between">
          <div className="flex gap-2 text-2xl items-center">
            <NewspaperClippingIcon size={40} weight="light" />
            New Invoice
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
  const { invoiceData, saveMessage } = useInvoice();

  const handleDownload = async () => {
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

  const handlePrint = () => {
    const errors = validateInvoiceForExport(invoiceData);
    if (errors.length) {
      window.alert(errors.join("\n"));
      return;
    }
    window.print();
  };
  const { showPreview, setShowPreview } = useInvoice();

  return (
    <Tabs defaultValue="invoice" className="w-full">
      <div className="w-full flex flex-wrap justify-between items-center gap-3 mb-5">
        <TabsList className={"border border-black/10 shadow-md w-fit"}>
          <TabsTrigger value="invoice" className={"text-sm px-4"}>
            Invoice
          </TabsTrigger>
          <TabsTrigger value="account" className={"text-sm px-4"}>
            Customer
          </TabsTrigger>
          <TabsTrigger value="admin" className={"text-sm px-4"}>
            Business
          </TabsTrigger>
        </TabsList>
        <div className="flex items-center gap-3">
          {saveMessage ? (
            <span className="text-xs text-green-700 font-medium">
              {saveMessage}
            </span>
          ) : null}
          <div className="flex flex-col items-end gap-5">
            <ButtonGroup>
              <Button onClick={handleDownload}>
                <ArrowDownIcon /> Download
              </Button>
              {/* <Button onClick={handlePrint}>
                <PrinterIcon /> Print Invoice
              </Button> */}
            </ButtonGroup>
            <div className={"gap-2 flex items-center"}>
              <Switch checked={showPreview} onCheckedChange={setShowPreview} />
              <Label className={"text-black/50"}>Preview</Label>
            </div>
          </div>
        </div>
      </div>
      {!showPreview ? (
        <>
          <TabsContent value="admin" className={""}>
            <div className="w-full bg-white p-4 border border-black/10 shadow">
              <BusinessDetails />
            </div>
          </TabsContent>
          <TabsContent value="account" className={""}>
            <div className="w-full bg-white p-4 border border-black/10 shadow">
              <AccountDetails />
            </div>
          </TabsContent>
          <TabsContent value="invoice">
            <div className="w-full flex flex-col gap-5">
              <div className="w-full bg-white p-4 border border-black/10 shadow">
                <Invoice />
              </div>
            </div>
          </TabsContent>
        </>
      ) : (
        ""
      )}
    </Tabs>
  );
}

function InvoicePreviewPanel() {
  const { showPreview } = useInvoice();

  return (
    <div
      className={cn(
        "mx-auto",
        showPreview
          ? "block max-w-6xl p-4"
          : "fixed inset-0 opacity-0 pointer-events-none w-[210mm] max-w-[210mm] p-8",
        "print:static print:!left-auto print:z-auto print:w-full print:max-w-6xl print:p-4",
      )}
    >
      <InvoicePreview className="border border-black/10 shadow p-8 print:shadow-none print:border-0" />
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
    <div className="w-full p-4 flex flex-col gap-5 relative">
      <span className="flex gap-2 items-center text-black/30 absolute top-0 right-0">
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

      <div className="flex flex-col lg:flex-row gap-5 w-full border rounded shadow p-5 mb-5">
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
      <div className="flex flex-col lg:flex-row gap-5 w-full border rounded shadow p-5">
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

function AccountDetails() {
  const { customer, updateCustomer, persistNow } = useInvoice();

  return (
    <div className="w-full p-4 flex flex-col gap-5 relative">
      <span className="flex gap-2 items-center text-black/30 absolute top-0 right-0">
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

      <div className="flex flex-col lg:flex-row gap-5 w-full border rounded shadow p-5">
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
  const {
    invoiceMeta,
    updateInvoiceMeta,
    setShowPreview,
    showPreview,
    persistNow,
  } = useInvoice();

  return (
    <div className="w-full p-4 flex flex-col gap-5 relative">
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
