"use client";

import { useCallback, useEffect, useState } from "react";
import { AddressBookIcon, PencilSimpleIcon, TrashIcon } from "@phosphor-icons/react";
import { AppNav } from "@/components/app-nav";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { repository } from "@/lib/repositories";

const EMPTY_FORM = { name: "", address: "", gstin: "", phone: "", email: "" };

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    try {
      setCustomers(await repository.listCustomers());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load customers.");
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    repository
      .listCustomers()
      .then((list) => {
        if (!cancelled) setCustomers(list);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Could not load customers.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const update = (key) => (e) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const reset = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const handleSave = async () => {
    try {
      await repository.saveCustomer({ ...form, id: editingId });
      setError("");
      reset();
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save customer.");
    }
  };

  const handleEdit = (customer) => {
    const { id, name, address, gstin, phone, email } = customer;
    setEditingId(id);
    setForm({ name, address, gstin, phone, email });
  };

  const handleDelete = async (customer) => {
    if (!window.confirm(`Delete ${customer.name} from the customer book?`)) {
      return;
    }
    try {
      await repository.deleteCustomer(customer.id);
      if (editingId === customer.id) reset();
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete customer.");
    }
  };

  return (
    <div className="flex flex-col flex-1 font-sans p-3 sm:p-4 pb-24 md:pb-4 mx-auto max-w-6xl w-full gap-5">
      <AppNav />
      <div className="flex gap-2 text-2xl items-center">
        <AddressBookIcon size={40} weight="light" />
        Customers
      </div>

      <div className="w-full bg-white p-4 border border-black/10 shadow flex flex-col gap-4">
        <h1 className="text-lg">
          {editingId ? "Edit customer" : "Add customer"}
        </h1>
        <div className="flex flex-col lg:flex-row gap-5 w-full border rounded shadow p-5">
          <div className="flex flex-col gap-5 flex-1">
            <Field>
              <Label>Customer Name</Label>
              <Input
                placeholder="Customer name"
                value={form.name}
                onChange={update("name")}
              />
            </Field>
            <Field>
              <Label>Address</Label>
              <Textarea
                placeholder="Customer address"
                className="w-full"
                value={form.address}
                onChange={update("address")}
              />
            </Field>
          </div>
          <div className="flex flex-col gap-5 flex-1">
            <Field>
              <Label>GSTIN</Label>
              <Input
                placeholder="15 digit GSTIN"
                value={form.gstin}
                onChange={update("gstin")}
              />
            </Field>
            <Field>
              <Label>Phone no.</Label>
              <Input
                placeholder="+91 9876543210"
                value={form.phone}
                onChange={update("phone")}
              />
            </Field>
            <Field>
              <Label>Email Address</Label>
              <Input
                placeholder="customer@email.com"
                value={form.email}
                onChange={update("email")}
              />
            </Field>
            <div className="flex gap-2 justify-end">
              {editingId ? (
                <Button
                  type="button"
                  variant="secondary"
                  className="border border-black/20"
                  onClick={reset}
                >
                  Cancel
                </Button>
              ) : null}
              <Button type="button" onClick={handleSave}>
                {editingId ? "Update" : "Add"}
              </Button>
            </div>
          </div>
        </div>
        {error ? <p className="text-xs text-red-700">{error}</p> : null}
      </div>

      <div className="w-full bg-white p-3 sm:p-4 border border-black/10 shadow">
        {/* Phones: one card per customer, no sideways scrolling. */}
        <div className="flex flex-col gap-3 lg:hidden">
          {customers.length === 0 ? (
            <p className="p-6 text-center text-sm text-black/40">
              {loaded ? "No customers saved yet." : "Loading…"}
            </p>
          ) : (
            customers.map((customer) => (
              <div
                key={customer.id}
                className="flex items-start justify-between gap-2 border border-black/10 p-3"
              >
                <div className="min-w-0 text-sm">
                  <p className="font-semibold">{customer.name}</p>
                  {customer.gstin ? (
                    <p className="text-xs text-black/60">GSTIN {customer.gstin}</p>
                  ) : null}
                  {customer.phone ? (
                    <p className="text-xs text-black/60">{customer.phone}</p>
                  ) : null}
                  {customer.email ? (
                    <p className="truncate text-xs text-black/60">{customer.email}</p>
                  ) : null}
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    size="icon"
                    variant="secondary"
                    aria-label="Edit customer"
                    onClick={() => handleEdit(customer)}
                  >
                    <PencilSimpleIcon size={15} />
                  </Button>
                  <Button
                    size="icon"
                    variant="destructive"
                    aria-label="Delete customer"
                    onClick={() => handleDelete(customer)}
                  >
                    <TrashIcon size={15} />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="hidden lg:block">
        <Table>
          <TableHeader className="bg-black/[3%]">
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>GSTIN</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="p-6 text-center text-black/40">
                  {loaded ? "No customers saved yet." : "Loading…"}
                </TableCell>
              </TableRow>
            ) : (
              customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell>{customer.gstin || "—"}</TableCell>
                  <TableCell>{customer.phone || "—"}</TableCell>
                  <TableCell>{customer.email || "—"}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        size="icon"
                        variant="secondary"
                        title="Edit"
                        onClick={() => handleEdit(customer)}
                      >
                        <PencilSimpleIcon size={15} />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        title="Delete"
                        onClick={() => handleDelete(customer)}
                      >
                        <TrashIcon size={15} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        </div>
      </div>
    </div>
  );
}
