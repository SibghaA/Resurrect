let mockCreate: jest.Mock

jest.mock('@anthropic-ai/sdk', () => {
  mockCreate = jest.fn()
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      messages: { create: mockCreate },
    })),
  }
})

import { generateCompletion } from '@/lib/ai/client'

describe('generateCompletion', () => {
  it('returns the text from the first content block', async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: 'Hello from AI' }],
    })
    const result = await generateCompletion('system prompt', 'user message')
    expect(result).toBe('Hello from AI')
  })

  it('calls the Anthropic API with correct params', async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: 'ok' }],
    })
    await generateCompletion('sys', 'usr')
    expect(mockCreate).toHaveBeenCalledWith({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: 'sys',
      messages: [{ role: 'user', content: 'usr' }],
    })
  })

  it('throws when the first content block is not a text block', async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: 'tool_use', id: 'x', name: 'foo', input: {} }],
    })
    await expect(generateCompletion('sys', 'usr')).rejects.toThrow('Unexpected response type from AI')
  })
})
