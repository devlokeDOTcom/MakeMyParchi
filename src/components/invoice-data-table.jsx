import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEffect, useRef, useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { PencilSimpleIcon, PlusIcon, TrashIcon } from "@phosphor-icons/react";
import { numberToWords } from "@/lib/utils";
import {
  calculateItemAmounts,
  formatRoundOff,
  summarizeLineItems,
} from "@/lib/invoice-calc";
import { isBookTemplate } from "@/lib/invoice-templates";
import { useInvoice } from "@/context/invoice-context";

const EMPTY_ITEM = {
  desc: "",
  author: "",
  publisher: "",
  qtn: "",
  unitPrice: "",
  gst: "",
  discount: "",
};

const STANDARD_HEADERS = [
  { label: "SL No." },
  { label: "Item Description", className: "items-start" },
  { label: "QTN", className: "text-center min-w-[50px]" },
  { label: "Unit Price", className: "text-center" },
  { label: "Taxable Amount", className: "text-center" },
  { label: "GST ( % )", className: "text-center" },
  { label: "GST Value", className: "text-center" },
  { label: "Total Amount", className: "text-center" },
  { label: "Action", className: "text-center" },
];

const BOOK_HEADERS = [
  { label: "SL No." },
  { label: "Book Name", className: "items-start" },
  { label: "Author Name", className: "text-center" },
  { label: "Publishers", className: "text-center" },
  { label: "Quantity", className: "text-center min-w-[50px]" },
  { label: "Unit Price", className: "text-center" },
  { label: "Amount", className: "text-center" },
  { label: "Discount ( % )", className: "text-center" },
  { label: "Total Amount", className: "text-center" },
  { label: "Action", className: "text-center" },
];

const money = (value) => `₹ ${value.toFixed(2)}`;

export function InvoiceDataTable() {
  const {
    lineItems,
    template,
    addLineItem,
    updateLineItem,
    removeLineItem,
  } = useInvoice();
  const isBook = isBookTemplate(template);
  const summary = summarizeLineItems(lineItems, template);
  const [draft, setDraft] = useState(EMPTY_ITEM);
  // Phones: which item row is currently opened for editing (and its values).
  const [editing, setEditing] = useState(null);

  const startEdit = (item) =>
    setEditing({
      id: item.id,
      values: {
        desc: item.desc ?? "",
        author: item.author ?? "",
        publisher: item.publisher ?? "",
        qtn: item.qtn ?? "",
        unitPrice: item.unitPrice ?? "",
        gst: item.gst ?? "",
        discount: item.discount ?? "",
      },
    });

  const saveEdit = () => {
    if (!editing) return;
    const { id, values } = editing;
    if (!String(values.desc).trim()) return;
    Object.entries(values).forEach(([key, value]) =>
      updateLineItem(id, key, value),
    );
    setEditing(null);
  };

  const draftAmounts = calculateItemAmounts(draft, template);
  const totalColumns = isBook ? 10 : 9;

  const descRef = useRef(null);
  const mobileDescRef = useRef(null);

  // Focus whichever description box is actually on screen.
  const focusDesc = (options) => {
    [descRef, mobileDescRef]
      .find((ref) => ref.current && ref.current.offsetParent !== null)
      ?.current.focus(options);
  };

  // Cursor starts in the description box for both templates (desktop only:
  // on phones it would pop the keyboard open on page load).
  useEffect(() => {
    if (!window.matchMedia("(min-width: 1024px)").matches) return;
    [descRef, mobileDescRef]
      .find((ref) => ref.current && ref.current.offsetParent !== null)
      ?.current.focus({ preventScroll: true });
  }, [isBook]);

  const handleAdd = () => {
    if (!draft.desc || !draft.qtn || !draft.unitPrice) return;
    addLineItem(draft);
    setDraft(EMPTY_ITEM);
    focusDesc();
  };

  const setDraftField = (key) => (event) =>
    setDraft((prev) => ({ ...prev, [key]: event.target.value }));

  const editCell = (item, key, props = {}) => (
    <Input
      value={item[key] ?? ""}
      onChange={(event) => updateLineItem(item.id, key, event.target.value)}
      {...props}
    />
  );

  const draftInput = (key, props = {}) => (
    <Input
      value={draft[key]}
      onChange={setDraftField(key)}
      className="rounded shadow"
      {...props}
    />
  );

  const amountWords = numberToWords(summary.payable)
    .toLowerCase()
    .replace(/(^\s*\w|[.!?]\s*\w)/g, (c) => c.toUpperCase());

  const desktopTable = (
    <Table>
      <TableHeader className="bg-black/[3%]">
        <TableRow>
          {(isBook ? BOOK_HEADERS : STANDARD_HEADERS).map(
            ({ label, className }) => (
              <TableHead key={label} className={className}>
                {label}
              </TableHead>
            ),
          )}
        </TableRow>
      </TableHeader>

      <TableBody>
        {lineItems.map((item, index) => {
          const line = calculateItemAmounts(item, template);
          return (
            <TableRow key={item.id}>
              <TableCell className="min-w-[50px] text-center">
                {index + 1}
              </TableCell>
              <TableCell className="items-start w-full min-w-[200px]">
                {editCell(item, "desc")}
              </TableCell>
              {isBook ? (
                <>
                  <TableCell className="min-w-[130px]">
                    {editCell(item, "author")}
                  </TableCell>
                  <TableCell className="min-w-[130px]">
                    {editCell(item, "publisher")}
                  </TableCell>
                </>
              ) : null}
              <TableCell className="min-w-[100px] text-center">
                {editCell(item, "qtn", { type: "number", min: 0 })}
              </TableCell>
              <TableCell className="min-w-[100px] text-center">
                {editCell(item, "unitPrice", { type: "number", min: 0 })}
              </TableCell>
              <TableCell className="min-w-[100px] text-center">
                {money(isBook ? line.amount : line.taxable)}
              </TableCell>
              {isBook ? (
                <TableCell className="min-w-[100px] text-center">
                  {editCell(item, "discount", {
                    type: "number",
                    min: 0,
                    max: 100,
                  })}
                </TableCell>
              ) : (
                <>
                  <TableCell className="max-w-fit min-w-[100px] text-center">
                    {editCell(item, "gst", { type: "number", min: 0 })}
                  </TableCell>
                  <TableCell className="text-center">
                    {money(line.gstValue)}
                  </TableCell>
                </>
              )}
              <TableCell className="min-w-[100px] text-center">
                {money(line.total)}
              </TableCell>
              <TableCell className="text-center">
                <Button
                  size="icon"
                  variant="destructive"
                  onClick={() => removeLineItem(item.id)}
                >
                  <TrashIcon size={15} />
                </Button>
              </TableCell>
            </TableRow>
          );
        })}

        {/* Data input row — Tab moves field to field; Enter on the Add button
            (or inside any field) adds the item */}
        <TableRow
          onKeyDown={(event) => {
            // The Add button already handles Enter itself via its click.
            if (event.key === "Enter" && event.target.tagName === "INPUT") {
              handleAdd();
            }
          }}
        >
          <TableCell className="text-center">{lineItems.length + 1}</TableCell>
          <TableCell className="items-start w-full min-w-[200px]">
            {draftInput("desc", {
              ref: descRef,
              placeholder: isBook
                ? "Book title ..."
                : "Awesome items description ...",
            })}
          </TableCell>
          {isBook ? (
            <>
              <TableCell className="min-w-[130px]">
                {draftInput("author", { placeholder: "Author" })}
              </TableCell>
              <TableCell className="min-w-[130px]">
                {draftInput("publisher", { placeholder: "Publisher" })}
              </TableCell>
            </>
          ) : null}
          <TableCell className="text-center min-w-[100px]">
            {draftInput("qtn", { placeholder: "00", type: "number", min: 0 })}
          </TableCell>
          <TableCell className="text-center min-w-[100px]">
            {draftInput("unitPrice", {
              placeholder: "₹ 00",
              type: "number",
              min: 0,
            })}
          </TableCell>
          <TableCell className="text-center">
            {money(isBook ? draftAmounts.amount : draftAmounts.taxable)}
          </TableCell>
          {isBook ? (
            <TableCell className="text-center min-w-[100px]">
              {draftInput("discount", {
                placeholder: "00 %",
                type: "number",
                min: 0,
                max: 100,
              })}
            </TableCell>
          ) : (
            <>
              <TableCell className="text-center min-w-[100px]">
                {draftInput("gst", {
                  placeholder: "00 %",
                  type: "number",
                  min: 0,
                })}
              </TableCell>
              <TableCell className="text-center">
                {money(draftAmounts.gstValue)}
              </TableCell>
            </>
          )}
          <TableCell className="text-center">
            {money(draftAmounts.total)}
          </TableCell>
          <TableCell className="text-center">
            <Button
              variant="secondary"
              className="border border-black/20 shadow"
              onClick={handleAdd}
            >
              <PlusIcon /> Add
            </Button>
          </TableCell>
        </TableRow>
      </TableBody>

      <TableFooter>
        <TableRow>
          <TableCell colSpan={isBook ? 6 : 4} className="text-right">
            Total :
          </TableCell>
          {isBook ? (
            <>
              <TableCell className="text-center border-x border-slate-300">
                {money(summary.amount)}
              </TableCell>
              <TableCell className="text-center border-x border-slate-300">
                {money(summary.discount)}
              </TableCell>
            </>
          ) : (
            <>
              <TableCell className="text-center border-x border-slate-300">
                {money(summary.taxable)}
              </TableCell>
              <TableCell />
              <TableCell className="text-center border-x border-slate-300">
                {money(summary.gstValue)}
              </TableCell>
            </>
          )}
          <TableCell className="text-center border-x border-slate-300">
            {money(summary.total)}
          </TableCell>
          <TableCell />
        </TableRow>

        <TableRow>
          <TableCell colSpan={totalColumns - 2} className="text-right border-r">
            Round off :{" "}
          </TableCell>
          <TableCell className="text-center border-r">
            {formatRoundOff(summary.roundOff)}
          </TableCell>
          <TableCell />
        </TableRow>
        <TableRow>
          <TableCell colSpan={totalColumns - 2} className="text-right border-r">
            Amount to Pay :{" "}
          </TableCell>
          <TableCell className="text-center border-r">
            {money(summary.payable)}
          </TableCell>
          <TableCell />
        </TableRow>
        <TableRow>
          <TableCell colSpan={totalColumns} className="text-right italic">
            Amount in words:
            <span className="px-2"></span>
            {amountWords} rupees
          </TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );

  // Phones/small tablets: one card per item, so nothing scrolls sideways.
  const mobileCards = (
    <div className="flex flex-col gap-3">
      {lineItems.map((item, index) => {
        const isEditing = editing?.id === item.id;

        if (!isEditing) {
          const line = calculateItemAmounts(item, template);
          const detail = isBook
            ? `${item.qtn || 0} × ₹${item.unitPrice || 0}${
                Number(item.discount) ? ` · ${Number(item.discount)}% off` : ""
              }`
            : `${item.qtn || 0} × ₹${item.unitPrice || 0}${
                Number(item.gst) ? ` · GST ${Number(item.gst)}%` : ""
              }`;
          return (
            <div
              key={item.id}
              className="flex items-center gap-2 border border-black/10 bg-white p-2 shadow-sm"
            >
              <span className="w-5 shrink-0 text-center text-xs text-black/40">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {item.desc || "Untitled item"}
                </p>
                <p className="truncate text-[11px] text-black/50">
                  {isBook && item.author ? `${item.author} · ` : ""}
                  {detail}
                </p>
              </div>
              <span className="shrink-0 text-sm font-semibold">
                {money(line.total)}
              </span>
              <Button
                size="icon"
                variant="secondary"
                aria-label={`Edit item ${index + 1}`}
                onClick={() => startEdit(item)}
              >
                <PencilSimpleIcon size={15} />
              </Button>
              <Button
                size="icon"
                variant="destructive"
                aria-label={`Remove item ${index + 1}`}
                onClick={() => removeLineItem(item.id)}
              >
                <TrashIcon size={15} />
              </Button>
            </div>
          );
        }

        // Editing: the row opens into a card; changes apply only on Save.
        const values = editing.values;
        const line = calculateItemAmounts(values, template);
        const field = (key, props = {}) => (
          <Input
            value={values[key] ?? ""}
            onChange={(event) =>
              setEditing((prev) => ({
                ...prev,
                values: { ...prev.values, [key]: event.target.value },
              }))
            }
            {...props}
          />
        );
        const numeric = { type: "number", min: 0, inputMode: "decimal" };
        return (
          <div
            key={item.id}
            className="border border-black bg-white p-3 shadow-md"
            onKeyDown={(event) => {
              if (event.key === "Enter" && event.target.tagName === "INPUT") {
                saveEdit();
              } else if (event.key === "Escape") {
                setEditing(null);
              }
            }}
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-black/60">
                Editing item {index + 1}
              </span>
              <span className="text-sm font-semibold">{money(line.total)}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Labeled label={isBook ? "Book name" : "Description"} className="col-span-2">
                {field("desc")}
              </Labeled>
              {isBook ? (
                <>
                  <Labeled label="Author">{field("author")}</Labeled>
                  <Labeled label="Publisher">{field("publisher")}</Labeled>
                </>
              ) : null}
              <Labeled label="Qty">{field("qtn", numeric)}</Labeled>
              <Labeled label="Unit price">{field("unitPrice", numeric)}</Labeled>
              {isBook ? (
                <Labeled label="Discount %" className="col-span-2">
                  {field("discount", { ...numeric, max: 100 })}
                </Labeled>
              ) : (
                <Labeled label="GST %" className="col-span-2">
                  {field("gst", numeric)}
                </Labeled>
              )}
            </div>
            <div className="mt-3 flex gap-2">
              <Button
                variant="secondary"
                className="flex-1 border border-black/10"
                onClick={() => setEditing(null)}
              >
                Cancel
              </Button>
              <Button className="flex-1" onClick={saveEdit}>
                Save item
              </Button>
            </div>
          </div>
        );
      })}

      {/* New item — Enter in any field adds it */}
      <div
        className="border border-dashed border-black/30 bg-black/[2%] p-3"
        onKeyDown={(event) => {
          if (event.key === "Enter" && event.target.tagName === "INPUT") {
            handleAdd();
          }
        }}
      >
        <p className="mb-2 text-xs font-medium text-black/60">
          Add item {lineItems.length + 1}
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Labeled label={isBook ? "Book name" : "Description"} className="col-span-2">
            {draftInput("desc", {
              ref: mobileDescRef,
              placeholder: isBook ? "Book title ..." : "Item description ...",
            })}
          </Labeled>
          {isBook ? (
            <>
              <Labeled label="Author">
                {draftInput("author", { placeholder: "Author" })}
              </Labeled>
              <Labeled label="Publisher">
                {draftInput("publisher", { placeholder: "Publisher" })}
              </Labeled>
            </>
          ) : null}
          <Labeled label="Qty">
            {draftInput("qtn", { placeholder: "0", type: "number", min: 0, inputMode: "decimal" })}
          </Labeled>
          <Labeled label="Unit price">
            {draftInput("unitPrice", { placeholder: "₹ 0", type: "number", min: 0, inputMode: "decimal" })}
          </Labeled>
          {isBook ? (
            <Labeled label="Discount %" className="col-span-2">
              {draftInput("discount", { placeholder: "0", type: "number", min: 0, max: 100, inputMode: "decimal" })}
            </Labeled>
          ) : (
            <Labeled label="GST %" className="col-span-2">
              {draftInput("gst", { placeholder: "0", type: "number", min: 0, inputMode: "decimal" })}
            </Labeled>
          )}
        </div>
        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="text-sm font-semibold">{money(draftAmounts.total)}</span>
          <Button className="flex-1" onClick={handleAdd}>
            <PlusIcon /> Add item
          </Button>
        </div>
      </div>

      <dl className="border border-black/10 bg-white p-3 text-sm shadow-sm">
        <div className="flex justify-between py-0.5">
          <dt className="text-black/50">Total</dt>
          <dd>{money(summary.total)}</dd>
        </div>
        <div className="flex justify-between py-0.5">
          <dt className="text-black/50">Round off</dt>
          <dd>{formatRoundOff(summary.roundOff)}</dd>
        </div>
        <div className="mt-1 flex justify-between border-t border-black/10 pt-2 font-semibold">
          <dt>Amount to pay</dt>
          <dd>{money(summary.payable)}</dd>
        </div>
        <p className="mt-2 text-xs italic text-black/50">{amountWords} rupees</p>
      </dl>
    </div>
  );

  return (
    <>
      <div className="lg:hidden">{mobileCards}</div>
      <div className="hidden lg:block">{desktopTable}</div>
    </>
  );
}

function Labeled({ label, className = "", children }) {
  return (
    <label className={`flex flex-col gap-1 ${className}`}>
      <span className="text-[11px] text-black/50">{label}</span>
      {children}
    </label>
  );
}
