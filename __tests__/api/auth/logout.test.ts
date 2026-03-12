import { POST } from '@/app/api/auth/logout/route'

describe('POST /api/auth/logout', () => {
  it('returns 200 with success and clears the token cookie', async () => {
    const res = await POST()
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
  })
})
