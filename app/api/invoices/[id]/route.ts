import { NextRequest, NextResponse } from "next/server";
import connectToDB from "@/lib/db";
import Invoice from "@/models/Invoice";

// GET /api/invoices/:id
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  await connectToDB();
  try {
    const invoice = await Invoice.findById(params.id);
    if (!invoice) return NextResponse.json({ message: "Invoice not found" }, { status: 404 });
    return NextResponse.json(invoice);
  } catch (error) {
    console.error("Error fetching invoice:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

// PUT /api/invoices/:id
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  await connectToDB();
  try {
    const body = await req.json();
    const { clientId, projectId, invoiceNumber, amount, status, dueDate, notes } = body;

    const updated = await Invoice.findByIdAndUpdate(
      params.id,
      {
        $set: {
          ...(clientId && { clientId }),
          ...(projectId && { projectId }),
          ...(invoiceNumber && { invoiceNumber }),
          ...(typeof amount === "number" && { amount }),
          ...(status && { status }),
          ...(dueDate && { dueDate: new Date(dueDate) }),
          ...(notes !== undefined && { notes }),
        },
      },
      { new: true, runValidators: true }
    );

    if (!updated) return NextResponse.json({ message: "Invoice not found" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (error: any) {
    if (error?.code === 11000) {
      return NextResponse.json({ message: "Duplicate invoiceNumber for this client" }, { status: 409 });
    }
    console.error("Error updating invoice:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE /api/invoices/:id
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await connectToDB();
  try {
    const deleted = await Invoice.findByIdAndDelete(params.id);
    if (!deleted) return NextResponse.json({ message: "Invoice not found" }, { status: 404 });
    return NextResponse.json({ message: "Invoice deleted" });
  } catch (error) {
    console.error("Error deleting invoice:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
