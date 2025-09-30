import mongoose, { Document, Schema } from 'mongoose';

export interface IEmployee extends Document {
  name: string;
  email: string;
  phone: string;
  role: string;
  salary: number;
  workType: 'Daily' | 'Monthly' | 'Contract';
  status: 'Active' | 'On Leave' | 'Inactive';
  joinDate: Date;
  endDate?: Date;
  address: string;
  avatar?: string;
  department?: string;
  totalPaid?: number;
  dueAmount?: number;
  lastPaymentDate?: Date;
  projectId?: mongoose.Types.ObjectId;
  supervisor?: mongoose.Types.ObjectId;
  assignedProjects?: Array<{
    projectId: mongoose.Types.ObjectId;
    supervisorId: mongoose.Types.ObjectId;
    role?: string;
    assignedAt?: Date;
  }>;
}

const employeeSchema = new Schema<IEmployee>({
  name: { type: String, required: true },
  email: { type: String, required: false },
  phone: { type: String, required: true },
  role: { 
    type: String, 
    required: true,
    enum: [
      'Mason', 'Carpenter', 'Electrician', 'Plumber', 
      'Heavy Equipment Operator', 'Safety Inspector', 'Laborer', 
      'Welder', 'Painter', 'Roofer', 'HVAC Technician', 'Concrete Worker', 'Employee'
    ]
  },
  salary: { type: Number, required: true },
  workType: {
    type: String,
    required: true,
    enum: ['Daily', 'Monthly', 'Contract'],
  },
  status: { 
    type: String,   
    enum: ['Active', 'On Leave', 'Inactive'],
    default: 'Active'
  },
  joinDate: { type: Date, required: true },
  endDate: { type: Date },
  address: { type: String, default: '' },
  avatar: { type: String, required: false },
  department: { type: String, required: false },
  totalPaid: { type: Number, default: 0 },
  dueAmount: { type: Number, default: 0 },
  lastPaymentDate: { type: Date },
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: false },
  supervisor: { 
    type: Schema.Types.ObjectId, 
    ref: 'Supervisor',
    default: null
  },
  assignedProjects: [
    {
      projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
      supervisorId: { type: Schema.Types.ObjectId, ref: 'Supervisor', required: true },
      role: { type: String },
      assignedAt: { type: Date, default: Date.now },
    }
  ]
}, { timestamps: true });

// Create or retrieve the model to prevent OverwriteModelError.
// Export as a non-null model type so downstream imports are correctly typed.
const Employee = (mongoose.models.Employee as mongoose.Model<IEmployee>)
  || mongoose.model<IEmployee>('Employee', employeeSchema);

// Preserve legacy index cleanup (safe no-op if index doesn't exist)
try {
  Employee.collection.dropIndex('username_1').catch((err: any) => {
    if (err && err.codeName !== 'NamespaceNotFound' && err.codeName !== 'IndexNotFound') {
      console.log('Error dropping username index:', err);
    }
    // Silently ignore IndexNotFound errors as the index doesn't exist
  });
} catch (e) {
  console.log('Error checking for existing model:', e);
}

export default Employee;
