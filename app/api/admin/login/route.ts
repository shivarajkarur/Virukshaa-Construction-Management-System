import { NextResponse } from 'next/server';
import connectToDB from '@/lib/db';
import AdminProfile from '@/models/AdminProfile';

export async function POST(request: Request) {
  try {
    const { email, username, password } = await request.json();
    const identifier: string | undefined = username?.trim() || email?.trim();

    if (!identifier || !password) {
      return NextResponse.json(
        { error: 'Email or username and password are required' },
        { status: 400 }
      );
    }

    await connectToDB();

    const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`^${escapeRegExp(identifier)}$`, 'i');

    // Find admin by email or username based on provided identifier
    const admin = await AdminProfile.findOne({
      $or: [
        { email: regex },
        { username: regex }
      ]
    }).select('+password');

    if (!admin) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Compare passwords as plain text
    const isPasswordValid = admin.password === password;

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Return success response without sensitive data
    const { password: _, ...adminData } = admin.toObject();
    
    return NextResponse.json({
      success: true,
      user: adminData
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
