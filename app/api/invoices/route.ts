import { NextRequest, NextResponse } from "next/server";
import connectToDB from "@/lib/db";
import Invoice from "@/models/Invoice";

// GET /api/invoices?clientId=...&projectId=...
export async function GET(req: NextRequest) {
  await connectToDB();
  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get("clientId");
    const projectId = searchParams.get("projectId");

    const query: any = {};
    if (clientId) query.clientId = clientId;
    if (projectId) query.projectId = projectId;

    const invoices = await Invoice.find(query).sort({ createdAt: -1 });
    return NextResponse.json(invoices);
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/invoices
export async function POST(req: NextRequest) {
  await connectToDB();
  try {
    const body = await req.json();
    const { clientId, projectId, invoiceNumber, amount, status, dueDate, notes } = body;

    if (!clientId || !invoiceNumber || typeof amount !== "number" || !dueDate) {
      return NextResponse.json(
        { message: "clientId, invoiceNumber, amount, and dueDate are required" },
        { status: 400 }
      );
    }

    const invoice = await Invoice.create({
      clientId,
      projectId: projectId || undefined,
      invoiceNumber,
      amount,
      status: status || "Pending",
      dueDate: new Date(dueDate),
      notes,
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error: any) {
    if (error?.code === 11000) {
      return NextResponse.json({ message: "Duplicate invoiceNumber for this client" }, { status: 409 });
    }
    console.error("Error creating invoice:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
