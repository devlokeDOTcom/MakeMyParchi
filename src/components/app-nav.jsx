"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AddressBookIcon,
  ListChecksIcon,
  MagnifyingGlassIcon,
  NewspaperClippingIcon,
} from "@phosphor-icons/react";
import { openCommandPalette } from "@/components/command-palette";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "New Invoice", short: "Invoice", icon: NewspaperClippingIcon },
  { href: "/invoices", label: "Invoices", short: "Invoices", icon: ListChecksIcon },
  { href: "/customers", label: "Customers", short: "Customers", icon: AddressBookIcon },
];

/**
 * Desktop/tablet: a top bar. Phones: a thumb-reachable bottom tab bar, so
 * navigation never wraps or scrolls sideways.
 */
export function AppNav() {
  const pathname = usePathname();

  return (
    <>
      <nav className="no-print hidden w-full flex-wrap gap-2 md:flex">
        {LINKS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2 border border-black/10 px-4 py-2 text-sm shadow-md",
              pathname === href
                ? "bg-black text-white"
                : "bg-white text-black/70",
            )}
          >
            <Icon size={18} weight="light" />
            {label}
          </Link>
        ))}
        <button
          type="button"
          onClick={openCommandPalette}
          aria-label="Search invoices and customers"
          className="ml-auto flex min-w-[220px] items-center gap-2 border border-black/10 bg-white px-3 py-2 text-sm text-black/50 shadow-md hover:text-black"
        >
          <MagnifyingGlassIcon size={18} weight="light" />
          <span>Search…</span>
          <kbd className="ml-auto border border-black/10 px-1.5 text-[10px]">
            Ctrl K
          </kbd>
        </button>
      </nav>

      <nav
        aria-label="Main"
        className="no-print fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-black/10 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_12px_rgba(0,0,0,0.06)] backdrop-blur md:hidden"
      >
        {LINKS.map(({ href, short, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-col items-center gap-0.5 py-2 text-[11px]",
                active ? "font-semibold text-black" : "text-black/50",
              )}
            >
              <span
                className={cn(
                  "px-4 py-1",
                  active ? "bg-black text-white" : "",
                )}
              >
                <Icon size={20} weight={active ? "fill" : "light"} />
              </span>
              {short}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={openCommandPalette}
          aria-label="Search invoices and customers"
          className="flex flex-col items-center gap-0.5 py-2 text-[11px] text-black/50"
        >
          <span className="px-4 py-1">
            <MagnifyingGlassIcon size={20} weight="light" />
          </span>
          Search
        </button>
      </nav>
    </>
  );
}
