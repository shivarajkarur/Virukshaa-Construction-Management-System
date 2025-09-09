// import { NextResponse } from 'next/server';
// import connectToDB from '@/lib/db';
// import Payroll from '@/models/PayrollModel';

// export async function GET(
//   request: Request,
//   { params }: { params: { id: string } }
// ) {
//   try {
//     await connectToDB();
    
//     const payroll = await Payroll.findById(params.id)
//       .populate('user', 'name email phone')
//       .lean();

//     if (!payroll) {
//       return NextResponse.json(
//         { error: 'Payroll record not found' },
//         { status: 404 }
//       );
//     }

//     return NextResponse.json(payroll);
//   } catch (error) {
//     console.error('Error fetching payroll record:', error);
//     return NextResponse.json(
//       { error: 'Failed to fetch payroll record' },
//       { status: 500 }
//     );
//   }
// }

// export async function PATCH(
//   request: Request,
//   { params }: { params: { id: string } }
// ) {
//   try {
//     const updates = await request.json();
//     await connectToDB();

//     // If payment is being processed
//     if (updates.payment && typeof updates.payment.amount === 'number') {
//       const paymentAmount = Number(updates.payment.amount) || 0;

//       // Load the existing record to compute clamped dueAmount correctly
//       const existing = await Payroll.findById(params.id);
//       if (!existing) {
//         return NextResponse.json(
//           { error: 'Payroll record not found' },
//           { status: 404 }
//         );
//       }

//       const currentTotalPaid = Number((existing as any).totalPaid || 0);
//       const currentDue = Number((existing as any).dueAmount || 0);
//       const newTotalPaid = currentTotalPaid + paymentAmount;
//       const newDue = Math.max(0, currentDue - paymentAmount);

//       existing.set({
//         totalPaid: newTotalPaid,
//         dueAmount: newDue,
//         paymentDate: new Date(),
//         status: 'paid',
//         ...(updates.notes ? { notes: updates.notes } : {})
//       });

//       const saved = await existing.save();
//       return NextResponse.json(saved);
//     }

//     // Regular update
//     const updatedPayroll = await Payroll.findByIdAndUpdate(
//       params.id,
//       { $set: updates },
//       { new: true }
//     );

//     if (!updatedPayroll) {
//       return NextResponse.json(
//         { error: 'Payroll record not found' },
//         { status: 404 }
//       );
//     }

//     return NextResponse.json(updatedPayroll);
//   } catch (error) {
//     console.error('Error updating payroll record:', error);
//     return NextResponse.json(
//       { error: 'Failed to update payroll record' },
//       { status: 500 }
//     );
//   }
// }

// export async function DELETE(
//   request: Request,
//   { params }: { params: { id: string } }
// ) {
//   try {
//     await connectToDB();
    
//     const deletedPayroll = await Payroll.findByIdAndDelete(params.id);
    
//     if (!deletedPayroll) {
//       return NextResponse.json(
//         { error: 'Payroll record not found' },
//         { status: 404 }
//       );
//     }

//     return NextResponse.json({ message: 'Payroll record deleted successfully' });
//   } catch (error) {
//     console.error('Error deleting payroll record:', error);
//     return NextResponse.json(
//       { error: 'Failed to delete payroll record' },
//       { status: 500 }
//     );
//   }
// }

import { NextResponse } from "next/server"
import connectToDB from "@/lib/db"
import Payroll from "@/models/PayrollModel"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    await connectToDB()

    const payroll = await Payroll.findById(params.id).lean()

    if (!payroll) {
      return NextResponse.json({ error: "Payroll record not found" }, { status: 404 })
    }

    return NextResponse.json(payroll)
  } catch (error) {
    console.error("Error fetching payroll record:", error)
    return NextResponse.json({ error: "Failed to fetch payroll record" }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const updates = await request.json()
    await connectToDB()

    // If payment is being processed
    if (updates.payment && typeof updates.payment.amount === "number") {
      const paymentAmount = Number(updates.payment.amount) || 0

      // Load the existing record to compute clamped dueAmount correctly
      const existing = await Payroll.findById(params.id)
      if (!existing) {
        return NextResponse.json({ error: "Payroll record not found" }, { status: 404 })
      }

      const currentTotalPaid = Number((existing as any).totalPaid || 0)
      const currentDue = Number((existing as any).dueAmount || 0)
      const newTotalPaid = currentTotalPaid + paymentAmount
      const newDue = Math.max(0, currentDue - paymentAmount)

      existing.set({
        totalPaid: newTotalPaid,
        dueAmount: newDue,
        paymentDate: new Date(),
        status: "paid",
        ...(updates.notes ? { notes: updates.notes } : {}),
      })

      const saved = await existing.save()
      return NextResponse.json(saved)
    }

    // Regular update
    const updatedPayroll = await Payroll.findByIdAndUpdate(params.id, { $set: updates }, { new: true })

    if (!updatedPayroll) {
      return NextResponse.json({ error: "Payroll record not found" }, { status: 404 })
    }

    return NextResponse.json(updatedPayroll)
  } catch (error) {
    console.error("Error updating payroll record:", error)
    return NextResponse.json({ error: "Failed to update payroll record" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    await connectToDB()

    const deletedPayroll = await Payroll.findByIdAndDelete(params.id)

    if (!deletedPayroll) {
      return NextResponse.json({ error: "Payroll record not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Payroll record deleted successfully" })
  } catch (error) {
    console.error("Error deleting payroll record:", error)
    return NextResponse.json({ error: "Failed to delete payroll record" }, { status: 500 })
  }
}
