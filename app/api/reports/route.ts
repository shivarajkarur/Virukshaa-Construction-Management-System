import { NextResponse } from 'next/server';
import connectToDB from '@/lib/db';
import Report from '@/models/Report';

// GET /api/reports - Get all reports or filter by type
// POST /api/reports - Create a new report

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as 'client' | 'supervisor' | 'employee' | 'supplier' | null;
    const search = searchParams.get('search') || '';
    const supervisorId = searchParams.get('supervisorId') || '';
    const role = searchParams.get('role') || '';

    await connectToDB();

    const query: any = {};
    if (type) query.type = type;
    // Only filter by supervisorId if not an admin
    if (supervisorId && role !== 'admin') query.supervisorId = supervisorId;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }

    const reports = await Report.find(query)
      .sort({ date: -1 })
      .lean();

    return NextResponse.json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await connectToDB();
    const reportData = await request.json();

    // Basic validation (title + type are required; content optional for supervisor daily reports)
    if (!reportData?.title || !reportData?.type) {
      return NextResponse.json(
        { error: 'Title and type are required' },
        { status: 400 }
      );
    }

    // Normalize fields
    const payload: any = {
      ...reportData,
      date: reportData.date ? new Date(reportData.date) : new Date()
    };
    // Remove deprecated field if sent by older clients
    if ('taskProgress' in payload) delete payload.taskProgress;

    const doc = await Report.create(payload);
    const json = doc.toObject ? doc.toObject() : doc;
    return NextResponse.json(json, { status: 201 });
  } catch (error: any) {
    console.error('Error creating report:', error);
    // Validation errors
    if (error?.name === 'ValidationError') {
      const messages = Object.values(error.errors || {}).map((e: any) => e.message);
      return NextResponse.json({ error: messages.join(', ') || 'Validation failed' }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Failed to create report' },
      { status: 500 }
    );
  }
}
