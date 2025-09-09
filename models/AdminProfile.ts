import mongoose, { Schema, Document } from 'mongoose';
import connectToDB from '@/lib/db';

// Define the interface for the AdminProfile document
export interface IAdminProfile extends Document {
  companyName: string;
  adminName: string;
  email: string;
  username?: string;
  password: string;
  website?: string;
  bio?: string;
  profileImage?: string;
  showJobTitle?: boolean;
  searchQuery?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Define the schema
const AdminProfileSchema = new Schema<IAdminProfile>({
  companyName: { type: String, required: true },
  adminName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  username: { type: String },
  password: { type: String, required: true },
  website: { type: String },
  bio: { type: String },
  profileImage: { type: String },
  showJobTitle: { type: Boolean, default: true },
  searchQuery: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Create a pre-save hook to update the updatedAt field
AdminProfileSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Create the model or return the existing one
const AdminProfile = mongoose.models.AdminProfile || 
  mongoose.model<IAdminProfile>('AdminProfile', AdminProfileSchema, 'adminprofile');

export default AdminProfile;
