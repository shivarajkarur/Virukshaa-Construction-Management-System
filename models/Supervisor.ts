import mongoose, { Document, Schema } from 'mongoose';

export interface ISupervisor extends Document {
  name: string;
  email: string;
  username: string;
  password: string;
  phone: string;
  salary: number;
  address: string;
  status: 'Active' | 'Inactive';
  totalPaid?: number;
  dueAmount?: number;
  lastPaymentDate?: Date;
  avatar?: string;
  employees: mongoose.Types.ObjectId[];
}

const supervisorSchema = new Schema<ISupervisor>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
  phone: { type: String, required: true },
  salary: { type: Number, default: 0 },
  address: { type: String, default: '' },
  status: { 
    type: String, 
    enum: ['Active', 'Inactive'],
    default: 'Active' 
  },
  totalPaid: { type: Number, default: 0 },
  dueAmount: { type: Number, default: 0 },
  lastPaymentDate: { type: Date },
  avatar: { type: String },
  employees: [{ 
    type: Schema.Types.ObjectId, 
    ref: 'Employee',
    default: []
  }]
}, { timestamps: true });

// Create text index for search
supervisorSchema.index({
  name: 'text',
  email: 'text',
  username: 'text'
});

// Method to compare password
supervisorSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  // Plain string comparison (no hashing)
  return candidatePassword === this.password;
};

export default mongoose.models.Supervisor || mongoose.model<ISupervisor>('Supervisor', supervisorSchema);
