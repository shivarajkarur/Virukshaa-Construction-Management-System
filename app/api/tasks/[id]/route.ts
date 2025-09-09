import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import Task from "@/models/Task";

// GET: Fetch a single task by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  await dbConnect();
  try {
    const task = await Task.findById(params.id).populate("assignedTo", "name");
    if (!task) {
      return NextResponse.json({ message: "Task not found" }, { status: 404 });
    }

    const obj: any = task.toObject();
    if (!obj.documentUrls && obj.documentUrl) {
      obj.documentUrls = [{ url: obj.documentUrl }];
    }

    return NextResponse.json(obj, { status: 200 });
  } catch (error) {
    console.error("Error fetching task:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

// PATCH: Partially update a task by ID (e.g., status)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  await dbConnect();
  try {
    const body = await req.json();
    const {
      title,
      description,
      startDate,
      endDate,
      documentUrl,
      documentType,
      projectId,
      projectTitle,
      status,
      documentUrls
    } = body || {};

    // If projectId provided but projectTitle missing, fetch it
    let finalProjectTitle = projectTitle;
    if (projectId && !projectTitle) {
      try {
        const project = await (mongoose as any).model('Project').findById(projectId).select('title');
        if (project) {
          finalProjectTitle = (project as any).title;
        }
      } catch {}
    }

    const normalizedDocumentUrls = Array.isArray(documentUrls)
      ? documentUrls
          .map((u: any) => (typeof u === 'string' ? { url: u } : u))
          .filter((u: any) => u && u.url)
      : undefined;

    const updateData: Record<string, any> = {};
    if (typeof title !== 'undefined') updateData.title = title;
    if (typeof description !== 'undefined') updateData.description = description;
    if (typeof startDate !== 'undefined') updateData.startDate = startDate;
    if (typeof endDate !== 'undefined') updateData.endDate = endDate;
    if (typeof documentUrl !== 'undefined') updateData.documentUrl = documentUrl;
    if (typeof documentType !== 'undefined') updateData.documentType = documentType;
    if (projectId) updateData.projectId = projectId;
    if (finalProjectTitle) updateData.projectTitle = finalProjectTitle;
    if (typeof status !== 'undefined') updateData.status = status;
    if (normalizedDocumentUrls) updateData.documentUrls = normalizedDocumentUrls;

    const updatedTask = await Task.findByIdAndUpdate(
      params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedTask) {
      return NextResponse.json({ message: "Task not found" }, { status: 404 });
    }

    const obj: any = updatedTask.toObject();
    if (!obj.documentUrls && obj.documentUrl) {
      obj.documentUrls = [{ url: obj.documentUrl }];
    }

    return NextResponse.json(obj, { status: 200 });
  } catch (error) {
    console.error("Error patching task:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

// PUT: Update a task by ID
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  await dbConnect();
  try {
    const body = await req.json();
    const { 
      title, 
      description, 
      startDate, 
      endDate, 
      documentUrl, 
      documentType,
      projectId,
      projectTitle,
      status,
      documentUrls
    } = body;

    // If projectId is being updated, ensure we have the latest project title
    let finalProjectTitle = projectTitle;
    if (projectId && !projectTitle) {
      const project = await mongoose.model('Project').findById(projectId).select('title');
      if (project) {
        finalProjectTitle = (project as any).title;
      }
    }

    const normalizedDocumentUrls = Array.isArray(documentUrls)
      ? documentUrls.map((u: any) => (typeof u === 'string' ? { url: u } : u)).filter((u: any) => u && u.url)
      : undefined;

    const updateData: Record<string, any> = {
      title,
      description,
      startDate,
      endDate,
      documentUrl,
      documentType,
      ...(projectId && { projectId }),
      ...(finalProjectTitle && { projectTitle: finalProjectTitle }),
      ...(status && { status }),
      ...(normalizedDocumentUrls ? { documentUrls: normalizedDocumentUrls } : {}),
    };

    const updatedTask = await Task.findByIdAndUpdate(
      params.id, 
      updateData, 
      { new: true, runValidators: true }
    );
    
    if (!updatedTask) {
      return NextResponse.json({ message: "Task not found" }, { status: 404 });
    }

    const obj: any = updatedTask.toObject();
    if (!obj.documentUrls && obj.documentUrl) {
      obj.documentUrls = [{ url: obj.documentUrl }];
    }

    return NextResponse.json(obj, { status: 200 });
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE: Delete a task by ID
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  await dbConnect();
  try {
    const deletedTask = await Task.findByIdAndDelete(params.id);
    if (!deletedTask) {
      return NextResponse.json({ message: "Task not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "Task deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
