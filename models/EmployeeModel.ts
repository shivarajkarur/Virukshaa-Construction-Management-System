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
  supervisor?: mongoose.Types.ObjectId;
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
  supervisor: { 
    type: Schema.Types.ObjectId, 
    ref: 'Supervisor',
    default: null
  }
}, { timestamps: true });

// Create the model or retrieve it if it already exists to prevent OverwriteModelError
let Employee: mongoose.Model<IEmployee> | null = null;

try {
  // Try to get the existing model
  Employee = mongoose.models.Employee as mongoose.Model<IEmployee>;
  
  // If model exists, check and drop the problematic index
  if (Employee) {
    Employee.collection.dropIndex('username_1').catch((err: any) => {
      if (err && err.codeName !== 'NamespaceNotFound') {
        console.log('Error dropping username index:', err);
      } else {
        console.log('Dropped username index successfully');
      }
    });
  }
} catch (e) {
  console.log('Error checking for existing model:', e);
}

// Create the model if it doesn't exist
if (!Employee) {
  Employee = mongoose.model<IEmployee>('Employee', employeeSchema);
}

export default Employee;
