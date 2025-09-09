import { NextResponse } from 'next/server';
import connectToDB from '@/lib/db';
import AdminProfile, { IAdminProfile } from '@/models/AdminProfile';

// GET: Get or Create Admin Profile
export async function GET() {
  try {
    console.log('GET /api/admin/profile - Starting request');

    await connectToDB();
    console.log('Connected to DB');

    // Find existing profile or create a new one with default values
    let adminProfile = await AdminProfile.findOne().select('-password -__v').lean();

    if (!adminProfile) {
      console.log('No admin profile found, creating default...');
      
      const newProfile = new AdminProfile({
        companyName: 'My Company',
        adminName: 'Admin',
        email: 'admin@example.com',
        password: 'admin123',
        username: 'admin',
        website: 'www.example.com',
        bio: 'Welcome to my profile!',
        profileImage: '',
        jobTitle: 'Administrator',
        showJobTitle: true,
        searchQuery: ''
      });

      await newProfile.save();
      console.log('Created new admin profile');

      const { password, ...profileWithoutPassword } = newProfile.toObject();
      return NextResponse.json(profileWithoutPassword);
    }

    console.log('Found existing admin profile');
    return NextResponse.json(adminProfile);
  } catch (error) {
    console.error('Error in GET /api/admin/profile:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch admin profile',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT: Update Admin Profile (no auth)
export async function PUT(request: Request) {
  try {
    await connectToDB();

    const body = await request.json();
    const {
      companyName,
      adminName,
      email,
      password,
      username,
      website,
      bio,
      profileImage,
      jobTitle,
      showJobTitle,
      searchQuery
    } = body;

    let adminProfile = await AdminProfile.findOne();

    if (!adminProfile) {
      // Create new profile with default values
      adminProfile = new AdminProfile({
        companyName: companyName || 'My Company',
        adminName: adminName || 'Admin',
        email: email || 'admin@example.com',
        password: password || 'admin123',
        username: username || '',
        website: website || '',
        bio: bio || '',
       
        showJobTitle: showJobTitle !== undefined ? showJobTitle : true,
        searchQuery: searchQuery || ''
      });
    } else {
      // Update existing profile with provided fields
      const updateFields: Partial<IAdminProfile> = {
        updatedAt: new Date()
      };

      // Update all fields from the request
      updateFields.companyName = companyName || adminProfile.companyName;
      updateFields.adminName = adminName || adminProfile.adminName;
      updateFields.email = email || adminProfile.email;
      updateFields.username = username || adminProfile.username;
      updateFields.website = website || adminProfile.website;
      updateFields.bio = bio || adminProfile.bio;
      updateFields.profileImage = profileImage || adminProfile.profileImage;
      updateFields.showJobTitle = showJobTitle !== undefined ? showJobTitle : adminProfile.showJobTitle;
      updateFields.searchQuery = searchQuery || adminProfile.searchQuery;
      
      // Only update password if a new one is provided
      if (password) {
        updateFields.password = password;
      }
      if (email !== undefined) updateFields.email = email;
      if (password) updateFields.password = await hash(password, 12);
      if (username !== undefined) updateFields.username = username;
      if (website !== undefined) updateFields.website = website;
      if (bio !== undefined) updateFields.bio = bio;
      if (profileImage !== undefined) updateFields.profileImage = profileImage;
      if (showJobTitle !== undefined) updateFields.showJobTitle = showJobTitle;
      if (searchQuery !== undefined) updateFields.searchQuery = searchQuery;

      adminProfile.set(updateFields);
    }

    await adminProfile.save();

    // Return the updated profile without the password
    const { password: _, ...profileWithoutPassword } = adminProfile.toObject();

    return NextResponse.json({
      message: 'Profile updated successfully',
      data: profileWithoutPassword,
    });
  } catch (error) {
    console.error('Error in PUT /api/admin/profile:', error);
    return NextResponse.json(
      { error: 'Failed to update admin profile' },
      { status: 500 }
    );
  }
}
