jest.mock('@/lib/auth/session')

import { POST } from '@/app/api/auth/logout/route'
import { clearSession } from '@/lib/auth/session'

const mockClearSession = clearSession as jest.MockedFunction<typeof clearSession>

describe('POST /api/auth/logout', () => {
  it('returns 200 with success', async () => {
    const res = await POST()
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
  })

  it('calls clearSession', async () => {
    await POST()
    expect(mockClearSession).toHaveBeenCalled()
  })
})
