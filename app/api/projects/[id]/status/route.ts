import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { statusUpdateSchema } from '@/lib/validators/project'
import { getProjectById, updateProjectStatus } from '@/lib/db/project'

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
  const result = statusUpdateSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 })
  }

  if (result.data.status === project.status) {
    return NextResponse.json({ error: 'Project is already in this status' }, { status: 400 })
  }

  await updateProjectStatus(
    params.id,
    project.status,
    result.data.status,
    result.data.notes
  )

  return NextResponse.json({ status: result.data.status })
}
