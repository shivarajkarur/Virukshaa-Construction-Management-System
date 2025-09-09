import { NextResponse } from "next/server";
import connectToDB from "@/lib/db";
import MaterialRequest from "@/models/MaterialRequestModel";

// PATCH /api/material-requests/[id]
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json().catch(() => ({}));
    const { status, notes } = body as { status?: string; notes?: string };

    if (!id) {
      return NextResponse.json(
        { message: "Request ID is required" },
        { status: 400 }
      );
    }

    await connectToDB();

    const update: Record<string, any> = {};
    if (status) update.status = status;
    if (typeof notes === 'string') update.notes = notes;

    if (Object.keys(update).length === 0) {
      return NextResponse.json(
        { message: "No valid fields to update" },
        { status: 400 }
      );
    }

    const updated = await MaterialRequest.findByIdAndUpdate(id, update, { new: true });
    if (!updated) {
      return NextResponse.json({ message: "Material request not found" }, { status: 404 });
    }

    return NextResponse.json({
      _id: updated._id.toString(),
      material: updated.material,
      materialName: updated.materialName,
      unit: updated.unit,
      quantity: updated.quantity,
      status: updated.status,
      requestDate: updated.requestDate.toISOString(),
      requiredDate: updated.requiredDate.toISOString(),
      notes: updated.notes,
      requestedBy: updated.requestedBy,
      supervisor: updated.supervisor,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('Error updating material request:', error);
    return NextResponse.json(
      { message: 'Failed to update material request' },
      { status: 500 }
    );
  }
}

// DELETE /api/material-requests/[id]
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json(
        { message: "Request ID is required" },
        { status: 400 }
      );
    }

    await connectToDB();

    const deleted = await MaterialRequest.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ message: "Material request not found" }, { status: 404 });
    }

    return NextResponse.json({ message: 'Material request deleted successfully' });
  } catch (error) {
    console.error('Error deleting material request:', error);
    return NextResponse.json(
      { message: 'Failed to delete material request' },
      { status: 500 }
    );
  }
}
