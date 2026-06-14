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
  return (subtotal * tax) / 100 + subtotal;
}

export function InvoiceDataTable(options) {
  const {
    lineItems,
    totalAmount,
    totalGSTValue,
    totalTaxableAmount,
    addLineItem,
    updateLineItem,
    removeLineItem,
  } = useInvoice();

  const [invoiceDetails, setInvoiceDetails] = useState({
    desc: "",
    qtn: "",
    unitPrice: "",
    gst: "",
    gstValue: "",
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
      taxableAmount: "",
      gst: "",
      gstValue: "",
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
          <TableHead className={""}>SL No.</TableHead>
          <TableHead className={"items-start"}>Item Description</TableHead>
          <TableHead className={"text-center min-w-[50px]"}>QTN</TableHead>
          <TableHead className={"text-center"}>Unit Price</TableHead>
          <TableHead className={"text-center"}>Taxable Amount</TableHead>
          <TableHead className={"text-center"}>GST ( % )</TableHead>
          <TableHead className={"text-center"}>GST Value</TableHead>
          <TableHead className={"text-center"}>Total Amount</TableHead>
          <TableHead className={"text-center"}>Action</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {/* Data show field  */}
        {lineItems.map((invoiceDetail, index) => (
          <TableRow key={invoiceDetail.id}>
            <TableCell className="min-w-[50px] text-center">
              {index + 1}
            </TableCell>

            <TableCell className="items-start w-full">
              <Input
                value={invoiceDetail.desc}
                onChange={(event) =>
                  updateLineItem(invoiceDetail.id, "desc", event.target.value)
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
              <p className="w-full">
                ₹ {(invoiceDetail.qtn * invoiceDetail.unitPrice).toFixed(2)}
              </p>
            </TableCell>

            <TableCell className="max-w-fit min-w-[100px] text-center">
              <Input
                type="number"
                value={invoiceDetail.gst}
                onChange={(event) =>
                  updateLineItem(invoiceDetail.id, "gst", event.target.value)
                }
              />
            </TableCell>
            <TableCell className="text-center">
              ₹{" "}
              {(
                (invoiceDetail.qtn *
                  invoiceDetail.unitPrice *
                  invoiceDetail.gst) /
                100
              ).toFixed(2)}
            </TableCell>
            <TableCell className="min-w-[100px] text-center">
              ₹ {invoiceDetail.totalAmount.toFixed(2)}
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

        {/* Data Input field  */}
        <TableRow>
          <TableCell className={"text-center"}>
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

          <TableCell className={"text-center min-w-[100px]"}>
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

          <TableCell className={"text-center min-w-[100px]"}>
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

          <TableCell className={"text-center"}>
            <p> ₹{invoiceDetails.qtn * invoiceDetails.unitPrice}</p>
          </TableCell>
          <TableCell className={"text-center min-w-[100px]"}>
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

          <TableCell className={"text-center"}>
            ₹{" "}
            {(
              (invoiceDetails.qtn *
                invoiceDetails.unitPrice *
                invoiceDetails.gst) /
              100
            ).toFixed(2)}
          </TableCell>

          <TableCell className={"text-center"}>
            ₹ {draftTotal.toFixed(2)}
          </TableCell>

          <TableCell className={"text-center"}>
            <Button
              variant="secondary"
              className={"border border-black/20 shadow"}
              onClick={handleAddInvoiceItem}
            >
              <PlusIcon /> Add
            </Button>
          </TableCell>
        </TableRow>
      </TableBody>

      <TableFooter>
        <TableRow>
          <TableCell colSpan={4} className="text-right">
            Total :
          </TableCell>
          <TableCell className="text-center border-x border-slate-300">
            ₹ {totalTaxableAmount.toFixed(2)}
          </TableCell>
          <TableCell className=""></TableCell>
          <TableCell className="text-center border-x border-slate-300">
            ₹ {totalGSTValue.toFixed(2)}
          </TableCell>
          <TableCell className="text-center border-x border-slate-300">
            ₹ {totalAmount.toFixed(2)}
          </TableCell>
          <TableCell className=""></TableCell>
        </TableRow>

        <TableRow>
          <TableCell colSpan={7} className={"text-right border-r"}>
            Round off :{" "}
          </TableCell>
          <TableCell className="text-center border-r">
            ₹{" "}
            {(
              Math.ceil(totalAmount.toFixed(2)) - totalAmount.toFixed(2)
            ).toFixed(2)}
          </TableCell>
          <TableCell className=""></TableCell>
        </TableRow>
        <TableRow>
          <TableCell colSpan={7} className={"text-right border-r"}>
            Amount to Pay :{" "}
          </TableCell>
          <TableCell className="text-center border-r">
            ₹ {Math.ceil(totalAmount.toFixed(2)).toFixed(2)}
          </TableCell>
          <TableCell className=""></TableCell>
        </TableRow>
        <TableRow>
          <TableCell colSpan={9} className="text-right italic">
            Amount in words:
            <span className="px-2"></span>
            {numberToWords(Math.ceil(totalAmount.toFixed(2)))
              .toLowerCase()
              .replace(/(^\s*\w|[.!?]\s*\w)/g, (c) => c.toUpperCase())}{" "}
            rupees
          </TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}
