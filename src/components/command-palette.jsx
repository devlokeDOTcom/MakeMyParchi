"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AddressBookIcon,
  ListChecksIcon,
  MagnifyingGlassIcon,
  NewspaperClippingIcon,
  PlusIcon,
} from "@phosphor-icons/react";
import { useInvoice } from "@/context/invoice-context";
import { formatCurrency, formatDate } from "@/lib/invoice-calc";
import {
  STATUS_BADGE_CLASS,
  STATUS_LABEL,
  getDisplayStatus,
} from "@/lib/invoice-status";
import { repository } from "@/lib/repositories";
import { cn } from "@/lib/utils";

export const OPEN_PALETTE_EVENT = "make-my-parchi:open-search";

export function openCommandPalette() {
  window.dispatchEvent(new Event(OPEN_PALETTE_EVENT));
}

const MAX_PER_GROUP = 6;

/** Every word typed must appear somewhere in the haystack. */
function matches(haystack, needle) {
  if (!needle) return true;
  const text = haystack.toLowerCase();
  return needle
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => text.includes(word));
}

/**
 * Global search (Ctrl/Cmd + K, or "/" outside inputs): jump to any saved
 * invoice or customer, or run a quick action. Fully keyboard driven.
 */
export function CommandPalette() {
  const router = useRouter();
  const { createNewInvoice, openInvoice, applyCustomer } = useInvoice();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [data, setData] = useState({ invoices: [], customers: [] });
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const show = useCallback(() => {
    setQuery("");
    setActive(0);
    setOpen(true);
    Promise.all([repository.listInvoices(), repository.listCustomers()])
      .then(([invoices, customers]) => setData({ invoices, customers }))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const onKey = (event) => {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(
        event.target?.tagName ?? "",
      );
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        show();
      } else if (event.key === "/" && !typing && !event.ctrlKey) {
        event.preventDefault();
        show();
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_PALETTE_EVENT, show);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_PALETTE_EVENT, show);
    };
  }, [show]);

  const close = useCallback(() => setOpen(false), []);

  const results = useMemo(() => {
    const needle = query.trim();
    const go = (href) => () => {
      close();
      router.push(href);
    };

    const actions = [
      {
        key: "act-new",
        group: "Actions",
        icon: PlusIcon,
        title: "Create new invoice",
        hint: "Start with a fresh invoice number",
        run: async () => {
          close();
          await createNewInvoice();
          router.push("/");
        },
      },
      {
        key: "act-invoices",
        group: "Actions",
        icon: ListChecksIcon,
        title: "Go to Invoices",
        run: go("/invoices"),
      },
      {
        key: "act-customers",
        group: "Actions",
        icon: AddressBookIcon,
        title: "Go to Customers",
        run: go("/customers"),
      },
      {
        key: "act-editor",
        group: "Actions",
        icon: NewspaperClippingIcon,
        title: "Go to the invoice editor",
        run: go("/"),
      },
    ].filter((entry) => matches(entry.title, needle));

    const invoices = data.invoices
      .map((invoice) => ({ invoice, status: getDisplayStatus(invoice) }))
      .filter(({ invoice, status }) =>
        matches(
          [
            invoice.invoiceMeta?.invoiceNumber,
            invoice.invoiceMeta?.memoNo,
            invoice.customer?.name,
            invoice.customer?.gstin,
            STATUS_LABEL[status],
            String(invoice.totals?.payable ?? ""),
          ].join(" "),
          needle,
        ),
      )
      .slice(0, MAX_PER_GROUP)
      .map(({ invoice, status }) => ({
        key: `inv-${invoice.id}`,
        group: "Invoices",
        icon: NewspaperClippingIcon,
        title: invoice.invoiceMeta?.invoiceNumber || "Untitled invoice",
        hint: `${invoice.customer?.name || "No customer"} · ${formatDate(
          invoice.invoiceMeta?.invoiceDate,
        )}`,
        meta: `₹ ${formatCurrency(invoice.totals?.payable)}`,
        status,
        run: async () => {
          close();
          if (await openInvoice(invoice.id)) router.push("/");
        },
      }));

    const customers = data.customers
      .filter((entry) =>
        matches(
          [entry.name, entry.gstin, entry.phone, entry.email, entry.address]
            .filter(Boolean)
            .join(" "),
          needle,
        ),
      )
      .slice(0, MAX_PER_GROUP)
      .map((entry) => ({
        key: `cus-${entry.id}`,
        group: "Customers",
        icon: AddressBookIcon,
        title: entry.name,
        hint: [entry.gstin, entry.phone].filter(Boolean).join(" · "),
        meta: "Use on current invoice",
        run: () => {
          close();
          applyCustomer(entry);
          router.push("/");
        },
      }));

    // With nothing typed, lead with actions; once typing, lead with records.
    return needle
      ? [...invoices, ...customers, ...actions]
      : [...actions, ...invoices, ...customers];
  }, [
    query,
    data,
    close,
    router,
    createNewInvoice,
    openInvoice,
    applyCustomer,
  ]);

  const safeActive = Math.min(active, Math.max(results.length - 1, 0));

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-index="${safeActive}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [safeActive, results]);

  if (!open) return null;

  const onKeyDown = (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive(results.length ? (safeActive + 1) % results.length : 0);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive(
        results.length
          ? (safeActive - 1 + results.length) % results.length
          : 0,
      );
    } else if (event.key === "Enter") {
      event.preventDefault();
      results[safeActive]?.run();
    }
  };

  let lastGroup = "";

  return (
    <div
      className="no-print fixed inset-0 z-[60] flex items-start justify-center bg-black/30 p-3 pt-[10vh] backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        className="flex max-h-[75vh] w-full max-w-xl flex-col overflow-hidden border border-black/10 bg-white shadow-2xl"
        onKeyDown={onKeyDown}
      >
        <div className="flex items-center gap-2 border-b border-black/10 px-3">
          <MagnifyingGlassIcon size={18} className="text-black/40" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
            }}
            placeholder="Search invoices, customers, amounts, status…"
            className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-black/40"
            aria-label="Search"
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-results"
          />
          <kbd className="hidden border border-black/10 px-1.5 py-0.5 text-[10px] text-black/40 sm:block">
            Esc
          </kbd>
        </div>

        <div
          id="palette-results"
          ref={listRef}
          role="listbox"
          className="overflow-y-auto p-1"
        >
          {results.length === 0 ? (
            <p className="p-6 text-center text-sm text-black/40">
              Nothing matches “{query}”. Try an invoice number, customer name
              or amount.
            </p>
          ) : (
            results.map((result, index) => {
              const heading =
                result.group !== lastGroup ? result.group : null;
              lastGroup = result.group;
              const Icon = result.icon;
              return (
                <div key={result.key}>
                  {heading ? (
                    <p className="px-3 pt-2 pb-1 text-[10px] font-medium uppercase tracking-wider text-black/40">
                      {heading}
                    </p>
                  ) : null}
                  <button
                    type="button"
                    role="option"
                    aria-selected={index === safeActive}
                    data-index={index}
                    onMouseMove={() => setActive(index)}
                    onClick={() => result.run()}
                    className={cn(
                      "flex w-full items-center gap-3 px-3 py-2 text-left",
                      index === safeActive
                        ? "bg-black text-white"
                        : "text-black/80",
                    )}
                  >
                    <Icon size={18} weight="light" className="shrink-0" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm">
                        {result.title}
                      </span>
                      {result.hint ? (
                        <span
                          className={cn(
                            "block truncate text-xs",
                            index === safeActive
                              ? "text-white/60"
                              : "text-black/40",
                          )}
                        >
                          {result.hint}
                        </span>
                      ) : null}
                    </span>
                    {result.status ? (
                      <span
                        className={cn(
                          "shrink-0 px-1.5 py-0.5 text-[10px] font-medium",
                          STATUS_BADGE_CLASS[result.status],
                        )}
                      >
                        {STATUS_LABEL[result.status]}
                      </span>
                    ) : null}
                    {result.meta ? (
                      <span
                        className={cn(
                          "hidden shrink-0 text-xs sm:block",
                          index === safeActive
                            ? "text-white/70"
                            : "text-black/50",
                        )}
                      >
                        {result.meta}
                      </span>
                    ) : null}
                  </button>
                </div>
              );
            })
          )}
        </div>

        <div className="hidden items-center gap-4 border-t border-black/10 px-3 py-2 text-[10px] text-black/40 sm:flex">
          <span>↑↓ navigate</span>
          <span>↵ open</span>
          <span>Esc close</span>
        </div>
      </div>
    </div>
  );
}
