import { Schema, model, Document, Types, models } from 'mongoose';

export interface IMaterialRequest extends Document {
  material: string | Types.ObjectId;
  materialName: string;
  quantity: number;
  unit: string;
  requestDate: Date;
  requiredDate: Date;
  status: 'Pending' | 'Approved' | 'Ordered' | 'Delivered' | 'Rejected';
  notes?: string;
  requestedBy: string;
  supervisor?: string;
  projectId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const materialRequestSchema = new Schema<IMaterialRequest>(
  {
    material: { 
      type: String, 
      required: true 
    },
    materialName: { 
      type: String, 
      required: true 
    },
    quantity: { 
      type: Number, 
      required: true,
      min: 1 
    },
    unit: { 
      type: String, 
      required: true 
    },
    requestDate: { 
      type: Date, 
      default: Date.now 
    },
    requiredDate: { 
      type: Date, 
      required: true 
    },
    status: { 
      type: String, 
      enum: ['Pending', 'Approved', 'Ordered', 'Delivered', 'Rejected'],
      default: 'Pending' 
    },
    notes: { 
      type: String 
    },
    requestedBy: { 
      type: String,
      required: true 
    },
    supervisor: { 
      type: String 
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project'
    },
  },
  {
    timestamps: true
  }
);

// Prevent model overwrite in development
const MaterialRequest = models.MaterialRequest || model<IMaterialRequest>('MaterialRequest', materialRequestSchema);

export default MaterialRequest;
