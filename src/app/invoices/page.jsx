"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CopyIcon,
  ListChecksIcon,
  PencilSimpleIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import { AppNav } from "@/components/app-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useInvoice } from "@/context/invoice-context";
import { createDefaultInvoiceMeta } from "@/lib/invoice-defaults";
import { formatCurrency, formatDate } from "@/lib/invoice-calc";
import {
  STATUS_BADGE_CLASS,
  STATUS_LABEL,
  getDisplayStatus,
} from "@/lib/invoice-status";
import { repository } from "@/lib/repositories";
import { cn } from "@/lib/utils";

const FILTERS = ["all", "draft", "sent", "overdue", "paid"];

const SORTS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "amount-desc", label: "Amount: high to low" },
  { value: "amount-asc", label: "Amount: low to high" },
  { value: "due", label: "Due date: soonest" },
];

function sortRows(rows, sort) {
  const by = {
    newest: (a, b) =>
      (b.invoice.invoiceMeta.invoiceDate || "").localeCompare(
        a.invoice.invoiceMeta.invoiceDate || "",
      ) || (b.invoice.updatedAt || "").localeCompare(a.invoice.updatedAt || ""),
    oldest: (a, b) =>
      (a.invoice.invoiceMeta.invoiceDate || "").localeCompare(
        b.invoice.invoiceMeta.invoiceDate || "",
      ),
    "amount-desc": (a, b) =>
      (b.invoice.totals?.payable || 0) - (a.invoice.totals?.payable || 0),
    "amount-asc": (a, b) =>
      (a.invoice.totals?.payable || 0) - (b.invoice.totals?.payable || 0),
    due: (a, b) =>
      (a.invoice.invoiceMeta.dueDate || "9999").localeCompare(
        b.invoice.invoiceMeta.dueDate || "9999",
      ),
  };
  return [...rows].sort(by[sort]);
}

function StatCard({ label, value }) {
  return (
    <div className="flex-1 sm:min-w-[180px] min-w-0 border border-black/10 bg-white p-2.5 sm:p-4 shadow">
      <p className="text-xs text-black/50">{label}</p>
      <p className="mt-1 text-sm sm:text-xl font-semibold">₹ {formatCurrency(value)}</p>
    </div>
  );
}

export default function InvoicesPage() {
  const router = useRouter();
  const { openInvoice } = useInvoice();
  const [invoices, setInvoices] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("newest");

  const refresh = useCallback(async () => {
    try {
      setInvoices(await repository.listInvoices());
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load invoices.");
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    repository
      .listInvoices()
      .then((list) => {
        if (!cancelled) setInvoices(list);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Could not load invoices.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const rows = useMemo(
    () =>
      invoices.map((invoice) => ({
        invoice,
        displayStatus: getDisplayStatus(invoice),
      })),
    [invoices],
  );

  const stats = useMemo(() => {
    const sum = (predicate) =>
      rows
        .filter(predicate)
        .reduce((acc, { invoice }) => acc + (invoice.totals?.payable || 0), 0);
    return {
      outstanding: sum(
        ({ displayStatus }) =>
          displayStatus === "sent" || displayStatus === "overdue",
      ),
      overdue: sum(({ displayStatus }) => displayStatus === "overdue"),
      paid: sum(({ displayStatus }) => displayStatus === "paid"),
    };
  }, [rows]);

  const counts = useMemo(() => {
    const result = { all: rows.length };
    rows.forEach(({ displayStatus }) => {
      result[displayStatus] = (result[displayStatus] || 0) + 1;
    });
    return result;
  }, [rows]);

  const visible = useMemo(() => {
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const filtered = rows.filter(({ invoice, displayStatus }) => {
      if (filter !== "all" && displayStatus !== filter) return false;
      if (!words.length) return true;
      const haystack = [
        invoice.invoiceMeta.invoiceNumber,
        invoice.invoiceMeta.memoNo,
        invoice.customer?.name,
        invoice.customer?.gstin,
        STATUS_LABEL[displayStatus],
        String(invoice.totals?.payable ?? ""),
      ]
        .join(" ")
        .toLowerCase();
      return words.every((word) => haystack.includes(word));
    });
    return sortRows(filtered, sort);
  }, [rows, filter, query, sort]);

  const hasFilters = filter !== "all" || query.trim() !== "";

  const run = async (action) => {
    try {
      await action();
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    }
  };

  const handleOpen = async (id) => {
    if (await openInvoice(id)) router.push("/");
    else setError("That invoice could not be found.");
  };

  const handleDuplicate = ({ invoice }) =>
    run(async () => {
      const invoiceNumber = await repository.peekNextInvoiceNumber();
      const fresh = createDefaultInvoiceMeta(invoiceNumber);
      await repository.saveInvoice({
        ...invoice,
        id: undefined,
        status: "draft",
        invoiceMeta: {
          ...invoice.invoiceMeta,
          invoiceNumber,
          invoiceDate: fresh.invoiceDate,
          dueDate: fresh.dueDate,
        },
      });
    });

  const handleSetStatus = ({ invoice }, status) =>
    run(() => repository.saveInvoice({ ...invoice, status }));

  const handleDelete = ({ invoice }) => {
    if (
      !window.confirm(
        `Delete invoice ${invoice.invoiceMeta.invoiceNumber}? This cannot be undone.`,
      )
    ) {
      return;
    }
    run(() => repository.deleteInvoice(invoice.id));
  };

  return (
    <div className="flex flex-col flex-1 font-sans p-3 sm:p-4 pb-24 md:pb-4 mx-auto max-w-6xl w-full gap-5">
      <AppNav />
      <div className="flex gap-2 text-2xl items-center">
        <ListChecksIcon size={40} weight="light" />
        Invoices
      </div>

      <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:gap-4">
        <StatCard label="Outstanding" value={stats.outstanding} />
        <StatCard label="Overdue" value={stats.overdue} />
        <StatCard label="Paid" value={stats.paid} />
      </div>

      <div className="w-full bg-white p-4 border border-black/10 shadow flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((value) => (
              <Button
                key={value}
                size="sm"
                variant={filter === value ? "default" : "secondary"}
                className="border border-black/10"
                onClick={() => setFilter(value)}
              >
                {value === "all" ? "All" : STATUS_LABEL[value]}
                <span className="ml-1 opacity-60">{counts[value] || 0}</span>
              </Button>
            ))}
          </div>
          <div className="flex w-full flex-wrap gap-2 sm:w-auto">
            <div className="relative min-w-[200px] flex-1 sm:w-64 sm:flex-none">
              <Input
                type="search"
                aria-label="Search invoices"
                placeholder="Search no., customer, memo, amount…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <select
              aria-label="Sort invoices"
              className="h-8 border border-input bg-transparent px-2 text-xs outline-none"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              {SORTS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-black/50">
          <span aria-live="polite">
            Showing {visible.length} of {invoices.length} invoice
            {invoices.length === 1 ? "" : "s"}
          </span>
          {hasFilters ? (
            <button
              type="button"
              className="underline hover:text-black"
              onClick={() => {
                setFilter("all");
                setQuery("");
              }}
            >
              Clear filters
            </button>
          ) : null}
        </div>

        {error ? <p className="text-xs text-red-700">{error}</p> : null}

        {/* Phones: one card per invoice, no sideways scrolling. */}
        <div className="flex flex-col gap-3 lg:hidden">
          {visible.length === 0 ? (
            <p className="p-6 text-center text-sm text-black/40">
              {!loaded
                ? "Loading…"
                : invoices.length === 0
                  ? "No saved invoices yet. Create one and press Save."
                  : "No invoices match. Try fewer words or Clear filters."}
            </p>
          ) : (
            visible.map((row) => {
              const { invoice, displayStatus } = row;
              return (
                <div
                  key={invoice.id}
                  className="border border-black/10 bg-white p-3 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold">
                        {invoice.invoiceMeta.invoiceNumber}
                      </p>
                      <p className="truncate text-sm text-black/60">
                        {invoice.customer?.name || "—"}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 px-2 py-0.5 text-xs font-medium",
                        STATUS_BADGE_CLASS[displayStatus],
                      )}
                    >
                      {STATUS_LABEL[displayStatus]}
                    </span>
                  </div>
                  <div className="mt-2 flex items-end justify-between text-xs text-black/50">
                    <span>
                      {formatDate(invoice.invoiceMeta.invoiceDate)} · due{" "}
                      {formatDate(invoice.invoiceMeta.dueDate)}
                    </span>
                    <span className="text-base font-semibold text-black">
                      ₹ {formatCurrency(invoice.totals?.payable)}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-[1fr_auto_auto_auto] gap-2">
                    {invoice.status === "paid" ? (
                      <Button
                        variant="secondary"
                        onClick={() => handleSetStatus(row, "sent")}
                      >
                        Mark unpaid
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
                        onClick={() =>
                          handleSetStatus(
                            row,
                            invoice.status === "draft" ? "sent" : "paid",
                          )
                        }
                      >
                        {invoice.status === "draft" ? "Mark sent" : "Mark paid"}
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="secondary"
                      aria-label="Open invoice"
                      onClick={() => handleOpen(invoice.id)}
                    >
                      <PencilSimpleIcon size={15} />
                    </Button>
                    <Button
                      size="icon"
                      variant="secondary"
                      aria-label="Duplicate invoice"
                      onClick={() => handleDuplicate(row)}
                    >
                      <CopyIcon size={15} />
                    </Button>
                    <Button
                      size="icon"
                      variant="destructive"
                      aria-label="Delete invoice"
                      onClick={() => handleDelete(row)}
                    >
                      <TrashIcon size={15} />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="hidden lg:block">
        <Table>
          <TableHeader className="bg-black/[3%]">
            <TableRow>
              <TableHead>Invoice No.</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead className="hidden sm:table-cell">Date</TableHead>
              <TableHead className="hidden md:table-cell">Due Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="p-6 text-center text-black/40">
                  {!loaded
                    ? "Loading…"
                    : invoices.length === 0
                      ? "No saved invoices yet. Create one and press Save Invoice (Ctrl S)."
                      : "No invoices match. Try fewer words or Clear filters."}
                </TableCell>
              </TableRow>
            ) : (
              visible.map((row) => {
                const { invoice, displayStatus } = row;
                return (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">
                      {invoice.invoiceMeta.invoiceNumber}
                    </TableCell>
                    <TableCell>{invoice.customer?.name || "—"}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {formatDate(invoice.invoiceMeta.invoiceDate)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {formatDate(invoice.invoiceMeta.dueDate)}
                    </TableCell>
                    <TableCell className="text-right">
                      ₹ {formatCurrency(invoice.totals?.payable)}
                    </TableCell>
                    <TableCell className="text-center">
                      <span
                        className={cn(
                          "inline-block px-2 py-0.5 text-xs font-medium",
                          STATUS_BADGE_CLASS[displayStatus],
                        )}
                      >
                        {STATUS_LABEL[displayStatus]}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        {invoice.status === "paid" ? (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleSetStatus(row, "sent")}
                          >
                            Mark unpaid
                          </Button>
                        ) : (
                          <>
                            {invoice.status === "draft" ? (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleSetStatus(row, "sent")}
                              >
                                Mark sent
                              </Button>
                            ) : null}
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleSetStatus(row, "paid")}
                            >
                              Mark paid
                            </Button>
                          </>
                        )}
                        <Button
                          size="icon"
                          variant="secondary"
                          title="Open"
                          onClick={() => handleOpen(invoice.id)}
                        >
                          <PencilSimpleIcon size={15} />
                        </Button>
                        <Button
                          size="icon"
                          variant="secondary"
                          title="Duplicate"
                          onClick={() => handleDuplicate(row)}
                        >
                          <CopyIcon size={15} />
                        </Button>
                        <Button
                          size="icon"
                          variant="destructive"
                          title="Delete"
                          onClick={() => handleDelete(row)}
                        >
                          <TrashIcon size={15} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        </div>
      </div>
    </div>
  );
}
