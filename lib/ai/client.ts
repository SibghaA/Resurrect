import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function generateCompletion(
  system: string,
  user: string
): Promise<string> {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system,
    messages: [{ role: 'user', content: user }],
  })

  const block = message.content[0]
  if (block.type !== 'text') {
    throw new Error('Unexpected response type from AI')
  }

  return block.text
}
