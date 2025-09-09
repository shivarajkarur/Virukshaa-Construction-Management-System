import mongoose, { Document, Schema } from 'mongoose';

export type UserRole = 'superadmin' | 'supervisor' | 'client';

export interface ILoginCredential extends Document {
  email?: string;
  username?: string;
  password: string; // stored as bcrypt or plaintext (legacy); select: false
  role: UserRole;
  profileId?: mongoose.Types.ObjectId; // references profile in role-specific collection
  name?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const LoginCredentialSchema = new Schema<ILoginCredential>({
  email: { type: String, trim: true, lowercase: true, index: true },
  username: { type: String, trim: true, lowercase: true, index: true },
  // Keep password not selected by default so route can use .select('+password')
  password: { type: String, required: true, select: false },
  role: { type: String, required: true, enum: ['superadmin', 'supervisor', 'client'] },
  profileId: { type: Schema.Types.ObjectId, index: true },
  name: { type: String, trim: true },
}, { timestamps: true });

// Optional compound index to speed up lookups
LoginCredentialSchema.index({ email: 1, username: 1 });

export default mongoose.models.LoginCredential || mongoose.model<ILoginCredential>('LoginCredential', LoginCredentialSchema);
