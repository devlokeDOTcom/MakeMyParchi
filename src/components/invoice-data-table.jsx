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
import { useInvoice } from "@/context/invoice-context";

function calculateDraftTotal(qtn, unitPrice, gst) {
  const quantity = Number(qtn) || 0;
  const price = Number(unitPrice) || 0;
  const tax = Number(gst) || 0;
  const subtotal = quantity * price;
  return subtotal + (subtotal * tax) / 100;
}

export function InvoiceDataTable() {
  const {
    lineItems,
    totalAmount,
    addLineItem,
    updateLineItem,
    removeLineItem,
  } = useInvoice();

  const [invoiceDetails, setInvoiceDetails] = useState({
    desc: "",
    qtn: "",
    unitPrice: "",
    gst: "",
  });

  const handleAddInvoiceItem = () => {
    if (
      !invoiceDetails.desc ||
      !invoiceDetails.qtn ||
      !invoiceDetails.unitPrice
    ) {
      return;
    }

    addLineItem(invoiceDetails);

    setInvoiceDetails({
      desc: "",
      qtn: "",
      unitPrice: "",
      gst: "",
    });
  };

  const draftTotal = calculateDraftTotal(
    invoiceDetails.qtn,
    invoiceDetails.unitPrice,
    invoiceDetails.gst,
  );

  return (
    <Table className="">
      <TableHeader className="bg-black/[3%]">
        <TableRow>
          <TableHead className={"min-w-[50px]"}>SL No.</TableHead>
          <TableHead className={"items-start w-full"}>
            Item Description
          </TableHead>
          <TableHead className={"text-center"}>QTN</TableHead>
          <TableHead className={"min-w-[100px] text-center"}>
            Unit Price
          </TableHead>
          <TableHead className={"min-w-[50px] text-center"}>GST</TableHead>
          <TableHead className={"min-w-[100px] text-center"}>
            Total Amount
          </TableHead>
          <TableHead className={"text-center"}>Action</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {lineItems.map((invoiceDetail, index) => (
          <TableRow key={invoiceDetail.id}>
            <TableCell className="min-w-[50px] text-center">
              {index + 1}
            </TableCell>

            <TableCell className="items-start w-full">
              <Input
                value={invoiceDetail.desc}
                onChange={(event) =>
                  updateLineItem(
                    invoiceDetail.id,
                    "desc",
                    event.target.value,
                  )
                }
              />
            </TableCell>

            <TableCell className="min-w-[100px] text-center">
              <Input
                type="number"
                value={invoiceDetail.qtn}
                onChange={(event) =>
                  updateLineItem(invoiceDetail.id, "qtn", event.target.value)
                }
              />
            </TableCell>

            <TableCell className="min-w-[100px] text-center">
              <Input
                type="number"
                value={invoiceDetail.unitPrice}
                onChange={(event) =>
                  updateLineItem(
                    invoiceDetail.id,
                    "unitPrice",
                    event.target.value,
                  )
                }
              />
            </TableCell>

            <TableCell className="min-w-[100px] text-center">
              <Input
                type="number"
                value={invoiceDetail.gst}
                onChange={(event) =>
                  updateLineItem(invoiceDetail.id, "gst", event.target.value)
                }
              />
            </TableCell>

            <TableCell className="min-w-[150px] text-center">
              ₹ {invoiceDetail.totalAmount}
            </TableCell>

            <TableCell className="text-center">
              <Button
                size="icon"
                variant="destructive"
                onClick={() => removeLineItem(invoiceDetail.id)}
              >
                <TrashIcon size={15} />
              </Button>
            </TableCell>
          </TableRow>
        ))}

        <TableRow>
          <TableCell className={"min-w-[50px] text-center"}>
            {lineItems.length + 1}
          </TableCell>

          <TableCell className={"items-start w-full"}>
            <Input
              placeholder="Awesome items description ..."
              value={invoiceDetails.desc}
              onChange={(event) => {
                setInvoiceDetails({
                  ...invoiceDetails,
                  desc: event.target.value,
                });
              }}
              className={"rounded shadow"}
            />
          </TableCell>

          <TableCell className={"min-w-[100px] text-center"}>
            <Input
              placeholder="00"
              value={invoiceDetails.qtn}
              type={"number"}
              onChange={(event) => {
                setInvoiceDetails({
                  ...invoiceDetails,
                  qtn: event.target.value,
                });
              }}
              className={"rounded shadow"}
            />
          </TableCell>

          <TableCell className={"min-w-[100px] text-center"}>
            <Input
              placeholder="₹ 00"
              value={invoiceDetails.unitPrice}
              type={"number"}
              onChange={(event) => {
                setInvoiceDetails({
                  ...invoiceDetails,
                  unitPrice: event.target.value,
                });
              }}
              className={"rounded shadow "}
            />
          </TableCell>

          <TableCell className={"min-w-[100px] text-center"}>
            <Input
              placeholder="00 %"
              value={invoiceDetails.gst}
              type={"number"}
              onChange={(event) => {
                setInvoiceDetails({
                  ...invoiceDetails,
                  gst: event.target.value,
                });
              }}
              className={"rounded shadow "}
            />
          </TableCell>

          <TableCell className={"min-w-[150px] text-center"}>
            ₹ {draftTotal}
          </TableCell>

          <TableCell />
        </TableRow>

        <TableRow>
          <TableCell colSpan={7} className="text-right">
            <Button
              variant="secondary"
              className={"border border-black/20 shadow"}
              onClick={handleAddInvoiceItem}
            >
              <PlusIcon /> Add Item
            </Button>
          </TableCell>
        </TableRow>
      </TableBody>

      <TableFooter>
        <TableRow>
          <TableCell colSpan={6}>Total</TableCell>
          <TableCell className="text-right">₹ {totalAmount}</TableCell>
        </TableRow>

        <TableRow>
          <TableCell colSpan={4}>Amount in words</TableCell>
          <TableCell colSpan={3} className="text-right">
            {numberToWords(totalAmount)
              .toLowerCase()
              .replace(/(^\s*\w|[.!?]\s*\w)/g, (c) => c.toUpperCase())}
          </TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}
