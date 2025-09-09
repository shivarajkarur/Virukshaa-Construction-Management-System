import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Supplier, { ISupplier } from "@/models/SupplierModel";
import { Types } from 'mongoose';

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(request: Request, { params }: Params) {
  try {
    await dbConnect();
    const { id } = await params;

    const supplier = await Supplier.findById(id);
    if (!supplier) {
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(supplier);
  } catch (error) {
    console.error(`Error fetching supplier:`, error);
    return NextResponse.json(
      { error: "Failed to fetch supplier" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Invalid supplier ID' }, { status: 400 });
    }

    await dbConnect();
    const body = await request.json();

    // Convert date strings to Date objects
    if (body.supplyStartDate && typeof body.supplyStartDate === 'string') {
      body.supplyStartDate = new Date(body.supplyStartDate);
    }


    // Create a clean update object with only allowed fields
    const updateData: Partial<ISupplier> = {};
    const allowedFields: (keyof ISupplier)[] = [
      'companyName', 'contactPerson', 'email', 'phone', 
      'materialTypes', 'projectMaterials', 'address', 
      'supplyStartDate', 'avatar', 'totalPaid', 'dueAmount', 'lastPaymentDate'
    ];

    // Process projectMaterials if provided
    if (body.projectMaterials && Array.isArray(body.projectMaterials)) {
      // Validate project materials structure
      const isValidProjectMaterials = body.projectMaterials.every((pm: any) => 
        pm.projectId && 
        pm.materialType && 
        typeof pm.quantity === 'number' && 
        pm.quantity > 0 &&
        typeof pm.amount === 'number' &&
        pm.amount >= 0
      );
      
      if (!isValidProjectMaterials) {
        return NextResponse.json(
          { error: 'Invalid project materials format. Each item must have projectId, materialType, quantity > 0, and amount >= 0' },
          { status: 400 }
        );
      }
      
      // Add date to each project material if not provided
      updateData.projectMaterials = body.projectMaterials.map((pm: any) => ({
        ...pm,
        date: pm.date ? new Date(pm.date) : new Date()
      }));
    } else if (body.projectMaterials === null || body.projectMaterials === undefined) {
      // If projectMaterials is explicitly set to null/undefined, clear it
      updateData.projectMaterials = [];
    }

    // Process other fields
    allowedFields.forEach(field => {
      if (field !== 'projectMaterials' && body[field] !== undefined) {
        (updateData as any)[field] = body[field];
      }
    });

    
    const updatedSupplier = await Supplier.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedSupplier) {
      return NextResponse.json(
        { error: 'Supplier not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedSupplier);
  } catch (error) {
    console.error(`Error updating supplier:`, error);
    return NextResponse.json(
      { error: 'Failed to update supplier' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    await dbConnect();
    const { id } = await params;

    const deletedSupplier = await Supplier.findByIdAndDelete(id);

    if (!deletedSupplier) {
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Supplier deleted successfully" });
  } catch (error) {
    console.error(`Error deleting supplier:`, error);
    return NextResponse.json(
      { error: "Failed to delete supplier" },
      { status: 500 }
    );
  }
}
