import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IClient extends Document {
  name: string;
  username: string;
  email: string;
  phone: string;
  company?: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  taxId?: string;
  website?: string;
  status: 'Active' | 'Inactive';
  projectTotalAmount: number;
  totalPaid?: number;
  dueAmount?: number;
  lastPaymentDate?: Date;
  avatar?: string; // Optional avatar URL
  password: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const clientSchema = new Schema<IClient>(
  {
    name: { type: String, required: true },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: [4, 'Username must be at least 4 characters long']
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
    },
    password: {
      type: String,
      required: true,
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false // Don't include password in query results by default
    },
    phone: {
      type: String,
      required: true,
      match: [/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/, 'Please enter a valid phone number']
    },
    company: { type: String }, // optional
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    taxId: { type: String },
    website: {
      type: String,
      match: [/^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)$/, 'Please enter a valid URL']
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active'
    },
    projectTotalAmount: {
      type: Number,
      required: true,
      min: [0, 'Project amount cannot be negative']
    },
    totalPaid: {
      type: Number,
      default: 0,
      min: [0, 'Total paid cannot be negative']
    },
    dueAmount: {
      type: Number,
      default: 0,
      min: [0, 'Due amount cannot be negative']
    },
    lastPaymentDate: { type: Date },
    avatar: {
      type: String,
      match: [/^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)$/, 'Please enter a valid URL']
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) { 
        // Remove password when converting to JSON
        delete (ret as any).password;
        return ret;
      }
    }
  }
);

// Method to compare password for login
clientSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  // Plain string comparison (no hashing)
  return candidatePassword === this.password;
};

// Create the model or return existing one to prevent recompilation errors
const Client = mongoose.models.Client || mongoose.model<IClient>('Client', clientSchema);

export default Client;
