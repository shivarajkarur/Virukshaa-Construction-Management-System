import { NextResponse } from 'next/server'
import connectToDB from '@/lib/db'
import LoginCredential, { ILoginCredential, UserRole } from '@/models/LoginCredential'
import AdminProfile from '@/models/AdminProfile'
import Supervisor from '@/models/Supervisor'
import Client from '@/models/ClientModel'
import bcrypt from 'bcryptjs'

function isBcryptHash(val?: string): boolean {
  return !!val && (val.startsWith('$2a$') || val.startsWith('$2b$') || val.startsWith('$2y$'))
}

export async function POST() {
  try {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Disabled in production' }, { status: 403 })
    }

    await connectToDB()

    const upsert = async (
      role: UserRole,
      profile: any,
      fields: { email?: string; username?: string; name?: string },
      rawPassword?: string
    ) => {
      const email = fields.email?.toLowerCase()
      const username = fields.username?.toLowerCase()

      // Decide password to store: hash plaintext if needed
      let passwordToStore = rawPassword || ''
      if (!isBcryptHash(passwordToStore)) {
        passwordToStore = await bcrypt.hash(passwordToStore, 10)
      }

      // Build filter to upsert by either email+role or username+role
      const filter: any = { role }
      const or: any[] = []
      if (email) or.push({ email })
      if (username) or.push({ username })
      if (or.length === 0) return { skipped: true }
      filter.$or = or

      const update = {
        $set: {
          email,
          username,
          password: passwordToStore,
          role,
          profileId: profile._id,
          name: fields.name,
        },
      }

      const res = await LoginCredential.findOneAndUpdate(filter, update, { upsert: true, new: true, setDefaultsOnInsert: true })
      return { id: res._id }
    }

    let created = 0
    let updated = 0
    let skipped = 0

    // Admins
    const admins = await AdminProfile.find().select('+password')
    for (const a of admins) {
      const stored = (a as any).password ?? ''
      const result = await upsert('superadmin', a, {
        email: (a as any).email,
        username: (a as any).username,
        name: (a as any).adminName,
      }, stored)
      if ((result as any).skipped) skipped++
      else created++ // treat as created/updated; we don't differentiate here
    }

    // Supervisors
    const sups = await Supervisor.find().select('+password')
    for (const s of sups) {
      const stored = (s as any).password ?? ''
      const result = await upsert('supervisor', s, {
        email: (s as any).email,
        username: (s as any).username,
        name: (s as any).name,
      }, stored)
      if ((result as any).skipped) skipped++
      else created++
    }

    // Clients
    const clients = await Client.find().select('+password')
    for (const c of clients) {
      const stored = (c as any).password ?? ''
      const result = await upsert('client', c, {
        email: (c as any).email,
        username: (c as any).username,
        name: (c as any).name,
      }, stored)
      if ((result as any).skipped) skipped++
      else created++
    }

    return NextResponse.json({ success: true, createdOrUpdated: created, skipped })
  } catch (error) {
    console.error('[dev/backfill-credentials] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
