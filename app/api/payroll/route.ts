// import { NextResponse } from 'next/server';
// import connectToDB from '@/lib/db';
// import Payroll, { IPayroll } from '@/models/PayrollModel';
// import '@/models/Supervisor'; // Import Supervisor model to ensure it's registered
// import mongoose from 'mongoose';

// // Helper function to get error details
// function getErrorDetails(error: unknown): { name: string; message: string; stack?: string } {
//   if (error instanceof Error) {
//     return {
//       name: error.name,
//       message: error.message,
//       stack: error.stack
//     };
//   }
//   return {
//     name: 'UnknownError',
//     message: String(error)
//   };
// }
// // Set response timeout (10 seconds)
// export const dynamic = 'force-dynamic';
// export const maxDuration = 30;

// // Helper function to ensure database connection
// async function ensureDatabaseConnection() {
//   // Check if we already have a connection
//   if (mongoose.connection.readyState === 1) {
//     console.log('  - Using existing database connection');
//     return true;
//   }

//   console.log('  - No active connection, establishing new one...');
//   let retries = 3;
//   let lastError;
  
//   while (retries > 0) {
//     try {
//       console.log(`  - Attempting to connect (${4 - retries}/3)...`);
//       await connectToDB();
//       console.log('  - Database connection successful');
//       return true;
//     } catch (dbError) {
//       lastError = dbError;
//       retries--;
//       console.warn(`  - Connection attempt failed: ${dbError}`);
//       if (retries === 0) {
//         console.error('  - All connection attempts failed');
//         throw dbError;
//       }
//       // Wait before retrying
//       await new Promise(resolve => setTimeout(resolve, 1000));
//     }
//   }
  
//   return false;
// }

// // GET all payroll records
// export async function GET() {
//   console.log('🔍 Starting GET /api/payroll');
  
//   try {
//     // 1. Ensure database connection
//     console.log('1. Connecting to database...');
//     await ensureDatabaseConnection();
    
//     // 2. Verify connection state
//     console.log('2. Verifying database connection...');
//     if (mongoose.connection.readyState !== 1) {
//       throw new Error(`Database connection failed. State: ${mongoose.connection.readyState}`);
//     }
    
//     // 3. Log database state
//     console.log('3. Database state:', {
//       readyState: mongoose.connection.readyState,
//       dbName: mongoose.connection.db?.databaseName || 'unknown',
//       collections: mongoose.connection.db ? 
//         await mongoose.connection.db.listCollections().toArray()
//           .then(cols => cols.map((c: any) => c.name))
//           .catch(err => `Failed to list collections: ${err.message}`) : 
//         'No database connection'
//     });
    
//     // 4. Check if Payroll model is registered
//     if (!mongoose.models.Payroll) {
//       throw new Error('Payroll model is not registered');
//     }
    
//     console.log('4. Fetching payroll records...');
//     const query = Payroll.find({})
//       .populate({
//         path: 'user',
//         select: 'name email',
//         options: { lean: true }
//       })
//       .sort({ paymentDate: -1 })
//       .lean()
//       .maxTimeMS(10000); // 10 second timeout
    
//     console.log('  - Query:', query.getFilter());
    
//     const payrollRecords = await query.exec().catch(err => {
//       console.error('  - Query execution failed:', err);
//       throw new Error(`Failed to execute query: ${err.message}`);
//     });
      
//     console.log(`4. Successfully fetched ${payrollRecords.length} payroll records`);
    
//     // Ensure all _id fields are strings for the client
//     const processedRecords = payrollRecords.map((record: any) => ({
//       ...record,
//       _id: record._id?.toString(),
//       user: record.user ? {
//         ...record.user,
//         _id: record.user._id?.toString()
//       } : null
//     }));
    
//     return NextResponse.json(processedRecords);
    
//   } catch (err: unknown) {
//     const errorDetails = getErrorDetails(err);
//     const timestamp = new Date().toISOString();
//     const isProduction = process.env.NODE_ENV === 'production';
    
//     // Prepare error context
//     const errorContext = {
//       timestamp,
//       environment: process.env.NODE_ENV,
//       dbConnection: mongoose.connection?.readyState === 1 ? 'connected' : 'disconnected',
//       nodeVersion: process.version,
//       error: {
//         name: errorDetails.name,
//         message: errorDetails.message,
//         ...(!isProduction && { stack: errorDetails.stack })
//       }
//     };

//     // Log detailed error information
//     console.error('❌ Error in GET /api/payroll:', JSON.stringify(errorContext, null, 2));
    
//     if (errorDetails.stack) {
//       console.error('Error stack:', errorDetails.stack);
//     }
    
//     // Prepare error response
//     const errorResponse: any = {
//       success: false,
//       message: 'Failed to fetch payroll records',
//       timestamp,
//       error: {
//         type: errorDetails.name,
//         message: errorDetails.message
//       }
//     };
    
//     // Add debug information in non-production
//     if (!isProduction) {
//       errorResponse.debug = {
//         nodeEnv: process.env.NODE_ENV,
//         dbConnection: errorContext.dbConnection,
//         collections: mongoose.connection.db ? 
//           await mongoose.connection.db.listCollections().toArray()
//             .then(cols => cols.map((c: any) => c.name))
//             .catch(() => 'Failed to list collections') : 
//           'No database connection',
//         mongooseState: {
//           readyState: mongoose.connection.readyState,
//           models: Object.keys(mongoose.connection.models),
//           modelSchemas: mongoose.connection.modelSchemas 
//             ? Object.keys(mongoose.connection.modelSchemas)
//             : [] // Return empty array if modelSchemas is not available
//         }
//       };
      
//       // Add full error details in development
//       if (process.env.NODE_ENV === 'development') {
//         errorResponse.error.fullError = errorDetails;
//       }
//     }
    
//     // Set appropriate status code based on error type
//     let statusCode = 500;
//     if (errorDetails.name === 'ValidationError') statusCode = 400;
//     if (errorDetails.name === 'UnauthorizedError') statusCode = 401;
//     if (errorDetails.name === 'ForbiddenError') statusCode = 403;
//     if (errorDetails.name === 'NotFoundError') statusCode = 404;
    
//     // Return the error response
//     return new NextResponse(JSON.stringify(errorResponse, null, 2), {
//       status: statusCode,
//       headers: {
//         'Content-Type': 'application/json',
//         'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
//         'Pragma': 'no-cache',
//         'Expires': '0',
//         'X-Error-Type': errorDetails.name,
//         'X-Request-ID': crypto.randomUUID()
//       }
//     });
//   }
// }

// // POST a new payroll transaction
// export async function POST(request: Request) {
//   try {
//     console.log('Received payroll creation request');
//     const body = await request.json();
//     console.log('Request body:', JSON.stringify(body, null, 2));
    
//     const { 
//       user, 
//       userRole, 
//       amount, 
//       paymentDate, 
//       status, 
//       notes,
//       // Supplier-specific fields
//       totalSupplyValue,
//       totalPaid,
//       dueAmount,
//       supplierMaterials
//     } = body;

//     // Basic validation
//     if (!user || !userRole || amount === undefined) {
//       const errorMessage = 'Missing required fields. Required: user, userRole, and amount.';
//       console.error(errorMessage, { user, userRole, amount });
//       return NextResponse.json(
//         { 
//           message: errorMessage,
//           required: ['user', 'userRole', 'amount'],
//           received: { user, userRole, amount }
//         },
//         { status: 400 }
//       );
//     }

//     // Normalize userRole to match the expected enum values
//     let normalizedUserRole: 'Employee' | 'Supervisor' | 'Client' | 'Supplier';
//     const userRoleStr = String(userRole).toLowerCase();
    
//     if (userRoleStr.includes('employee')) normalizedUserRole = 'Employee';
//     else if (userRoleStr.includes('supervisor')) normalizedUserRole = 'Supervisor';
//     else if (userRoleStr.includes('client')) normalizedUserRole = 'Client';
//     else if (userRoleStr.includes('supplier')) normalizedUserRole = 'Supplier';
//     else {
//       const errorMessage = 'Invalid userRole. Must be one of: Employee, Supervisor, Client, Supplier';
//       console.error(errorMessage, { receivedRole: userRole });
//       return NextResponse.json(
//         { 
//           message: errorMessage,
//           allowedRoles: ['Employee', 'Supervisor', 'Client', 'Supplier'],
//           receivedRole: userRole 
//         },
//         { status: 400 }
//       );
//     }

//     console.log('Connecting to database...');
//     await connectToDB();
//     console.log('Database connected, creating payroll entry...');

//     // For suppliers, we need to fetch their material details and create comprehensive payroll records
//     let payrollData: any = {
//       user,  
//       userRole: normalizedUserRole,
//       amount: Number(amount),
//       paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
//       status: status || 'paid',
//       notes: notes || '',
//     };

//     // If this is a supplier payment, add supplier-specific material details
//     if (normalizedUserRole === 'Supplier') {
//       console.log('Processing supplier payment with material details...');
      
//       // If supplier materials are provided in the request, use them
//       if (supplierMaterials && Array.isArray(supplierMaterials)) {
//         payrollData.supplierMaterials = supplierMaterials;
//         payrollData.totalSupplyValue = Number(totalSupplyValue) || 0;
//         payrollData.totalPaid = Number(totalPaid) || 0;
//         payrollData.dueAmount = Number(dueAmount) || 0;
//       } else {
//         // Fetch supplier details from the supplier collection to get material information
//         try {
//           const Supplier = mongoose.models.Supplier || require('@/models/SupplierModel').default;
//           const supplier = await Supplier.findById(user).populate('projectMaterials');
          
//           if (supplier && supplier.projectMaterials) {
//             console.log('Found supplier with materials:', supplier.companyName, supplier.projectMaterials.length, 'materials');
            
//             // Transform supplier materials into payroll supplier materials format
//             const transformedMaterials = supplier.projectMaterials.map((material: any) => ({
//               projectId: material.projectId,
//               materialType: material.materialType,
//               quantity: material.quantity || 0,
//               pricePerUnit: material.amount ? (material.amount / (material.quantity || 1)) : 0,
//               totalAmount: material.amount || 0,
//               date: material.date || material.createdAt,
//               paidAmount: 0, // Initially unpaid
//               dueAmount: material.amount || 0,
//               status: 'pending'
//             }));
            
//             const totalSupplyVal = transformedMaterials.reduce((sum: number, mat: any) => sum + mat.totalAmount, 0);
//             const currentPaid = Number(amount); // The payment being made now
//             const totalDue = totalSupplyVal - currentPaid;
            
//             payrollData.supplierMaterials = transformedMaterials;
//             payrollData.totalSupplyValue = totalSupplyVal;
//             payrollData.totalPaid = currentPaid;
//             payrollData.dueAmount = Math.max(0, totalDue);
            
//             console.log('Supplier payroll data:', {
//               materialsCount: transformedMaterials.length,
//               totalSupplyValue: totalSupplyVal,
//               totalPaid: currentPaid,
//               dueAmount: totalDue
//             });
//           } else {
//             console.log('No supplier found or no materials for supplier:', user);
//             // Set default values for supplier without materials
//             payrollData.supplierMaterials = [];
//             payrollData.totalSupplyValue = Number(amount);
//             payrollData.totalPaid = Number(amount);
//             payrollData.dueAmount = 0;
//           }
//         } catch (supplierFetchError) {
//           console.error('Error fetching supplier details:', supplierFetchError);
//           // Set default values if supplier fetch fails
//           payrollData.supplierMaterials = [];
//           payrollData.totalSupplyValue = Number(amount);
//           payrollData.totalPaid = Number(amount);
//           payrollData.dueAmount = 0;
//         }
//       }
//     }

//     console.log('Creating payroll entry with data:', JSON.stringify(payrollData, null, 2));
//     const newPayrollEntry = await Payroll.create(payrollData);
    
//     console.log('Payroll entry created successfully:', newPayrollEntry._id);
//     return NextResponse.json(newPayrollEntry, { status: 201 });
//   } catch (err: unknown) {
//     // Type guard for standard Error
//     if (err instanceof Error) {
//       const error = err as Error & { 
//         code?: string | number; 
//         keyPattern?: Record<string, unknown>; 
//         keyValue?: Record<string, unknown>;
//       };
      
//       const errorDetails: Record<string, unknown> = {
//         message: error.message,
//         name: error.name,
//         ...(error.stack && { stack: error.stack }),  // Only include stack if it exists
//       };
      
//       // Add MongoDB-specific error details if available
//       if (error.code) {
//         errorDetails.code = error.code;
//         if (error.keyPattern) errorDetails.keyPattern = error.keyPattern;
//         if (error.keyValue) errorDetails.keyValue = error.keyValue;
//       }
      
//       console.error('Error in POST /api/payroll:', errorDetails);
      
//       const response: Record<string, unknown> = {
//         message: 'Failed to create payroll entry',
//       };
      
//       // Add debug information in development
//       if (process.env.NODE_ENV === 'development') {
//         response.error = error.message;
//         response.details = {
//           name: error.name,
//           ...(error.code && { code: error.code }),
//           ...(error.keyPattern && { keyPattern: error.keyPattern }),
//           ...(error.keyValue && Object.keys(error.keyValue).length > 0 && { keyValue: error.keyValue })
//         };
//       }
      
//       return NextResponse.json(response, { status: 500 });
//     }
    
//     // Handle non-Error thrown values
//     console.error('Unknown error in POST /api/payroll:', err);
//     return NextResponse.json(
//       { 
//         message: 'An unknown error occurred while creating payroll entry',
//         ...(process.env.NODE_ENV === 'development' && { error: String(err) })
//       },
//       { status: 500 }
//     );
//   }
// }


import { NextResponse } from "next/server"
import connectToDB from "@/lib/db"
import Payroll from "@/models/PayrollModel"
import mongoose from "mongoose"

// Helper function to get error details
function getErrorDetails(error: unknown): { name: string; message: string; stack?: string } {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    }
  }
  return {
    name: "UnknownError",
    message: String(error),
  }
}

// Set response timeout (10 seconds)
export const dynamic = "force-dynamic"
export const maxDuration = 30

// Helper function to ensure database connection
async function ensureDatabaseConnection() {
  // Check if we already have a connection
  if (mongoose.connection.readyState === 1) {
    console.log("  - Using existing database connection")
    return true
  }

  console.log("  - No active connection, establishing new one...")
  let retries = 3
  let lastError

  while (retries > 0) {
    try {
      console.log(`  - Attempting to connect (${4 - retries}/3)...`)
      await connectToDB()
      console.log("  - Database connection successful")
      return true
    } catch (dbError) {
      lastError = dbError
      retries--
      console.warn(`  - Connection attempt failed: ${dbError}`)
      if (retries === 0) {
        console.error("  - All connection attempts failed")
        throw dbError
      }
      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }

  return false
}

// GET all payroll records
export async function GET() {
  console.log("🔍 Starting GET /api/payroll")

  try {
    // 1. Ensure database connection
    console.log("1. Connecting to database...")
    await ensureDatabaseConnection()

    // 2. Verify connection state
    console.log("2. Verifying database connection...")
    if (mongoose.connection.readyState !== 1) {
      throw new Error(`Database connection failed. State: ${mongoose.connection.readyState}`)
    }

    console.log("3. Database state:", {
      readyState: mongoose.connection.readyState,
      dbName: mongoose.connection.db?.databaseName || "unknown",
    })

    // 4. Check if Payroll model is registered
    if (!mongoose.models.Payroll) {
      throw new Error("Payroll model is not registered")
    }

    console.log("4. Fetching payroll records...")

    const query = Payroll.find({}).sort({ paymentDate: -1 }).lean().maxTimeMS(10000) // 10 second timeout

    console.log("  - Query:", query.getFilter())

    const payrollRecords = await query.exec().catch((err) => {
      console.error("  - Query execution failed:", err)
      throw new Error(`Failed to execute query: ${err.message}`)
    })

    console.log(`4. Successfully fetched ${payrollRecords.length} payroll records`)

    const processedRecords = payrollRecords.map((record: any) => ({
      ...record,
      _id: record._id?.toString(),
    }))

    return NextResponse.json(processedRecords)
  } catch (err: unknown) {
    const errorDetails = getErrorDetails(err)
    const timestamp = new Date().toISOString()
    const isProduction = process.env.NODE_ENV === "production"

    // Prepare error context
    const errorContext = {
      timestamp,
      environment: process.env.NODE_ENV,
      dbConnection: mongoose.connection?.readyState === 1 ? "connected" : "disconnected",
      nodeVersion: process.version,
      error: {
        name: errorDetails.name,
        message: errorDetails.message,
        ...(!isProduction && { stack: errorDetails.stack }),
      },
    }

    // Log detailed error information
    console.error("❌ Error in GET /api/payroll:", JSON.stringify(errorContext, null, 2))

    if (errorDetails.stack) {
      console.error("Error stack:", errorDetails.stack)
    }

    // Prepare error response
    const errorResponse: any = {
      success: false,
      message: "Failed to fetch payroll records",
      timestamp,
      error: {
        type: errorDetails.name,
        message: errorDetails.message,
      },
    }

    if (!isProduction) {
      errorResponse.debug = {
        nodeEnv: process.env.NODE_ENV,
        dbConnection: errorContext.dbConnection,
        mongooseState: {
          readyState: mongoose.connection.readyState,
          models: Object.keys(mongoose.connection.models || {}),
          modelSchemas: [],
        },
      }

      // Add full error details in development
      if (process.env.NODE_ENV === "development") {
        errorResponse.error.fullError = errorDetails
      }
    }

    // Set appropriate status code based on error type
    let statusCode = 500
    if (errorDetails.name === "ValidationError") statusCode = 400
    if (errorDetails.name === "UnauthorizedError") statusCode = 401
    if (errorDetails.name === "ForbiddenError") statusCode = 403
    if (errorDetails.name === "NotFoundError") statusCode = 404

    // Return the error response
    return new NextResponse(JSON.stringify(errorResponse, null, 2), {
      status: statusCode,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
        "X-Error-Type": errorDetails.name,
        "X-Request-ID": crypto.randomUUID(),
      },
    })
  }
}

// POST a new payroll transaction
export async function POST(request: Request) {
  try {
    console.log("Received payroll creation request")
    const body = await request.json()
    console.log("Request body:", JSON.stringify(body, null, 2))

    const {
      user,
      userRole,
      amount,
      paymentDate,
      status,
      notes,
      // Supplier-specific fields
      totalSupplyValue,
      totalPaid,
      dueAmount,
      supplierMaterials,
    } = body

    // Basic validation
    if (!user || !userRole || amount === undefined) {
      const errorMessage = "Missing required fields. Required: user, userRole, and amount."
      console.error(errorMessage, { user, userRole, amount })
      return NextResponse.json(
        {
          message: errorMessage,
          required: ["user", "userRole", "amount"],
          received: { user, userRole, amount },
        },
        { status: 400 },
      )
    }

    // Normalize userRole to match the expected enum values
    let normalizedUserRole: "Employee" | "Supervisor" | "Client" | "Supplier"
    const userRoleStr = String(userRole).toLowerCase()

    if (userRoleStr.includes("employee")) normalizedUserRole = "Employee"
    else if (userRoleStr.includes("supervisor")) normalizedUserRole = "Supervisor"
    else if (userRoleStr.includes("client")) normalizedUserRole = "Client"
    else if (userRoleStr.includes("supplier")) normalizedUserRole = "Supplier"
    else {
      const errorMessage = "Invalid userRole. Must be one of: Employee, Supervisor, Client, Supplier"
      console.error(errorMessage, { receivedRole: userRole })
      return NextResponse.json(
        {
          message: errorMessage,
          allowedRoles: ["Employee", "Supervisor", "Client", "Supplier"],
          receivedRole: userRole,
        },
        { status: 400 },
      )
    }

    console.log("Connecting to database...")
    await connectToDB()
    console.log("Database connected, creating payroll entry...")

    // For suppliers, we need to fetch their material details and create comprehensive payroll records
    const payrollData: any = {
      user,
      userRole: normalizedUserRole,
      amount: Number(amount),
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      status: status || "paid",
      notes: notes || "",
    }

    // If this is a supplier payment, add supplier-specific material details
    if (normalizedUserRole === "Supplier") {
      console.log("Processing supplier payment with material details...")

      // If supplier materials are provided in the request, use them
      if (supplierMaterials && Array.isArray(supplierMaterials)) {
        payrollData.supplierMaterials = supplierMaterials
        payrollData.totalSupplyValue = Number(totalSupplyValue) || 0
        payrollData.totalPaid = Number(totalPaid) || 0
        payrollData.dueAmount = Number(dueAmount) || 0
      } else {
        // Fetch supplier details from the supplier collection to get material information
        try {
          const Supplier = mongoose.models.Supplier || require("@/models/SupplierModel").default
          const supplier = await Supplier.findById(user).populate("projectMaterials")

          if (supplier && supplier.projectMaterials) {
            console.log(
              "Found supplier with materials:",
              supplier.companyName,
              supplier.projectMaterials.length,
              "materials",
            )

            // Transform supplier materials into payroll supplier materials format
            const transformedMaterials = supplier.projectMaterials.map((material: any) => ({
              projectId: material.projectId,
              materialType: material.materialType,
              quantity: material.quantity || 0,
              pricePerUnit: material.amount ? material.amount / (material.quantity || 1) : 0,
              totalAmount: material.amount || 0,
              date: material.date || material.createdAt,
              paidAmount: 0, // Initially unpaid
              dueAmount: material.amount || 0,
              status: "pending",
            }))

            const totalSupplyVal = transformedMaterials.reduce((sum: number, mat: any) => sum + mat.totalAmount, 0)
            const currentPaid = Number(amount) // The payment being made now
            const totalDue = totalSupplyVal - currentPaid

            payrollData.supplierMaterials = transformedMaterials
            payrollData.totalSupplyValue = totalSupplyVal
            payrollData.totalPaid = currentPaid
            payrollData.dueAmount = Math.max(0, totalDue)

            console.log("Supplier payroll data:", {
              materialsCount: transformedMaterials.length,
              totalSupplyValue: totalSupplyVal,
              totalPaid: currentPaid,
              dueAmount: totalDue,
            })
          } else {
            console.log("No supplier found or no materials for supplier:", user)
            // Set default values for supplier without materials
            payrollData.supplierMaterials = []
            payrollData.totalSupplyValue = Number(amount)
            payrollData.totalPaid = Number(amount)
            payrollData.dueAmount = 0
          }
        } catch (supplierFetchError) {
          console.error("Error fetching supplier details:", supplierFetchError)
          // Set default values if supplier fetch fails
          payrollData.supplierMaterials = []
          payrollData.totalSupplyValue = Number(amount)
          payrollData.totalPaid = Number(amount)
          payrollData.dueAmount = 0
        }
      }
    }

    console.log("Creating payroll entry with data:", JSON.stringify(payrollData, null, 2))
    const newPayrollEntry = await Payroll.create(payrollData)

    console.log("Payroll entry created successfully:", newPayrollEntry._id)
    return NextResponse.json(newPayrollEntry, { status: 201 })
  } catch (err: unknown) {
    // Type guard for standard Error
    if (err instanceof Error) {
      const error = err as Error & {
        code?: string | number
        keyPattern?: Record<string, unknown>
        keyValue?: Record<string, unknown>
      }

      const errorDetails: Record<string, unknown> = {
        message: error.message,
        name: error.name,
        ...(error.stack && { stack: error.stack }), // Only include stack if it exists
      }

      // Add MongoDB-specific error details if available
      if (error.code) {
        errorDetails.code = error.code
        if (error.keyPattern) errorDetails.keyPattern = error.keyPattern
        if (error.keyValue) errorDetails.keyValue = error.keyValue
      }

      console.error("Error in POST /api/payroll:", errorDetails)

      const response: Record<string, unknown> = {
        message: "Failed to create payroll entry",
      }

      // Add debug information in development
      if (process.env.NODE_ENV === "development") {
        response.error = error.message
        response.details = {
          name: error.name,
          ...(error.code && { code: error.code }),
          ...(error.keyPattern && { keyPattern: error.keyPattern }),
          ...(error.keyValue && Object.keys(error.keyValue).length > 0 && { keyValue: error.keyValue }),
        }
      }

      return NextResponse.json(response, { status: 500 })
    }

    // Handle non-Error thrown values
    console.error("Unknown error in POST /api/payroll:", err)
    return NextResponse.json(
      {
        message: "An unknown error occurred while creating payroll entry",
        ...(process.env.NODE_ENV === "development" && { error: String(err) }),
      },
      { status: 500 },
    )
  }
}
