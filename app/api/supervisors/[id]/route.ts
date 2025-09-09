import { NextResponse, NextRequest } from "next/server";
import connectToDB from "@/lib/db";
import Supervisor from "@/models/Supervisor";

// GET single supervisor
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectToDB();
    const supervisor = await Supervisor.findById(id);
    
    if (!supervisor) {
      return NextResponse.json(
        { message: 'Supervisor not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(supervisor);
  } catch (error) {
    console.error('Error fetching supervisor:', error);
    return NextResponse.json(
      { message: 'Failed to fetch supervisor' },
      { status: 500 }
    );
  }
}

import { ISupervisor } from '@/models/Supervisor';
import { Types } from 'mongoose';

// ... (keep existing GET and DELETE functions)

// UPDATE supervisor
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Invalid supervisor ID' }, { status: 400 });
    }

    const body = await request.json();
    await connectToDB();

    // Convert date strings to Date objects
    if (body.lastPaymentDate && typeof body.lastPaymentDate === 'string') {
      body.lastPaymentDate = new Date(body.lastPaymentDate);
    }

    // Check if username is being updated and if it's already taken
    if (body.username) {
      const existingUser = await Supervisor.findOne({ username: body.username, _id: { $ne: id } });
      if (existingUser) {
        return NextResponse.json(
          { message: 'Username is already taken' },
          { status: 400 }
        );
      }
    }

    // Get current supervisor data for avatar handling
    const currentSupervisor = await Supervisor.findById(id);
    if (!currentSupervisor) {
      return NextResponse.json(
        { message: 'Supervisor not found' },
        { status: 404 }
      );
    }

    // Handle avatar deletion if requested
    if (body.deleteAvatar && currentSupervisor.avatar) {
      try {
        const deleteResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/upload/delete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileUrl: currentSupervisor.avatar })
        });
        
        if (!deleteResponse.ok) {
          console.error('Failed to delete old avatar:', await deleteResponse.text());
        }
      } catch (error) {
        console.error('Error deleting old avatar:', error);
      }
    }

    // Create a clean update object with only allowed fields
    const updateData: Partial<ISupervisor> = {};
    const allowedFields: (keyof ISupervisor)[] = [
      'name', 'email', 'username', 'phone', 'salary', 'address', 'status', 'avatar',
      'totalPaid', 'dueAmount', 'lastPaymentDate'
    ];

    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        (updateData as any)[field] = body[field];
      }
    });

    // Clear avatar if deletion was requested
    if (body.deleteAvatar) {
      updateData.avatar = undefined;
    }

    // Handle password update (store as plain string, no hashing)
    if (body.password) {
      updateData.password = body.password;
    }
    
    const updatedSupervisor = await Supervisor.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!updatedSupervisor) {
      return NextResponse.json(
        { message: 'Supervisor not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(updatedSupervisor);
  } catch (error) {
    console.error('Error updating supervisor:', error);
    return NextResponse.json(
      { message: 'Failed to update supervisor' },
      { status: 500 }
    );
  }
}

// DELETE supervisor
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectToDB();
    const deletedSupervisor = await Supervisor.findByIdAndDelete(id);
    
    if (!deletedSupervisor) {
      return NextResponse.json(
        { message: 'Supervisor not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { message: 'Supervisor deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting supervisor:', error);
    return NextResponse.json(
      { message: 'Failed to delete supervisor' },
      { status: 500 }
    );
  }
}
