import { NextResponse } from 'next/server';
import connectToDB from '@/lib/db';
import AdminProfile from '@/models/AdminProfile';

export async function POST(request: Request) {
  try {
    await connectToDB();

    const { currentPassword, newPassword } = await request.json();

    // Find the admin profile
    const adminProfile = await AdminProfile.findOne();
    if (!adminProfile) {
      return NextResponse.json(
        { message: 'Admin profile not found' },
        { status: 404 }
      );
    }

    // Verify current password
    const isPasswordValid = currentPassword === adminProfile.password;
    if (!isPasswordValid) {
      return NextResponse.json(
        { message: 'Current password is incorrect' },
        { status: 400 }
      );
    }

    // Store new password as plain text
    const plainPassword = newPassword;

    // Add current password to history before updating
    const passwordHistory = adminProfile.passwordHistory || [];
    passwordHistory.unshift({
      password: adminProfile.password,
      changedAt: new Date(),
      changedByIp: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    });

    // Keep only last 5 passwords
    const updatedPasswordHistory = passwordHistory.slice(0, 5);

    // Update the password and history
    adminProfile.password = plainPassword;
    adminProfile.passwordHistory = updatedPasswordHistory;
    adminProfile.updatedAt = new Date();
    
    await adminProfile.save();

    // Return success response with password history (without actual passwords)
    const sanitizedPasswordHistory = updatedPasswordHistory.map((record: any) => ({
      changedAt: record.changedAt,
      changedByIp: record.changedByIp,
      userAgent: record.userAgent
    }));

    return NextResponse.json({
      message: 'Password updated successfully',
      passwordHistory: sanitizedPasswordHistory
    });

  } catch (error) {
    console.error('Error changing password:', error);
    return NextResponse.json(
      { message: 'Failed to change password' },
      { status: 500 }
    );
  }
}
