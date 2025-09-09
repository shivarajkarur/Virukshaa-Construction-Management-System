// import mongoose, { Schema, model, models, Document, Types } from 'mongoose';

// export interface IUserReference {
//   _id: Types.ObjectId;
//   name?: string;
//   email?: string;
//   [key: string]: any;
// }

// export interface ISupplierMaterial {
//   _id?: Types.ObjectId;
//   projectId: Types.ObjectId;
//   projectName?: string;
//   materialType: string;
//   quantity: number;
//   pricePerUnit: number;
//   totalAmount: number;
//   paidAmount: number;
//   dueAmount: number;
//   supplyDate: Date;
//   status: 'Pending' | 'Delivered' | 'Paid' | 'Partial';
//   notes?: string;
// }

// export interface IPayroll extends Document {
//   user: Types.ObjectId | IUserReference;
//   userRole: 'Employee' | 'Supervisor' | 'Client' | 'Supplier';
//   amount: number;
//   paymentDate: Date;
//   status: 'paid' | 'pending' | 'failed';
//   notes?: string;
  
//   // Supplier-specific fields
//   supplierMaterials?: ISupplierMaterial[];
//   totalSupplyValue?: number;
//   totalPaid?: number;
//   dueAmount?: number;
  
//   createdAt?: Date;
//   updatedAt?: Date;
// }

// // Define supplier material schema
// const SupplierMaterialSchema = new Schema<ISupplierMaterial>({
//   projectId: {
//     type: Schema.Types.ObjectId,
//     ref: 'Project',
//     required: true
//   },
//   projectName: {
//     type: String,
//     trim: true
//   },
//   materialType: {
//     type: String,
//     required: true,
//     trim: true
//   },
//   quantity: {
//     type: Number,
//     required: true,
//     min: 0
//   },
//   pricePerUnit: {
//     type: Number,
//     required: true,
//     min: 0
//   },
//   totalAmount: {
//     type: Number,
//     required: true,
//     min: 0
//   },
//   paidAmount: {
//     type: Number,
//     default: 0,
//     min: 0
//   },
//   dueAmount: {
//     type: Number,
//     required: true,
//     min: 0
//   },
//   supplyDate: {
//     type: Date,
//     required: true,
//     default: Date.now
//   },
//   status: {
//     type: String,
//     enum: ['Pending', 'Delivered', 'Paid', 'Partial'],
//     default: 'Pending'
//   },
//   notes: {
//     type: String,
//     trim: true
//   }
// });

// // Define the schema
// const PayrollSchema = new Schema<IPayroll>(
//   {
//     user: {
//       type: Schema.Types.ObjectId,
//       refPath: 'userRole',
//       required: [true, 'User ID is required'],
//     },
//     userRole: {
//       type: String,
//       required: [true, 'User role is required'],
//       enum: {
//         values: ['Employee', 'Supervisor', 'Client', 'Supplier'],
//         message: 'Invalid user role. Must be one of: Employee, Supervisor, Client, Supplier'
//       },
//     },
//     amount: {
//       type: Number,
//       required: [true, 'Amount is required'],
//       min: [0, 'Amount cannot be negative'],
//     },
//     paymentDate: {
//       type: Date,
//       default: Date.now,
//       required: true,
//     },
//     status: {
//       type: String,
//       enum: {
//         values: ['paid', 'pending', 'failed'],
//         message: 'Invalid status. Must be one of: paid, pending, failed'
//       },
//       default: 'paid',
//     },
//     notes: {
//       type: String,
//       trim: true,
//       maxlength: [500, 'Notes cannot be longer than 500 characters'],
//     },
    
//     // Supplier-specific fields
//     supplierMaterials: [SupplierMaterialSchema],
//     totalSupplyValue: {
//       type: Number,
//       min: 0,
//       default: 0
//     },
//     totalPaid: {
//       type: Number,
//       min: 0,
//       default: 0
//     },
//     dueAmount: {
//       type: Number,
//       min: 0,
//       default: 0
//     },
//   },
//   { 
//     timestamps: true,
//     toJSON: { 
//       virtuals: true,
//       transform: function(doc, ret) {
//         const { _id, __v, ...rest } = ret as any;
//         return { id: _id, ...rest };
//       }
//     },
//     toObject: { 
//       virtuals: true,
//       transform: function(doc, ret) {
//         const { _id, __v, ...rest } = ret as any;
//         return { id: _id, ...rest };
//       }
//     }
//   }
// );

// // Add indexes for better query performance
// PayrollSchema.index({ user: 1, paymentDate: -1 });
// PayrollSchema.index({ status: 1 });
// PayrollSchema.index({ paymentDate: -1 });

// // Add a pre-save hook to validate the user reference
// PayrollSchema.pre('save', async function(next) {
//   if (this.isModified('user') || this.isNew) {
//     try {
//       // Check if the referenced user exists
//       const Model = mongoose.model(this.userRole);
//       const user = await Model.findById(this.user).select('_id').lean();
      
//       if (!user) {
//         throw new Error(`Referenced ${this.userRole} not found`);
//       }
//       next();
//     } catch (error) {
//       next(error as Error);
//     }
//   } else {
//     next();
//   }
// });

// // Create the model if it doesn't exist
// const Payroll = models.Payroll || model<IPayroll>('Payroll', PayrollSchema);

// export default Payroll;


import mongoose, { Schema, type Document } from "mongoose"

export interface IPayroll extends Document {
  user: mongoose.Types.ObjectId
  userRole: "Employee" | "Supervisor" | "Client" | "Supplier"
  amount: number
  paymentDate: Date
  status: "pending" | "paid" | "cancelled"
  notes?: string
  totalSupplyValue?: number
  totalPaid?: number
  dueAmount?: number
  supplierMaterials?: Array<{
    projectId: string
    materialType: string
    quantity: number
    pricePerUnit: number
    totalAmount: number
    date: Date
    paidAmount: number
    dueAmount: number
    status: string
  }>
}

const PayrollSchema = new Schema<IPayroll>(
  {
    user: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "userRole",
    },
    userRole: {
      type: String,
      required: true,
      enum: ["Employee", "Supervisor", "Client", "Supplier"],
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["pending", "paid", "cancelled"],
      default: "pending",
    },
    notes: {
      type: String,
      default: "",
    },
    // Supplier-specific fields
    totalSupplyValue: {
      type: Number,
      default: 0,
    },
    totalPaid: {
      type: Number,
      default: 0,
    },
    dueAmount: {
      type: Number,
      default: 0,
    },
    supplierMaterials: [
      {
        projectId: String,
        materialType: String,
        quantity: Number,
        pricePerUnit: Number,
        totalAmount: Number,
        date: Date,
        paidAmount: Number,
        dueAmount: Number,
        status: String,
      },
    ],
  },
  {
    timestamps: true,
  },
)

const Payroll = mongoose.models.Payroll || mongoose.model<IPayroll>("Payroll", PayrollSchema)

export default Payroll
