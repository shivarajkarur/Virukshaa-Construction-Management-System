import mongoose, { Document, Schema } from "mongoose";

export interface IInvoice extends Document {
  clientId: mongoose.Schema.Types.ObjectId;
  projectId?: mongoose.Schema.Types.ObjectId;
  invoiceNumber: string;
  amount: number;
  status: "Request" | "Pending" | "Paid" | "Overdue";
  dueDate: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const invoiceSchema = new Schema<IInvoice>(
  {
    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project" },
    invoiceNumber: { type: String, required: true, trim: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["Request", "Pending", "Paid", "Overdue"],
      default: "Request",
      index: true,
    },
    dueDate: { type: Date, required: true },
    notes: { type: String },
  },
  { timestamps: true }
);

invoiceSchema.index({ invoiceNumber: 1, clientId: 1 }, { unique: true });

export default mongoose.models.Invoice ||
  mongoose.model<IInvoice>("Invoice", invoiceSchema);
