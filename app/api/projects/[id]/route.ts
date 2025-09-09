import { NextRequest, NextResponse } from "next/server";
import connectToDB from "@/lib/db";
import Project from "@/models/ProjectModel";

// GET /api/projects/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  await connectToDB();
  try {
    const { id } = params;
    const project = await Project.findById(id);
    if (!project) {
      return NextResponse.json({ message: "Project not found" }, { status: 404 });
    }
    return NextResponse.json(project);
  } catch (error) {
    console.error("Error fetching project:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
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
          manager: body.manager,
        },
      },
      { new: true, runValidators: true }
    );

    if (!updatedProject) {
      return NextResponse.json({ message: "Project not found" }, { status: 404 });
    }

    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error("Error updating project:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE /api/projects/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  await connectToDB();
  try {
    const { id } = params;
    const deleted = await Project.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ message: "Project not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error("Error deleting project:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
