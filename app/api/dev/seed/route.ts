import { NextResponse } from 'next/server'
import connectToDB from '@/lib/db'
import AdminProfile from '@/models/AdminProfile'
import Supervisor from '@/models/Supervisor'
import Client from '@/models/ClientModel'
import bcrypt from 'bcryptjs'

export async function POST() {
  try {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Disabled in production' }, { status: 403 })
    }

    await connectToDB()

    const password = 'Passw0rd!'
    const hashed = await bcrypt.hash(password, 10)

    // Upsert Admin
    const admin = await AdminProfile.findOneAndUpdate(
      { $or: [{ email: 'admin1@example.com' }, { username: 'admin1' }] },
      {
        companyName: 'Demo Co',
        adminName: 'Admin One',
        email: 'admin1@example.com',
        username: 'admin1',
        password: hashed,
      },
      { new: true, upsert: true }
    )

    // Upsert Supervisor
    const supervisor = await Supervisor.findOneAndUpdate(
      { $or: [{ email: 'sup1@example.com' }, { username: 'sup1' }] },
      {
        name: 'Supervisor One',
        email: 'sup1@example.com',
        username: 'sup1',
        password: hashed,
      } as any,
      { new: true, upsert: true }
    )

    // Upsert Client
    const client = await Client.findOneAndUpdate(
      { $or: [{ email: 'client1@example.com' }, { username: 'client1' }] },
      {
        name: 'Client One',
        email: 'client1@example.com',
        username: 'client1',
        password: hashed,
      } as any,
      { new: true, upsert: true }
    )

    return NextResponse.json({
      success: true,
      message: 'Seeded users (admin1, sup1, client1) with password Passw0rd! (dev only)'.trim(),
      users: {
        admin: { id: admin._id, email: admin.email, username: admin.username },
        supervisor: { id: supervisor._id, email: supervisor.email, username: supervisor.username },
        client: { id: client._id, email: client.email, username: client.username },
      },
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
