import mongoose, { Document, Schema } from 'mongoose';

export interface IProjectMaterial {
  projectId: mongoose.Types.ObjectId;
  materialType: string;
  quantity: number;
  amount: number;
  date: Date;
}

export interface ISupplier extends Document {
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  materialTypes: string[];
  projectMaterials?: IProjectMaterial[];
  assignedProjects?: mongoose.Types.ObjectId[];
  supplyStartDate?: Date;
  address: string;
  totalPaid?: number;
  dueAmount?: number;
  lastPaymentDate?: Date;
  avatar?: string;
  username?: string; // Added to handle existing index
  bankDetails?: {
    accountNumber?: string;
    accountHolderName?: string;
    bankName?: string;
    branch?: string;
    ifscCode?: string;
    upiId?: string;
    accountType?: 'Savings' | 'Current' | 'Other';
    isPrimary?: boolean;
  }[];
}

const projectMaterialSchema = new Schema<IProjectMaterial>({
  projectId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Project',
    required: true 
  },
  materialType: { 
    type: String, 
    required: true 
  },
  quantity: { 
    type: Number, 
    required: true,
    min: 1
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  }
});

const supplierSchema = new Schema<ISupplier>({
  companyName: { type: String, required: true },
  contactPerson: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  username: { type: String, unique: true, sparse: true }, // Added to handle existing index
  materialTypes: [{ type: String, required: true }],
  projectMaterials: [projectMaterialSchema],
  assignedProjects: [{ type: Schema.Types.ObjectId, ref: 'Project' }],
  supplyStartDate: { type: Date },
  address: { type: String, required: true },
  bankDetails: [{
    accountNumber: { type: String, trim: true },
    accountHolderName: { type: String, trim: true },
    bankName: { type: String, trim: true },
    branch: { type: String, trim: true },
    ifscCode: { type: String, trim: true, uppercase: true },
    upiId: { type: String, trim: true, lowercase: true },
    accountType: {
      type: String,
      enum: ['Savings', 'Current', 'Other'],
      default: 'Savings'
    },
    isPrimary: { type: Boolean, default: false }
  }],
  totalPaid: { type: Number, default: 0 },
  dueAmount: { type: Number, default: 0 },
  lastPaymentDate: { type: Date },
  avatar: { type: String }
}, {
  timestamps: true
});

// Create text index for search
supplierSchema.index({
  companyName: 'text',
  email: 'text',
  contactPerson: 'text'
});

// Create the model or retrieve it if it already exists to prevent OverwriteModelError
let Supplier: mongoose.Model<ISupplier>;

try {
  // Try to get the existing model
  Supplier = mongoose.models.Supplier as mongoose.Model<ISupplier>;
  
  // If model exists, check and drop the problematic index
  if (Supplier) {
    Supplier.collection.dropIndex('username_1').catch((err: any) => {
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
if (!Supplier) {
  Supplier = mongoose.model<ISupplier>('Supplier', supplierSchema);
}

export default Supplier;
