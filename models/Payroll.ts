import mongoose, { Document, Schema } from 'mongoose';

export interface IPayroll extends Document {
  userId: mongoose.Types.ObjectId;
  userType: 'employee' | 'client' | 'supplier' | 'supervisor';
  salary: number;
  totalPaid: number;
  dueAmount: number;
  lastPaymentDate: Date;
  paymentHistory: Array<{
    amount: number;
    date: Date;
    paymentMethod: string;
    reference: string;
    status: 'pending' | 'completed' | 'failed';
  }>;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema({
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  paymentMethod: { type: String, required: true },
  reference: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  }
});

const payrollSchema = new Schema<IPayroll>(
  {
    userId: { 
      type: Schema.Types.ObjectId, 
      ref: 'User',
      required: true 
    },
    userType: {
      type: String,
      enum: ['employee', 'client', 'supplier', 'supervisor'],
      required: true
    },
    salary: { type: Number, default: 0 },
    totalPaid: { type: Number, default: 0 },
    dueAmount: { type: Number, default: 0 },
    lastPaymentDate: { type: Date },
    paymentHistory: [paymentSchema],
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active'
    }
  },
  { timestamps: true }
);

export default mongoose.models.Payroll || mongoose.model<IPayroll>('Payroll', payrollSchema);
