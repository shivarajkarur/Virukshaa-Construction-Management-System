import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User, { IUser } from '@/lib/modals/user';
import { Types } from 'mongoose';

// Helper function for error responses
const errorResponse = (message: string, status: number, details?: any) => {
  return new NextResponse(
    JSON.stringify({
      success: false,
      error: message,
      ...(details && { details }),
    }),
    {
      status,
      headers: { 'Content-Type': 'application/json' },
    }
  );
};

// GET all users
export async function GET() {
  try {
    await connectDB();
    const users = await User.find({}).sort({ createdAt: -1 });
    
    return new NextResponse(
      JSON.stringify({
        success: true,
        count: users.length,
        data: users,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error fetching users:', error);
    return errorResponse('Failed to fetch users', 500);
  }
}

// CREATE a new user
export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      return errorResponse('Content-Type must be application/json', 400);
    }

    const body = await request.json();
    
    // Validate required fields
    const { name, email, password, role } = body;
    if (!name || !email || !password || !role) {
      return errorResponse('Missing required fields', 400, {
        required: ['name', 'email', 'password', 'role'],
        received: Object.keys(body),
      });
    }

    await connectDB();

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { name }],
    });

    if (existingUser) {
      return errorResponse('User with this email or name already exists', 409);
    }

    // Create new user
    const user = await User.create({
      ...body,
      joinDate: new Date().toISOString().split('T')[0],
      status: 'Active',
    });

    return new NextResponse(
      JSON.stringify({
        success: true,
        data: user,
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error creating user:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => ({
        field: err.path,
        message: err.message,
      }));
      return errorResponse('Validation failed', 400, { errors });
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      return errorResponse('User with this email or name already exists', 409);
    }
    
    return errorResponse('Failed to create user', 500);
  }
}

// UPDATE a user
export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id || !Types.ObjectId.isValid(id)) {
      return errorResponse('Valid user ID is required', 400);
    }

    const contentType = request.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      return errorResponse('Content-Type must be application/json', 400);
    }

    const updates = await request.json();
    
    // Prevent modifying certain fields
    const { password, email, ...safeUpdates } = updates;
    
    await connectDB();
    
    const user = await User.findByIdAndUpdate(
      id,
      { $set: safeUpdates },
      { new: true, runValidators: true }
    );

    if (!user) {
      return errorResponse('User not found', 404);
    }

    return new NextResponse(
      JSON.stringify({
        success: true,
        data: user,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error updating user:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => ({
        field: err.path,
        message: err.message,
      }));
      return errorResponse('Validation failed', 400, { errors });
    }
    
    return errorResponse('Failed to update user', 500);
  }
}

// DELETE a user
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id || !Types.ObjectId.isValid(id)) {
      return errorResponse('Valid user ID is required', 400);
    }

    await connectDB();
    
    // In a real app, you might want to soft delete instead
    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return errorResponse('User not found', 404);
    }

    return new NextResponse(
      JSON.stringify({
        success: true,
        data: { id },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error deleting user:', error);
    return errorResponse('Failed to delete user', 500);
  }
}
