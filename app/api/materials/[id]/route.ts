import { NextResponse } from "next/server"
import { Types } from 'mongoose'
import connectToDB from "@/lib/db"
import { Material, IMaterial, MaterialDocument } from "@/models/MaterialModel"

// Define the response type
type MaterialResponse = {
  _id: string;
  name: string;
  category: string;
  unit: string;
  currentStock: number;
  reorderLevel: number;
  pricePerUnit: number;
  supplier: string;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock' | 'On Order';
  description?: string;
  notes?: string;
  minOrderQuantity?: number;
  location?: string;
  barcode?: string;
  sku?: string;
  imageUrl?: string;
  tags?: string[];
  projectId?: string;
  // add supervisor id for ownership
  supervisor?: string;
  lastUpdated: string;
  createdAt: string;
  updatedAt: string;
};

// Handle PUT /api/materials/[id]
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const data = await request.json()
    
    if (!id) {
      return NextResponse.json(
        { message: 'Material ID is required' },
        { status: 400 }
      )
    }
    
    await connectToDB()
    
    const updatedData: any = {
      ...data,
      lastUpdated: new Date()
    }
    if (data.projectId === null || data.projectId === '') {
      updatedData.projectId = undefined
    } else if (data.projectId && Types.ObjectId.isValid(String(data.projectId))) {
      updatedData.projectId = new Types.ObjectId(String(data.projectId))
    }
    // Map supervisor to ObjectId if provided
    if (data.supervisor === null || data.supervisor === '') {
      updatedData.supervisor = undefined
    } else if (data.supervisor && Types.ObjectId.isValid(String(data.supervisor))) {
      updatedData.supervisor = new Types.ObjectId(String(data.supervisor))
    }
    
    const material = (await Material.findByIdAndUpdate(id, updatedData, { new: true })) as MaterialDocument | null
    
    if (!material) {
      return NextResponse.json(
        { message: 'Material not found' },
        { status: 404 }
      )
    }
    
    const mAny = material as any
    const response: MaterialResponse = {
      _id: material._id.toString(),
      name: material.name,
      category: material.category,
      unit: material.unit,
      currentStock: material.currentStock,
      reorderLevel: material.reorderLevel,
      pricePerUnit: material.pricePerUnit,
      supplier: mAny.supplier,
      status: material.status as 'In Stock' | 'Low Stock' | 'Out of Stock' | 'On Order',
      ...(material.projectId && { projectId: material.projectId.toString() }),
      ...(mAny.supervisor && { supervisor: String(mAny.supervisor) }),
      lastUpdated: material.lastUpdated.toISOString(),
      createdAt: material.createdAt.toISOString(),
      updatedAt: material.updatedAt.toISOString(),
      ...(material.description && { description: material.description }),
      ...(material.notes && { notes: material.notes }),
      ...(material.minOrderQuantity !== undefined && { minOrderQuantity: material.minOrderQuantity }),
      ...(material.location && { location: material.location }),
      ...(material.barcode && { barcode: material.barcode }),
      ...(material.sku && { sku: material.sku }),
      ...(material.imageUrl && { imageUrl: material.imageUrl }),
      ...(material.tags && material.tags.length > 0 && { tags: material.tags })
    }
    
    return NextResponse.json(response)
  } catch (error) {
    console.error('Error updating material:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to update material'
    return NextResponse.json(
      { message: errorMessage },
      { status: 500 }
    )
  }
}

// Handle DELETE /api/materials/[id]
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    if (!id) {
      return NextResponse.json(
        { message: 'Material ID is required' },
        { status: 400 }
      )
    }
    
    await connectToDB()
    
    const material = await Material.findByIdAndDelete(id)
    
    if (!material) {
      return NextResponse.json(
        { message: 'Material not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ message: 'Material deleted successfully' })
  } catch (error) {
    console.error('Error deleting material:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete material'
    return NextResponse.json(
      { message: errorMessage },
      { status: 500 }
    )
  }
}