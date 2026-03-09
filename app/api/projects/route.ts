import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { projectSchema } from '@/lib/validators/project'
import { createProject, getProjectsByUserId } from '@/lib/db/project'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body: unknown = await req.json()
  const result = projectSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 })
  }

  const project = await createProject(session.sub, result.data)
  return NextResponse.json(project, { status: 201 })
}

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const projects = await getProjectsByUserId(session.sub)
  return NextResponse.json(projects)
}
