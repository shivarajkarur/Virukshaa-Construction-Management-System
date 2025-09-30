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
  projectAssignments?: {
    projectId: mongoose.Types.ObjectId;
    employeeId: mongoose.Types.ObjectId;
    projectTitle: string;
    role: string;
    assignedAt: Date;
  }[];
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
  employees: [{ type: Schema.Types.ObjectId, ref: 'Employee' }],
  projectAssignments: [{
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    projectTitle: { type: String },
    role: { type: String, default: 'Team Member' },
    assignedAt: { type: Date, default: Date.now }
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
