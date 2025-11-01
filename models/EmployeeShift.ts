import mongoose, { Document, Schema } from 'mongoose';

export interface IEmployeeShift extends Document {
  employeeId: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId; // project-scoped shift record
  date: Date; // normalized to start of day (UTC)
  shifts: number; // 0-50
  perShiftSalary: number; // snapshot at the time of save
  totalPay: number; // shifts * perShiftSalary
  createdAt: Date;
  updatedAt: Date;
}

const EmployeeShiftSchema = new Schema<IEmployeeShift>({
  employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  date: { type: Date, required: true },
  shifts: { type: Number, min: 0, max: 50, default: 0, required: true },
  perShiftSalary: { type: Number, required: true },
  totalPay: { type: Number, required: true },
}, { timestamps: true });

// Ensure only one record per employee per project per day
EmployeeShiftSchema.index({ employeeId: 1, projectId: 1, date: 1 }, { unique: true });

export default mongoose.models.EmployeeShift || mongoose.model<IEmployeeShift>('EmployeeShift', EmployeeShiftSchema);
