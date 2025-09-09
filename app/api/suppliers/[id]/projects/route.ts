import { NextResponse } from "next/server"
import mongoose from 'mongoose'
import dbConnect from "@/lib/db"
import Supplier from "@/models/SupplierModel"

// POST /api/suppliers/[id]/projects - assign a project to a supplier
export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const { projectId } = await request.json()

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(projectId)) {
      return NextResponse.json({ message: 'Invalid supplier or project ID' }, { status: 400 })
    }

    await dbConnect()

    const updated = await Supplier.findByIdAndUpdate(
      id,
      { $addToSet: { assignedProjects: projectId } },
      { new: true }
    ).select('assignedProjects')

    if (!updated) {
      return NextResponse.json({ message: 'Supplier not found' }, { status: 404 })
    }

    return NextResponse.json({ assignedProjects: updated.assignedProjects || [] })
  } catch (error) {
    console.error('Error assigning project to supplier:', error)
    return NextResponse.json({ message: 'Failed to assign project' }, { status: 500 })
  }
}

// DELETE /api/suppliers/[id]/projects - unassign a project from a supplier
export async function DELETE(request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const { projectId } = await request.json()

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(projectId)) {
      return NextResponse.json({ message: 'Invalid supplier or project ID' }, { status: 400 })
    }

    await dbConnect()

    const updated = await Supplier.findByIdAndUpdate(
      id,
      { $pull: { assignedProjects: projectId } },
      { new: true }
    ).select('assignedProjects')

    if (!updated) {
      return NextResponse.json({ message: 'Supplier not found' }, { status: 404 })
    }

    return NextResponse.json({ assignedProjects: updated.assignedProjects || [] })
  } catch (error) {
    console.error('Error unassigning project from supplier:', error)
    return NextResponse.json({ message: 'Failed to unassign project' }, { status: 500 })
  }
}
