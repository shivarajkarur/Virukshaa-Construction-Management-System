import { Schema, model, models, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'supervisor' | 'client' | 'supplier' | string;
  department?: string;
  phone?: string;
  joinDate?: string;
  status: 'Active' | 'Inactive' | 'Suspended';
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { 
      type: String, 
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
    },
    name: { 
      type: String, 
      required: [true, 'Name is required'],
      trim: true
    },
    password: { 
      type: String, 
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long']
    },
    role: { 
      type: String, 
      required: [true, 'Role is required'],
      enum: {
        values: ['admin', 'supervisor', 'client', 'supplier'],
        message: '{VALUE} is not a valid role'
      },
      default: 'client'
    },
    department: { 
      type: String, 
      trim: true,
      default: 'General'
    },
    phone: { 
      type: String, 
      trim: true,
      match: [/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/, 'Please enter a valid phone number']
    },
    joinDate: { 
      type: String,
      default: () => new Date().toISOString().split('T')[0]
    },
    status: { 
      type: String, 
      enum: ['Active', 'Inactive', 'Suspended'],
      default: 'Active'
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: function(doc, ret: Record<string, any>) {
        // Create a new object without the password and __v fields
        const { password, __v, ...userWithoutSensitiveData } = ret;
        return userWithoutSensitiveData;
      }
    }
  }
);

// Check if model exists before compiling it
const User = models.User || model<IUser>('User', UserSchema);

export default User;