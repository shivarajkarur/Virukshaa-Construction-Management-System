import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Task from "@/models/Task";
import Project from "@/models/ProjectModel";
import mongoose from "mongoose";

// GET /api/tasks?supervisorId=...
export async function GET(req: NextRequest) {
  await dbConnect();
  try {
    const { searchParams } = new URL(req.url);
    const supervisorId = searchParams.get('supervisorId');

    if (!supervisorId) {
      return NextResponse.json(
        { message: "supervisorId is required" },
        { status: 400 }
      );
    }

    if (!mongoose.isValidObjectId(supervisorId)) {
      return NextResponse.json(
        { message: "Invalid supervisorId" },
        { status: 400 }
      );
    }

    const tasks = await Task.find({ assignedTo: supervisorId })
      // Populate only safe, non-payment project fields
      .populate('projectId', 'title startDate endDate address city state postalCode')
      .sort({ createdAt: -1 });

    // Backward compatibility: if legacy documentUrl exists and documentUrls is missing, mirror it
    const normalized = tasks.map((t: any) => {
      if (!t.documentUrls && t.documentUrl) {
        t.documentUrls = [{ url: t.documentUrl }];
      }
      return t;
    });

    return NextResponse.json(normalized);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// POST /api/tasks
export async function POST(req: NextRequest) {
  await dbConnect();
  try {
    const contentType = req.headers.get('content-type') || ''
    let payload: any = {}
    if (contentType.includes('multipart/form-data')) {
      const form = await req.formData()
      const getStr = (k: string) => {
        const v = form.get(k)
        return typeof v === 'string' ? v : undefined
      }
      payload = {
        title: getStr('title'),
        description: getStr('description'),
        startDate: getStr('startDate'),
        endDate: getStr('endDate'),
        documentUrl: getStr('documentUrl'),
        // Accept JSON stringified array for documentUrls in multipart too
        documentUrls: (() => {
          const raw = getStr('documentUrls');
          if (!raw) return undefined;
          try {
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : undefined;
          } catch {
            return undefined;
          }
        })(),
        documentType: getStr('documentType'),
        projectId: getStr('projectId'),
        projectTitle: getStr('projectTitle'),
        supervisorId: getStr('supervisorId'),
        status: getStr('status') || 'Pending',
      }
    } else {
      payload = await req.json()
    }

    const { 
      title, 
      description, 
      startDate, 
      endDate, 
      documentUrl, 
      documentType,
      projectId,
      projectTitle,
      supervisorId,
      status = 'Pending',
      documentUrls
    } = payload;

    if (!title || !supervisorId) {
      return NextResponse.json(
        { message: "Title and supervisorId are required" }, 
        { status: 400 }
      );
    }

    if (!mongoose.isValidObjectId(supervisorId)) {
      return NextResponse.json(
        { message: "Invalid supervisorId" },
        { status: 400 }
      );
    }

    if (projectId && projectId !== '' && !mongoose.isValidObjectId(projectId)) {
      return NextResponse.json(
        { message: "Invalid projectId" },
        { status: 400 }
      );
    }

    // If projectTitle is not provided but projectId is, fetch it safely
    let finalProjectTitle = projectTitle;
    if (projectId && !projectTitle) {
      try {
        const project = await Project.findById(projectId).select('title');
        if (project) {
          finalProjectTitle = project.title as string;
        }
      } catch (_) {
        // ignore lookup errors; allow task creation without project title
      }
    }

    const normalizedDocumentUrls = Array.isArray(documentUrls)
      ? documentUrls.map((u: any) => (typeof u === 'string' ? { url: u } : u)).filter((u: any) => u && u.url)
      : undefined;

    const newTask = new Task({
      title,
      description,
      startDate,
      endDate,
      // Keep legacy single URL when provided
      documentUrl,
      // New multi-attachments
      ...(normalizedDocumentUrls ? { documentUrls: normalizedDocumentUrls } : {}),
      documentType,
      projectId: projectId || undefined,
      projectTitle: finalProjectTitle,
      assignedTo: supervisorId, // Store as assignedTo in the database
      status
    });

    await newTask.save();

    return NextResponse.json(newTask, { status: 201 });
  } catch (error: any) {
    console.error("Error creating task:", error);
    // Handle validation errors from Mongoose explicitly
    if (error?.name === 'ValidationError') {
      const details = Object.values(error.errors || {}).map((e: any) => e.message)
      return NextResponse.json(
        { message: "Validation Error", details },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { message: "Internal Server Error", error: error?.message || String(error) }, 
      { status: 500 }
    );
  }
}
