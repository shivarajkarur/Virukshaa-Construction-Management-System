import { NextResponse } from "next/server";
import { Types } from "mongoose";
import connectToDB from "@/lib/db";
import Client, { IClient } from "@/models/ClientModel";

// Fixed type usage for lean object
type ClientResponse = Omit<IClient, '_id' | 'createdAt' | 'updatedAt'> & {
  _id: string;
  createdAt: string;
  updatedAt: string;
};

function toClientResponse(client: any): ClientResponse {
  return {
    ...client,
    _id: client._id?.toString?.() || '',
    createdAt: client.createdAt?.toISOString?.() || '',
    updatedAt: client.updatedAt?.toISOString?.() || ''
  };
}

export async function GET(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Invalid client ID' }, { status: 400 });
    }

    await connectToDB();
    // Explicitly include the password field
    const client = await Client.findById(id).select('+password').lean().exec();

    if (!client) {
      return NextResponse.json({ message: 'Client not found' }, { status: 404 });
    }

    return NextResponse.json(toClientResponse(client));
  } catch (error) {
    console.error('Error fetching client:', error);
    return NextResponse.json({ message: 'Failed to fetch client' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;

  try {
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Invalid client ID' }, { status: 400 });
    }

    const body = await request.json();

    // Check if client exists
    await connectToDB();
    const existingClient = await Client.findById(id);
    if (!existingClient) {
      return NextResponse.json({ message: 'Client not found' }, { status: 404 });
    }

    // Check if username is being updated and if it's already taken
    if (body.username && body.username !== existingClient.username) {
      const usernameExists = await Client.findOne({ username: body.username });
      if (usernameExists) {
        return NextResponse.json(
          { message: 'Username already exists' },
          { status: 400 }
        );
      }
    } else if (!body.username) {
      // If username is not provided, keep the existing one
      body.username = existingClient.username;
    }

    // Handle password update if provided
    if (body.password) {
      if (body.password.length < 6) {
        return NextResponse.json(
          { message: 'Password must be at least 6 characters long' },
          { status: 400 }
        );
      }
      // Store password as plain text
      body.password = body.password;
    } else if (body.password === '') {
      // If password is explicitly set to empty string, use a default one
      body.password = 'password123';
    } else {
      // Remove password from body if not being updated
      delete body.password;
    }

    // Convert date strings to Date objects
    if (body.lastPaymentDate && typeof body.lastPaymentDate === 'string') {
      body.lastPaymentDate = new Date(body.lastPaymentDate);
    }

    // Create a clean update object with only allowed fields
    const updateData: Partial<IClient> = {};
    const allowedFields: (keyof IClient)[] = [
      'name', 'username', 'email', 'phone', 'company', 'address', 'city', 'state',
      'postalCode', 'taxId', 'website', 'status', 'projectTotalAmount',
      'totalPaid', 'dueAmount', 'lastPaymentDate', 'avatar', 'password'
    ];

    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        (updateData as any)[field] = body[field];
      }
    });

    // If projectTotalAmount is updated, update dueAmount accordingly
    if (body.projectTotalAmount !== undefined) {
      updateData.dueAmount = Number(body.projectTotalAmount) - (existingClient.totalPaid || 0);
    }

    await connectToDB();
    const updatedClient = await Client.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).lean();

    if (!updatedClient) {
      return NextResponse.json({ message: 'Client not found' }, { status: 404 });
    }

    return NextResponse.json(toClientResponse(updatedClient));
  } catch (error) {
    console.error(`Error updating client ${id}:`, error);
    return NextResponse.json({ message: 'Failed to update client' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Invalid client ID' }, { status: 400 });
    }

    await connectToDB();
    const deletedClient = await Client.findByIdAndDelete(id).lean().exec();

    if (!deletedClient) {
      return NextResponse.json({ message: 'Client not found' }, { status: 404 });
    }

    return NextResponse.json({
      ...toClientResponse(deletedClient),
      message: 'Client deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting client:', error);
    return NextResponse.json({ message: 'Failed to delete client' }, { status: 500 });
  }
}
