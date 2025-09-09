import { NextRequest, NextResponse } from "next/server";
import connectToDB from "@/lib/db";
import Project, { IProject } from "@/models/ProjectModel";
import Task from "@/models/Task";

// GET /api/projects
export async function GET(req: NextRequest) {
  await connectToDB();
  try {
    const { searchParams } = new URL(req.url);
    const supervisorId = searchParams.get('supervisorId');
    const clientId = searchParams.get('clientId');

    // If supervisorId provided, filter projects where any embedded task is assigned to this supervisor
    if (supervisorId && supervisorId !== '') {
      // First, find distinct projectIds from Tasks assigned to this supervisor
      const projectIds = await Task.distinct('projectId', { assignedTo: supervisorId, projectId: { $ne: null } });
      if (!projectIds || projectIds.length === 0) {
        return NextResponse.json([]);
      }
      const projects = await Project.find({ _id: { $in: projectIds } }).sort({ createdAt: -1 });
      return NextResponse.json(projects);
    }

    // If clientId provided, return only that client's projects
    if (clientId && clientId !== '') {
      const projects = await Project.find({ clientId }).sort({ createdAt: -1 });
      return NextResponse.json(projects);
    }

    const projects = await Project.find().sort({ createdAt: -1 });
    return NextResponse.json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// POST /api/projects
export async function POST(req: NextRequest) {
  await connectToDB();
  try {
    const body = await req.json();
    const {
      title,
      description,
      address,
      city,
      state,
      postalCode,
      status = "Planning",
      startDate,
      endDate,
      budget,
      progress = 0,
      clientId,
      client,
      manager,
      tasks = [],
    } = body;

    if (!title || !description || !startDate || !endDate || !budget || !clientId) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    const newProject = new Project({
      title,
      description,
      address,
      city,
      state,
      postalCode,
      status,
      startDate,
      endDate,
      budget,
      progress,
      clientId,
      client,
      manager,
      tasks,
    });

    await newProject.save();
    return NextResponse.json(newProject, { status: 201 });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// PUT /api/projects/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  await connectToDB();
  try {
    const { id } = params;
    const body = await req.json();
    
    const updatedProject = await Project.findByIdAndUpdate(
      id,
      { 
        $set: {
          title: body.title,
          description: body.description,
          status: body.status,
          startDate: body.startDate,
          endDate: body.endDate,
          budget: body.budget,
          progress: body.progress,
          clientId: body.clientId,
          client: body.client,
          address: body.address,
          city: body.city,
          state: body.state,
          postalCode: body.postalCode,
          tasks: body.tasks,
        }
      },
      { new: true, runValidators: true }
    );

    if (!updatedProject) {
      return NextResponse.json(
        { message: "Project not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error("Error updating project:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  await connectToDB();
  try {
    const { id } = params;
    const deletedProject = await Project.findByIdAndDelete(id);

    if (!deletedProject) {
      return NextResponse.json(
        { message: "Project not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error("Error deleting project:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
