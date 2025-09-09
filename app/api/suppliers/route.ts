import { NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import Supplier from "@/models/SupplierModel"

export async function GET() {
  try {
    await dbConnect()
    const suppliers = await Supplier.find({}).sort({ createdAt: -1 })
    return NextResponse.json(suppliers)
  } catch (error) {
    console.error("Error fetching suppliers:", error)
    return NextResponse.json(
      { error: "Failed to fetch suppliers" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    console.log('Received request to create supplier');
    const body = await request.json();
    console.log('Request body:', JSON.stringify(body, null, 2));

    const {
      companyName,
      contactPerson,
      email,
      phone,
      materialTypes = [],
      projectMaterials = [],
      bankDetails = [],
      address,
      supplyStartDate,
      avatar,
    } = body;

    // Validate required fields
    const requiredFields = [
      { field: 'companyName', value: companyName },
      { field: 'contactPerson', value: contactPerson },
      { field: 'email', value: email },
      { field: 'phone', value: phone },
      { field: 'address', value: address }
    ];

    const missingFields = requiredFields.filter(field => !field.value).map(f => f.field);
    if (missingFields.length > 0) {
      console.error('Missing required fields:', missingFields);
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` }, 
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingSupplier = await Supplier.findOne({ email });
    
    if (existingSupplier) {
      return NextResponse.json(
        { error: "A supplier with this email already exists" },
        { status: 400 }
      );
    }

    // Validate project materials if provided
    const validatedProjectMaterials = [];
    if (projectMaterials && Array.isArray(projectMaterials)) {
      // Validate each project material entry
      for (const pm of projectMaterials) {
        if (!pm.projectId || !pm.materialType || typeof pm.quantity !== 'number' || pm.quantity <= 0) {
          return NextResponse.json(
            { error: 'Invalid project materials format. Each item must have projectId, materialType, and quantity > 0' },
            { status: 400 }
          );
        }
        validatedProjectMaterials.push({
          projectId: pm.projectId,
          materialType: pm.materialType,
          quantity: pm.quantity,
          amount: typeof pm.amount === 'number' ? pm.amount : 0,
          date: pm.date ? new Date(pm.date) : new Date()
        });
      }
    }

    console.log('Creating new supplier with data:', {
      companyName,
      contactPerson,
      email,
      phone,
      materialTypes,
      projectMaterials: validatedProjectMaterials,
      bankDetails,
      address,
      supplyStartDate,
      avatar
    });

    // Validate bank details if provided
    const validatedBankDetails = Array.isArray(bankDetails) 
      ? bankDetails.map(detail => ({
          accountNumber: detail.accountNumber?.toString().trim() || '',
          accountHolderName: detail.accountHolderName?.toString().trim() || '',
          bankName: detail.bankName?.toString().trim() || '',
          branch: detail.branch?.toString().trim() || '',
          ifscCode: detail.ifscCode?.toString().trim().toUpperCase() || '',
          upiId: detail.upiId?.toString().trim().toLowerCase() || '',
          accountType: ['Savings', 'Current', 'Other'].includes(detail.accountType) 
            ? detail.accountType 
            : 'Savings',
          isPrimary: !!detail.isPrimary
        }))
      : [];

    const newSupplier = new Supplier({
      companyName,
      contactPerson,
      email,
      phone,
      materialTypes: Array.isArray(materialTypes) ? materialTypes : [],
      projectMaterials: validatedProjectMaterials,
      bankDetails: validatedBankDetails,
      address,
      supplyStartDate,
      avatar,
      status: 'Active',
    });

    console.log('Attempting to save supplier...');
    const savedSupplier = await newSupplier.save();
    console.log('Supplier saved successfully:', savedSupplier._id);
    
    return NextResponse.json(savedSupplier, { status: 201 });
  } catch (error: any) {
    console.error("Error creating supplier:", {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code,
      keyPattern: error.keyPattern,
      keyValue: error.keyValue,
      errors: error.errors
    });
    
    return NextResponse.json(
      { 
        error: "Failed to create supplier",
        details: error.message,
        code: error.code,
        keyPattern: error.keyPattern
      },
      { status: 500 }
    );
  }
}

// Handle PUT and DELETE methods using dynamic route handlers
// Create a new file at: app/api/suppliers/[id]/route.ts
// The implementation is provided below
