import { NextRequest, NextResponse } from "next/server";
import connectToDB from "@/lib/db";
import MaterialRequest, { IMaterialRequest } from "@/models/MaterialRequestModel";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Response type
type MaterialRequestResponse = {
  _id: string;
  material: string;
  materialName: string;
  unit: string;
  quantity: number;
  status: string;
  requestDate: string;
  requiredDate: string;
  notes?: string;
  requestedBy: string;
  supervisor?: string;
  projectId?: string;
  createdAt: string;
  updatedAt: string;
};

// GET /api/material-requests
export async function GET(request: NextRequest) {
  try {
    await connectToDB();
    const url = new URL(request.url);
    const supervisorId = url.searchParams.get('supervisorId');

    const filter: any = {};
    if (supervisorId) {
      filter.supervisor = supervisorId;
    }

    const requests = await MaterialRequest.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    const response: MaterialRequestResponse[] = requests.map((r: any) => ({
      _id: r._id.toString(),
      material: r.material,
      materialName: r.materialName,
      unit: r.unit,
      quantity: r.quantity,
      status: r.status,
      requestDate: r.requestDate.toISOString(),
      requiredDate: r.requiredDate.toISOString(),
      notes: r.notes,
      requestedBy: r.requestedBy,
      supervisor: r.supervisor,
      projectId: r.projectId ? r.projectId.toString() : undefined,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching material requests:', error);
    return NextResponse.json(
      { message: 'Failed to fetch material requests' },
      { status: 500 }
    );
  }
}

// POST /api/material-requests
export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.material || !data.quantity || !data.unit || !data.requiredDate) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    await connectToDB();

    const materialRequest = new MaterialRequest({
      material: data.material,
      materialName: data.materialName,
      quantity: data.quantity,
      unit: data.unit,
      requiredDate: new Date(data.requiredDate),
      notes: data.notes || '',
      status: data.status || 'Pending',
      requestedBy: data.requestedBy || 'Anonymous',
      email: data.email || 'anonymous@example.com',
      requestDate: new Date(),
      ...(data.projectId ? { projectId: data.projectId } : {})
    });

    await materialRequest.save();

    const response: MaterialRequestResponse = {
      _id: materialRequest._id.toString(),
      material: materialRequest.material,
      materialName: materialRequest.materialName,
      unit: materialRequest.unit,
      quantity: materialRequest.quantity,
      status: materialRequest.status,
      requestDate: materialRequest.requestDate.toISOString(),
      requiredDate: materialRequest.requiredDate.toISOString(),
      notes: materialRequest.notes,
      requestedBy: materialRequest.requestedBy,
      projectId: (materialRequest as any).projectId ? (materialRequest as any).projectId.toString() : undefined,
      createdAt: materialRequest.createdAt.toISOString(),
      updatedAt: materialRequest.updatedAt.toISOString(),
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating material request:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/material-requests?id=<id>
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ message: 'Missing id' }, { status: 400 });
    }

    await connectToDB();
    const deleted = await MaterialRequest.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ message: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Deleted' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting material request:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
