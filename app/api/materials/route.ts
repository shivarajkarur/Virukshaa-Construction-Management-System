import { NextRequest, NextResponse } from "next/server"
import { Types } from 'mongoose'
import connectToDB from "@/lib/db"
import { Material, IMaterial, MaterialDocument } from "@/models/MaterialModel"
import Task from "@/models/Task"

// Temporary type until auth is set up
type Session = {
  user: {
    id: string
    name?: string
    email?: string
  }
}

// Define a clean response type that matches our API response
type MaterialResponse = {
  _id: string;
  name: string;
  category: string;
  unit: string;
  currentStock: number;
  reorderLevel: number;
  pricePerUnit: number;
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
  // expose supervisor id for client-side ownership checks (optional on old data)
  supervisor?: string;
  lastUpdated: string;
  createdAt: string;
  updatedAt: string;
};

// GET /api/materials
export async function GET(request: NextRequest) {
  try {
    await connectToDB()
    
    // Supervisors should only see their own materials
    const url = new URL(request.url)
    const supervisorId = url.searchParams.get('supervisorId')

    const query: any = {}
    if (supervisorId) {
      if (!Types.ObjectId.isValid(String(supervisorId))) {
        // Invalid id -> no results
        return NextResponse.json([])
      }
      query.supervisor = new Types.ObjectId(String(supervisorId))
    }

    const materials = await Material.find(query).sort({ name: 1 }).lean().exec()
    
    if (!materials || !Array.isArray(materials)) {
      throw new Error('Invalid materials data received from database')
    }
    
    type MaterialDocLean = {
      _id: Types.ObjectId;
      name: string;
      category: string;
      unit: string;
      currentStock: number;
      reorderLevel: number;
      pricePerUnit: number;
      status: 'In Stock' | 'Low Stock' | 'Out of Stock' | 'On Order';
      description?: string;
      notes?: string;
      minOrderQuantity?: number;
      location?: string;
      barcode?: string;
      sku?: string;
      imageUrl?: string;
      tags?: string[];
      projectId?: Types.ObjectId;
      supervisor?: Types.ObjectId;
      lastUpdated: Date;
      createdAt: Date;
      updatedAt: Date;
    };
    
    const materialDocs: MaterialDocLean[] = materials.map((doc: any) => {
      const materialId = doc._id instanceof Types.ObjectId 
        ? doc._id 
        : new Types.ObjectId(String(doc._id));
      return {
        ...doc,
        _id: materialId,
        createdAt: new Date(doc.createdAt),
        updatedAt: new Date(doc.updatedAt),
        lastUpdated: new Date(doc.lastUpdated)
      } as MaterialDocLean
    });
    
    const response: MaterialResponse[] = materialDocs.map((material) => {
      const responseMaterial: MaterialResponse = {
        _id: material._id.toString(),
        name: material.name,
        category: material.category,
        unit: material.unit,
        currentStock: material.currentStock,
        reorderLevel: material.reorderLevel,
        pricePerUnit: material.pricePerUnit,
        status: material.status as 'In Stock' | 'Low Stock' | 'Out of Stock' | 'On Order',
        ...(material.projectId && { projectId: material.projectId.toString() }),
        ...(material.supervisor && { supervisor: material.supervisor.toString() }),
        lastUpdated: material.lastUpdated.toISOString(),
        createdAt: material.createdAt.toISOString(),
        updatedAt: material.updatedAt.toISOString(),
      };
      
      if (material.description) responseMaterial.description = material.description;
      if (material.notes) responseMaterial.notes = material.notes;
      if (material.minOrderQuantity) responseMaterial.minOrderQuantity = material.minOrderQuantity;
      if (material.location) responseMaterial.location = material.location;
      if (material.barcode) responseMaterial.barcode = material.barcode;
      if (material.sku) responseMaterial.sku = material.sku;
      if (material.imageUrl) responseMaterial.imageUrl = material.imageUrl;
      if (material.tags) responseMaterial.tags = material.tags;
      
      return responseMaterial;
    });
    
    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching materials:', error)
    return NextResponse.json(
      { message: 'Failed to fetch materials' },
      { status: 500 }
    )
  }
}

// POST /api/materials
export async function POST(request: Request) {
  try {
    const data = await request.json()
    
    // Validate required fields (form was reduced: accept minimal fields)
    if (!data.name) {
      return NextResponse.json(
        { message: 'Missing required fields: name' },
        { status: 400 }
      )
    }
    
    await connectToDB()
    
    // Set default values for optional fields
    const materialData: any = {
      name: data.name,
      // Provide sensible defaults when omitted by the client
      category: data.category || 'Tools',
      unit: data.unit || '',
      currentStock: data.currentStock || 0,
      reorderLevel: data.reorderLevel || 0,
      pricePerUnit: data.pricePerUnit || 0,
      supplier: data.supplier || '',
      status: data.status || 'In Stock',
      lastUpdated: new Date(),
      ...(data.projectId && Types.ObjectId.isValid(String(data.projectId)) && { projectId: new Types.ObjectId(String(data.projectId)) }),
      ...(data.description && { description: data.description }),
      ...(data.notes && { notes: data.notes }),
      ...(data.minOrderQuantity && { minOrderQuantity: data.minOrderQuantity }),
      ...(data.location && { location: data.location }),
      ...(data.barcode && { barcode: data.barcode }),
      ...(data.sku && { sku: data.sku }),
      ...(data.imageUrl && { imageUrl: data.imageUrl }),
      ...(data.tags && { tags: data.tags })
    }

    // Associate with supervisor if provided
    if (data.supervisor && Types.ObjectId.isValid(String(data.supervisor))) {
      materialData.supervisor = new Types.ObjectId(String(data.supervisor))
    }
    
    const material = new Material(materialData) as unknown as MaterialDocument;
    await material.save();
    
    const response: MaterialResponse = {
      _id: material._id.toString(),
      name: material.name,
      category: material.category,
      unit: material.unit,
      currentStock: material.currentStock,
      reorderLevel: material.reorderLevel,
      pricePerUnit: material.pricePerUnit,
      status: material.status as 'In Stock' | 'Low Stock' | 'Out of Stock' | 'On Order',
      ...(material.projectId && { projectId: material.projectId.toString() }),
      ...(material.supervisor && { supervisor: (material.supervisor as any).toString?.() || String(material.supervisor) }),
      lastUpdated: material.lastUpdated.toISOString(),
      createdAt: material.createdAt.toISOString(),
      updatedAt: material.updatedAt.toISOString(),
      ...(material.description && { description: material.description }),
      ...(material.notes && { notes: material.notes }),
      ...(material.minOrderQuantity && { minOrderQuantity: material.minOrderQuantity }),
      ...(material.location && { location: material.location }),
      ...(material.barcode && { barcode: material.barcode }),
      ...(material.sku && { sku: material.sku }),
      ...(material.imageUrl && { imageUrl: material.imageUrl }),
      ...(material.tags && material.tags.length > 0 && { tags: material.tags })
    }
    
    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('Error creating material:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to create material'
    return NextResponse.json(
      { message: errorMessage },
      { status: 500 }
    )
  }
}

// Note: updating by id is handled in /api/materials/[id]/route.ts
