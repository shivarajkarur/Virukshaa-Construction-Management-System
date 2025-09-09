import { NextRequest, NextResponse } from 'next/server'
import connectToDB from '@/lib/db'
import AdminProfile from '@/models/AdminProfile'
import Supervisor from '@/models/Supervisor'
import Client from '@/models/ClientModel'

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export async function POST(req: Request) {
  try {
    const { email, username, identifier: idFromBody, password, role } = await req.json()
    const identifier: string | undefined = (idFromBody || username || email)?.trim()

    if (!identifier || !password) {
      return NextResponse.json(
        { error: 'Email or username and password are required' },
        { status: 400 }
      )
    }
    if (!role || !['superadmin', 'supervisor', 'client'].includes(role)) {
      return NextResponse.json(
        { error: 'Valid role is required' },
        { status: 400 }
      )
    }

    await connectToDB()

    const regex = new RegExp(`^${escapeRegExp(identifier)}$`, 'i')
    console.log('[auth/login] role:', role, 'identifier:', identifier)

    let user: any = null
    if (role === 'superadmin') {
      user = await AdminProfile.findOne({ $or: [{ email: regex }, { username: regex }] })
    } else if (role === 'supervisor') {
      user = await Supervisor.findOne({ $or: [{ email: regex }, { username: regex }] }).select('+password')
    } else if (role === 'client') {
      user = await Client.findOne({ $or: [{ email: regex }, { username: regex }] }).select('+password')
    }

    if (!user) {
      return NextResponse.json({ error: 'Invalid email/username or password' }, { status: 401 })
    }

    const stored = (user as any).password as string | undefined
    let ok = false
    
    ok = stored === password
    
    if (!ok) {
      return NextResponse.json({ error: 'Invalid email/username or password' }, { status: 401 })
    }

    const obj = user.toObject?.() ?? user
    delete (obj as any).password
    // Normalize common fields
    const safe = {
      _id: obj._id,
      email: obj.email,
      username: obj.username,
      name: obj.adminName || obj.name,
      role,
    }

    return NextResponse.json({ success: true, user: safe })
  } catch (error) {
    console.error('Unified login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
