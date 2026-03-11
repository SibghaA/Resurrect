import type { AITask } from '@/lib/validators/micro-task'

type DomainBucket = 'App' | 'Writing' | 'Music' | 'Art' | 'Other'

const TEMPLATE_NOTE =
  '(This is a template task — generate AI tasks once the AI engine is available for personalised suggestions.)'

function getBucket(domain: string): DomainBucket {
  const d = domain.toLowerCase()
  if (d.includes('app') || d.includes('web') || d.includes('software') || d.includes('code') || d.includes('dev')) {
    return 'App'
  }
  if (d.includes('writ') || d.includes('blog') || d.includes('book') || d.includes('essay')) {
    return 'Writing'
  }
  if (d.includes('music') || d.includes('song') || d.includes('album') || d.includes('podcast')) {
    return 'Music'
  }
  if (d.includes('art') || d.includes('design') || d.includes('illustrat') || d.includes('photo')) {
    return 'Art'
  }
  return 'Other'
}

const TEMPLATES: Record<DomainBucket, AITask[]> = {
  App: [
    { task_id: 1, title: 'Define the milestone scope', description: `Write a bullet list of exactly what "done" looks like for this milestone. Keep it to 3–5 items. ${TEMPLATE_NOTE}`, estimated_minutes: 10, category: 'docs', dependencies: [] },
    { task_id: 2, title: 'Sketch the component or data model', description: `Draw a rough diagram or write pseudocode for the main component / model involved. ${TEMPLATE_NOTE}`, estimated_minutes: 10, category: 'design', dependencies: [1] },
    { task_id: 3, title: 'Set up the project environment', description: `Ensure local dev server runs and you can hot-reload. Install any missing dependencies. ${TEMPLATE_NOTE}`, estimated_minutes: 10, category: 'setup', dependencies: [] },
    { task_id: 4, title: 'Implement the core logic', description: `Write the minimal working implementation for this milestone — no polish yet. ${TEMPLATE_NOTE}`, estimated_minutes: 30, category: 'code', dependencies: [2, 3] },
    { task_id: 5, title: 'Wire up the UI', description: `Connect the logic to its UI surface. Check that data flows correctly end-to-end. ${TEMPLATE_NOTE}`, estimated_minutes: 20, category: 'code', dependencies: [4] },
    { task_id: 6, title: 'Test and fix edge cases', description: `Manually test at least 3 different inputs / states. Fix any obvious issues you find. ${TEMPLATE_NOTE}`, estimated_minutes: 15, category: 'test', dependencies: [5] },
    { task_id: 7, title: 'Update documentation', description: `Add or update the README section related to this milestone. ${TEMPLATE_NOTE}`, estimated_minutes: 10, category: 'docs', dependencies: [6] },
  ],
  Writing: [
    { task_id: 1, title: 'Revisit your outline', description: `Re-read your existing outline and mark which sections are paused. Adjust the order if needed. ${TEMPLATE_NOTE}`, estimated_minutes: 10, category: 'research', dependencies: [] },
    { task_id: 2, title: 'Write a one-paragraph summary of this milestone', description: `Summarise what you want to say in this section in one paragraph, no editing. ${TEMPLATE_NOTE}`, estimated_minutes: 10, category: 'docs', dependencies: [1] },
    { task_id: 3, title: 'Draft the opening section', description: `Write the first 200–300 words of this milestone's section. Don't self-edit as you write. ${TEMPLATE_NOTE}`, estimated_minutes: 20, category: 'docs', dependencies: [2] },
    { task_id: 4, title: 'Draft the body', description: `Continue writing until the section feels complete. Aim for progress, not perfection. ${TEMPLATE_NOTE}`, estimated_minutes: 30, category: 'docs', dependencies: [3] },
    { task_id: 5, title: 'Revise for clarity', description: `Read back what you wrote and remove anything redundant. Tighten sentences. ${TEMPLATE_NOTE}`, estimated_minutes: 15, category: 'refactor', dependencies: [4] },
    { task_id: 6, title: 'Add sources or references', description: `Link or cite any facts, quotes, or research you used. ${TEMPLATE_NOTE}`, estimated_minutes: 10, category: 'research', dependencies: [5] },
  ],
  Music: [
    { task_id: 1, title: 'Listen back to existing material', description: `Play through everything you have so far. Take notes on what feels paused and what feels strong. ${TEMPLATE_NOTE}`, estimated_minutes: 10, category: 'research', dependencies: [] },
    { task_id: 2, title: 'Sketch a chord progression or melody', description: `Record a rough voice memo or MIDI sketch for this milestone. Don't aim for perfect — capture an idea. ${TEMPLATE_NOTE}`, estimated_minutes: 15, category: 'design', dependencies: [1] },
    { task_id: 3, title: 'Develop the arrangement', description: `Add at least two more instrument layers to the sketch. Focus on the feel, not the mix. ${TEMPLATE_NOTE}`, estimated_minutes: 20, category: 'code', dependencies: [2] },
    { task_id: 4, title: 'Record or program the performance', description: `Capture the final takes for this section. Do multiple takes and pick the best. ${TEMPLATE_NOTE}`, estimated_minutes: 30, category: 'setup', dependencies: [3] },
    { task_id: 5, title: 'Rough mix', description: `Balance levels and panning so the milestone section is listenable. ${TEMPLATE_NOTE}`, estimated_minutes: 15, category: 'fix', dependencies: [4] },
  ],
  Art: [
    { task_id: 1, title: 'Define the visual goal', description: `Write 3–5 words that describe the feeling you want this piece to convey. Pin a single reference image. ${TEMPLATE_NOTE}`, estimated_minutes: 10, category: 'research', dependencies: [] },
    { task_id: 2, title: 'Thumbnail sketches', description: `Draw 3 rough thumbnail compositions. Choose one to develop further. ${TEMPLATE_NOTE}`, estimated_minutes: 15, category: 'design', dependencies: [1] },
    { task_id: 3, title: 'Block in main shapes and values', description: `Work in greyscale or flat colour. Establish the main forms without detail. ${TEMPLATE_NOTE}`, estimated_minutes: 20, category: 'design', dependencies: [2] },
    { task_id: 4, title: 'Add colour or texture layer', description: `Apply your colour palette or texture pass on top of the base. ${TEMPLATE_NOTE}`, estimated_minutes: 20, category: 'design', dependencies: [3] },
    { task_id: 5, title: 'Refine details and edges', description: `Spend one focused session on detail work in the most important focal area only. ${TEMPLATE_NOTE}`, estimated_minutes: 20, category: 'fix', dependencies: [4] },
    { task_id: 6, title: 'Export and document', description: `Save the final file, export at the target resolution, and note the tools used. ${TEMPLATE_NOTE}`, estimated_minutes: 10, category: 'docs', dependencies: [5] },
  ],
  Other: [
    { task_id: 1, title: 'Write a "done" definition', description: `In 2–3 bullet points, define what completing this milestone looks like. ${TEMPLATE_NOTE}`, estimated_minutes: 10, category: 'docs', dependencies: [] },
    { task_id: 2, title: 'Break the goal into sub-goals', description: `List at least 3 distinct steps needed to reach the milestone. ${TEMPLATE_NOTE}`, estimated_minutes: 10, category: 'research', dependencies: [1] },
    { task_id: 3, title: 'Tackle the first sub-goal', description: `Work on the first item from your sub-goal list without stopping to plan further. ${TEMPLATE_NOTE}`, estimated_minutes: 20, category: 'setup', dependencies: [2] },
    { task_id: 4, title: 'Tackle the second sub-goal', description: `Continue with the second item from your sub-goal list. ${TEMPLATE_NOTE}`, estimated_minutes: 20, category: 'setup', dependencies: [3] },
    { task_id: 5, title: 'Review progress', description: `Read back everything you have done so far. Note what still needs attention. ${TEMPLATE_NOTE}`, estimated_minutes: 10, category: 'test', dependencies: [4] },
    { task_id: 6, title: 'Finish remaining sub-goals', description: `Complete any remaining items from your list, one at a time. ${TEMPLATE_NOTE}`, estimated_minutes: 25, category: 'setup', dependencies: [5] },
    { task_id: 7, title: 'Document the outcome', description: `Write 2–3 sentences about what you accomplished and what comes next. ${TEMPLATE_NOTE}`, estimated_minutes: 10, category: 'docs', dependencies: [6] },
  ],
}

export function generateFallbackTasks(domain: string): AITask[] {
  const bucket = getBucket(domain)
  return TEMPLATES[bucket]
}
