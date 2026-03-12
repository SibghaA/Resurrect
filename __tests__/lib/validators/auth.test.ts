import { registerSchema, loginSchema } from '@/lib/validators/auth'

describe('registerSchema', () => {
  it('accepts valid email and password', () => {
    const result = registerSchema.safeParse({ email: 'user@example.com', password: 'password123' })
    expect(result.success).toBe(true)
  })

  it('rejects invalid email', () => {
    const result = registerSchema.safeParse({ email: 'not-an-email', password: 'password123' })
    expect(result.success).toBe(false)
    expect(result.error?.errors[0].message).toBe('Invalid email address')
  })

  it('rejects password shorter than 8 characters', () => {
    const result = registerSchema.safeParse({ email: 'user@example.com', password: 'short' })
    expect(result.success).toBe(false)
    expect(result.error?.errors[0].message).toBe('Password must be at least 8 characters')
  })

  it('rejects missing fields', () => {
    expect(registerSchema.safeParse({}).success).toBe(false)
    expect(registerSchema.safeParse({ email: 'a@b.com' }).success).toBe(false)
  })
})

describe('loginSchema', () => {
  it('accepts valid email and password', () => {
    const result = loginSchema.safeParse({ email: 'user@example.com', password: 'any' })
    expect(result.success).toBe(true)
  })

  it('rejects invalid email', () => {
    const result = loginSchema.safeParse({ email: 'bad', password: 'pass' })
    expect(result.success).toBe(false)
  })

  it('rejects empty password', () => {
    const result = loginSchema.safeParse({ email: 'user@example.com', password: '' })
    expect(result.success).toBe(false)
    expect(result.error?.errors[0].message).toBe('Password is required')
  })
})
