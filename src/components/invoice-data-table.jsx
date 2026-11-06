import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { PlusIcon, TrashIcon } from "@phosphor-icons/react";
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

  const draftAmounts = calculateItemAmounts(draft, template);
  const totalColumns = isBook ? 10 : 9;

  const handleAdd = () => {
    if (!draft.desc || !draft.qtn || !draft.unitPrice) return;
    addLineItem(draft);
    setDraft(EMPTY_ITEM);
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

  return (
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
              <TableCell className="items-start w-full">
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

        {/* Data input row — Enter in any field adds the item */}
        <TableRow
          onKeyDown={(event) => {
            if (event.key === "Enter") handleAdd();
          }}
        >
          <TableCell className="text-center">{lineItems.length + 1}</TableCell>
          <TableCell className="items-start w-full">
            {draftInput("desc", {
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
}
