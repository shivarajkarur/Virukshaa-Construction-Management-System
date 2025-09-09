import { NextResponse } from "next/server";
import { Types } from "mongoose";
import connectToDB from "@/lib/db";
import Client, { IClient } from "@/models/ClientModel";

interface ClientForMessaging {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
}

// Define consistent response structure
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

// GET all clients
export async function GET() {
  try {
    await connectToDB();
    // Get all client fields
    const clients = await Client.find({})
      .select('+password') // explicitly include password
      .sort({ name: 1 })
      .lean();

    // Transform MongoDB documents to include all fields
    const result = clients.map((client: any) => ({
      _id: client._id.toString(),
      name: client.name,
      username: client.username, // Include username in the response
      email: client.email,
      password: client.password || '',
      phone: client.phone || '',
      company: client.company || '',
      address: client.address || '',
      city: client.city || '',
      state: client.state || '',
      postalCode: client.postalCode || '',
      taxId: client.taxId || '',
      website: client.website || '',
      status: client.status || 'Active',
      projectTotalAmount: client.projectTotalAmount || 0,
      totalPaid: client.totalPaid || 0,
      dueAmount: client.dueAmount || 0,
      lastPaymentDate: client.lastPaymentDate?.toISOString() || null,
      avatar: client.avatar || '',
      createdAt: client.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: client.updatedAt?.toISOString() || new Date().toISOString()
    }));
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json(
      { message: 'Failed to fetch clients' },
      { status: 500 }
    );
  }
}

// POST create new client
export async function POST(request: Request) {
  try {
    const data = await request.json();

    const {
      name,
      username,
      email,
      phone,
      password,
      company,
      address,
      city,
      state,
      postalCode,
      taxId,
      website,
      projectTotalAmount,
      status,
      avatar
    } = data;

    // Validate required fields (basic server-side checks)
    if (!username) {
      return NextResponse.json(
        { message: 'Username is required' },
        { status: 400 }
      );
    }
    if (!name) {
      return NextResponse.json(
        { message: 'Name is required' },
        { status: 400 }
      );
    }
    if (!email) {
      return NextResponse.json(
        { message: 'Email is required' },
        { status: 400 }
      );
    }
    if (!phone) {
      return NextResponse.json(
        { message: 'Phone number is required' },
        { status: 400 }
      );
    }
    if (!address || !city || !state || !postalCode) {
      return NextResponse.json(
        { message: 'Address, city, state and postal code are required' },
        { status: 400 }
      );
    }

    // If password is not provided, use a default one (stored as plain string)
    let finalPassword = '';
    if (password) {
      if (password.length < 6) {
        return NextResponse.json(
          { message: 'Password must be at least 6 characters long' },
          { status: 400 }
        );
      }
      finalPassword = password;
    } else {
      // Set a default password if not provided
      finalPassword = 'password123';
    }

    await connectToDB();

    // Check if username, email, or phone already exists (use exists for clarity and TS safety)
    const [usernameExists, emailExists, phoneExists] = await Promise.all([
      Client.exists({ username }),
      Client.exists({ email }),
      Client.exists({ phone })
    ]);

    if (usernameExists) {
      return NextResponse.json({ message: 'Username already exists' }, { status: 409 });
    }
    if (emailExists) {
      return NextResponse.json({ message: 'Email already exists' }, { status: 409 });
    }
    if (phoneExists) {
      return NextResponse.json({ message: 'Phone already exists' }, { status: 409 });
    }

    const client = new Client({
      name,
      username,
      email,
      phone,
      password: finalPassword,
      company: company || '',
      address,
      city,
      state,
      postalCode,
      taxId: taxId || '',
      website: website || '',
      projectTotalAmount: Number(projectTotalAmount) || 0,
      status: status || 'Active',
      avatar: avatar || '',
      totalPaid: 0,
      dueAmount: Number(projectTotalAmount) || 0,
      lastPaymentDate: null
    });

    try {
      await client.save();
    } catch (err: any) {
      // Handle duplicate key errors (in case unique indexes exist)
      if (err?.code === 11000) {
        const key = Object.keys(err.keyPattern || {})[0] || 'field';
        return NextResponse.json(
          { message: `${key.charAt(0).toUpperCase() + key.slice(1)} already exists` },
          { status: 409 }
        );
      }
      throw err;
    }

    return NextResponse.json(toClientResponse(client.toObject()), { status: 201 });
  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json(
      { message: 'Failed to create client' },
      { status: 500 }
    );
  }
}
