import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { contextSnapshotSchema } from '@/lib/validators/project'
import { getProjectById, updateContextSnapshot } from '@/lib/db/project'

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const project = await getProjectById(params.id, session.sub)
  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  const body: unknown = await req.json()
  const result = contextSnapshotSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 })
  }

  const updated = await updateContextSnapshot(params.id, result.data)
  return NextResponse.json(updated)
}
