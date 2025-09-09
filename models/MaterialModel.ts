import mongoose, { Schema, Document, Types, Model } from 'mongoose';

export interface IMaterial {
  _id: Types.ObjectId;
  name: string;
  category: string;
  unit: string;
  currentStock: number;
  reorderLevel: number;
  pricePerUnit: number;
  lastUpdated: Date;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock' | 'On Order';
  description?: string;
  notes?: string;
  minOrderQuantity?: number;
  location?: string;
  barcode?: string;
  sku?: string;
  imageUrl?: string;
  tags?: string[];
  projectId?: Types.ObjectId;
  // Associate each material with a supervisor for scoping
  supervisor?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type MaterialDocument = Document<unknown, {}, IMaterial> & 
  IMaterial & 
  Required<{ _id: Types.ObjectId }>;

const materialSchema = new Schema<IMaterial>(
  {
    name: { 
      type: String, 
      required: true,
      trim: true
    },
    category: { 
      type: String, 
      required: true,
      enum: ['Cement', 'Steel', 'Masonry', 'Concrete', 'Electrical', 'Plumbing', 'Tools', 'Safety']
    },
    unit: { 
      type: String,
      required: false,
      trim: true
    },
    currentStock: { 
      type: Number, 
      required: true,
      min: 0
    },
    reorderLevel: { 
      type: Number, 
      required: true,
      min: 0
    },
    pricePerUnit: { 
      type: Number, 
      required: true,
      min: 0
    },
    lastUpdated: { 
      type: Date, 
      default: Date.now 
    },
    status: { 
      type: String, 
      enum: ['In Stock', 'Low Stock', 'Out of Stock', 'On Order'],
      default: 'In Stock'
    },
    description: { type: String },
    notes: { type: String },
    minOrderQuantity: { type: Number },
    location: { type: String },
    barcode: { type: String },
    sku: { type: String },
    imageUrl: { type: String },
    tags: [{ type: String }],
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: false },
    // Link to supervisor who owns/created the material
    supervisor: { type: Schema.Types.ObjectId, ref: 'Supervisor', required: false }
  },
  {
    timestamps: true
  }
);

// Update status based on stock level before saving
materialSchema.pre<IMaterial>('save', function(next) {
  if (this.currentStock <= 0) {
    this.status = 'Out of Stock';
  } else if (this.currentStock <= this.reorderLevel) {
    this.status = 'Low Stock';
  } else {
    this.status = 'In Stock';
  }
  this.lastUpdated = new Date();
  next();
});

// Check if the model has already been compiled
const Material: Model<IMaterial> = 
  (mongoose.models.Material as Model<IMaterial>) || 
  mongoose.model<IMaterial>('Material', materialSchema);

export { Material };
