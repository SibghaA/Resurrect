import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { getProjectById } from '@/lib/db/project'
import { getMicroTaskById, updateMicroTask } from '@/lib/db/micro-task'
import { microTaskUpdateSchema } from '@/lib/validators/micro-task'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; taskId: string } }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const project = await getProjectById(params.id, session.sub)
  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  const task = await getMicroTaskById(params.taskId, project.id)
  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  }

  const body: unknown = await req.json()
  const result = microTaskUpdateSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 })
  }

  const updated = await updateMicroTask(task.id, result.data)
  return NextResponse.json(updated)
}
