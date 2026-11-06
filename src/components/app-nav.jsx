"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AddressBookIcon,
  ListChecksIcon,
  NewspaperClippingIcon,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "New Invoice", icon: NewspaperClippingIcon },
  { href: "/invoices", label: "Invoices", icon: ListChecksIcon },
  { href: "/customers", label: "Customers", icon: AddressBookIcon },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="no-print flex w-full flex-wrap gap-2">
      {LINKS.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "flex items-center gap-2 border border-black/10 px-4 py-2 text-sm shadow-md",
            pathname === href ? "bg-black text-white" : "bg-white text-black/70",
          )}
        >
          <Icon size={18} weight="light" />
          {label}
        </Link>
      ))}
    </nav>
  );
}
