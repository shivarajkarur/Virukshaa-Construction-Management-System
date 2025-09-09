import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Client from "@/models/ClientModel";
import connectToDB from "@/lib/db";
import { Types } from "mongoose";

// Define a clean client response type
type ClientResponse = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  taxId?: string;
  website?: string;
  projectTotalAmount?: number;
  status?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
};

export async function GET(
  request: Request,
  ctx: { params: Promise<{ email: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { email } = await ctx.params;
    
    if (!email) {
      return NextResponse.json(
        { message: 'Email is required' },
        { status: 400 }
      );
    }

    await connectToDB();
    
    const client = await Client.findOne({ email })
      .select('-__v -password')
      .lean()
      .exec();
    
    if (!client) {
      return NextResponse.json(
        { message: 'Client not found' },
        { status: 404 }
      );
    }

    // Convert MongoDB document to plain object
    const clientObj = client as any;
    
    // Create response object with only the fields we want to expose
    const responseData: ClientResponse = {
      _id: clientObj._id.toString(),
      name: clientObj.name || '',
      email: clientObj.email || '',
      phone: clientObj.phone,
      company: clientObj.company,
      address: clientObj.address,
      city: clientObj.city,
      state: clientObj.state,
      postalCode: clientObj.postalCode,
      taxId: clientObj.taxId,
      website: clientObj.website,
      projectTotalAmount: clientObj.projectTotalAmount,
      status: clientObj.status,
      avatar: clientObj.avatar,
      createdAt: clientObj.createdAt ? new Date(clientObj.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: clientObj.updatedAt ? new Date(clientObj.updatedAt).toISOString() : new Date().toISOString()
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error fetching client by email:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
