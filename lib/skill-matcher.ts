import { getUserById } from './db/user'
import { getActiveCoopListings } from './db/coop-listing'

export interface PersonalizedListing {
  // We'll intersect this with the Prisma return type in the UI, but we need these at minimum
  id: string
  userId: string
  description: string
  domainTags: string
  skillTagsHave: string
  skillTagsNeed: string
  timeCommitment: string
  milestonePreview: string
  status: string
  visibility: string
  active: boolean
  createdAt: Date
  updatedAt: Date
  project: { title: string; domain: string; status: string }
  user: { id: string; name: string | null; flakeRate: number }
  matchScore: number
}

export async function getPersonalizedListings(userId: string): Promise<PersonalizedListing[] | null> {
  const user = await getUserById(userId)
  if (!user) return null

  let userSkills: string[] = []
  try {
    userSkills = JSON.parse(user.skillTags) as string[]
  } catch {
    // ignore
  }

  // If the user has not added any skills to their profile, return null to trigger the "complete profile" prompt
  if (userSkills.length === 0) {
    return null
  }

  // Normalize user skills to lower case for comparison
  const normalizedUserSkills = new Set(userSkills.map((s) => s.toLowerCase().trim()))

  const activeListings = await getActiveCoopListings()

  const scoredListings: PersonalizedListing[] = []

  for (const listing of activeListings) {
    // Don't recommend a user's own listings to them
    if (listing.userId === userId) continue

    let neededSkills: string[] = []
    try {
      neededSkills = JSON.parse(listing.skillTagsNeed) as string[]
    } catch {
      // ignore
    }

    // Calculate exact matches
    let matchScore = 0
    for (const needed of neededSkills) {
      if (normalizedUserSkills.has(needed.toLowerCase().trim())) {
        matchScore++
      }
    }

    // Only include listings where at least 1 skill overlaps
    if (matchScore > 0) {
      scoredListings.push({
        ...listing,
        matchScore,
      })
    }
  }

  // Sort: primary = matchScore DESC, secondary = createdAt DESC
  scoredListings.sort((a, b) => {
    if (b.matchScore !== a.matchScore) {
      return b.matchScore - a.matchScore
    }
    return b.createdAt.getTime() - a.createdAt.getTime()
  })

  return scoredListings
}
