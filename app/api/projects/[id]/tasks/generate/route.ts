import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { getProjectById } from '@/lib/db/project'
import { microTaskGenerateSchema } from '@/lib/validators/micro-task'
import { generateMicroTasks } from '@/lib/ai/micro-task-engine'
import { getMicroTasksByProject } from '@/lib/db/micro-task'

export async function POST(
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
  const result = microTaskGenerateSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 })
  }

  try {
    await generateMicroTasks(
      project,
      result.data.targetMilestone,
      result.data.timeAvailability
    )

    const tasks = await getMicroTasksByProject(project.id)
    return NextResponse.json({ tasks }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to generate tasks'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
