import { prisma } from '@/lib/prisma'

async function createGroupMatch(profiles: any[], activity: any) {
  try {
    // Create the GroupMatch with chat room
    const groupMatch = await prisma.groupMatch.create({
      data: {
        description: `Group hiking suggestion for ${activity.title}`,
        hikeSuggestions: {
          connect: [{ id: activity.id }]
        },
        profiles: {
          create: profiles.map(profile => ({
            profileId: profile.id,
          }))
        },
        chatRoom: {
          create: {
            participants: {
              create: profiles.map(profile => ({
                profileId: profile.id,
              }))
            }
          }
        }
      },
      include: {
        chatRoom: true,
        profiles: {
          include: {
            profile: true
          }
        }
      }
    })

  // console.log(`Created group match: ${groupMatch.id} with chat room: ${groupMatch.chatRoom?.id}`)
    return groupMatch
  } catch (error) {
    console.error('Error creating group match:', error)
    return null
  }
}

// Function to create a chat room for a regular match
async function createChatRoomForMatch(matchId: string, profileIds: string[]) {
  try {
    // Create chat room without any relations first
    const chatRoom = await prisma.chatRoom.create({
      data: {
        participants: {
          create: profileIds.map(profileId => ({
            profileId,
          }))
        }
      }
    })
    
    // Then update it with the match connection
    const updatedChatRoom = await prisma.chatRoom.update({
      where: { id: chatRoom.id },
      data: {
        matchId
      }
    })
    
  // console.log(`Created chat room: ${updatedChatRoom.id} for match: ${matchId}`)
    return updatedChatRoom
  } catch (error) {
    console.error('Error creating chat room:', error)
    return null
  }
}

async function findCompatibleProfiles(profiles: any[]) {
  // Group profiles based on compatibility
  const groups: any[] = []
  const usedProfiles = new Set()

  for (const profile of profiles) {
    if (usedProfiles.has(profile.id)) continue

    const compatibleGroup = [profile]
    usedProfiles.add(profile.id)

    // Find 2-3 more compatible profiles
    for (const otherProfile of profiles) {
      if (usedProfiles.has(otherProfile.id)) continue
      
      // Check compatibility based on:
      // 1. Age difference (within 5 years)
    //   const ageDiff = Math.abs((profile.age || 0) - (otherProfile.age || 0))
    //   if (ageDiff > 5) continue

    //   // 2. Similar skill levels
    //   const hasCompatibleSkills = await checkSkillCompatibility(profile, otherProfile)
    //   if (!hasCompatibleSkills) continue

    //   // 3. Similar interests
    //   const hasCommonInterests = await checkInterestCompatibility(profile, otherProfile)
    //   if (!hasCommonInterests) continue

      compatibleGroup.push(otherProfile)
      usedProfiles.add(otherProfile.id)

      // Limit group size to 3-4 people
      if (compatibleGroup.length >= 4) break
    }

    if (compatibleGroup.length >= 3) {
      groups.push(compatibleGroup)
    }
  }

  return groups
}

async function checkSkillCompatibility(profile1: any, profile2: any) {
  const skills1 = await prisma.userSkill.findMany({
    where: { profileId: profile1.id },
    include: { skillLevel: true }
  })
  
  const skills2 = await prisma.userSkill.findMany({
    where: { profileId: profile2.id },
    include: { skillLevel: true }
  })

  // Check if experience levels are similar
  const maxSkillDifference = 1
  for (const skill1 of skills1) {
    const matchingSkill = skills2.find(s => s.skillId === skill1.skillId)
    if (matchingSkill) {
      const difference = Math.abs(skill1.skillLevel.numericValue - matchingSkill.skillLevel.numericValue)
      if (difference > maxSkillDifference) return false
    }
  }

  return true
}

async function checkInterestCompatibility(profile1: any, profile2: any) {
  const interests1 = await prisma.userInterest.findMany({
    where: { profileId: profile1.id }
  })
  
  const interests2 = await prisma.userInterest.findMany({
    where: { profileId: profile2.id }
  })

  // Check if they share at least 2 interests
  const commonInterests = interests1.filter(i1 => 
    interests2.some(i2 => i2.interestId === i1.interestId)
  )

  return commonInterests.length >= 2
}

async function findSuitableActivity(group: any[]) {
  // Get the average experience level of the group
  const groupSkills = await Promise.all(
    group.map(profile => 
      prisma.userSkill.findMany({
        where: { profileId: profile.id },
        include: { skillLevel: true }
      })
    )
  )

  // Calculate average experience level
  const experienceSkills = groupSkills.flat().filter(skill => 
    skill.skillId.includes('EXPERIENCE')
  )
//   const avgExperience = experienceSkills.reduce((sum, skill) => 
//     sum + skill.skillLevel.numericValue, 0
//   ) / experienceSkills.length
  const avgExperience = 0;

  // Find a suitable activity based on group's average experience
  const activity = await prisma.activity.findFirst({
    where: {
      difficulty: {
        gte: Math.floor(avgExperience),
        lte: Math.ceil(avgExperience) + 10
      },
      // Ensure it's not closed and suitable for the current season
      isClosed: false,
    },
    orderBy: {
      id: 'asc' // Just to ensure consistent results
    }
  })

  return activity
}

async function importGroupMatches() {
  try {
  // console.log('Starting group matches import...')
    
    // Get all profiles that have completed onboarding
    const profiles = await prisma.profile.findMany({
      where: {
        onboardingCompleted: true,
        age: { not: null }
      }
    })

    if (profiles.length < 3) {
    // console.log('Not enough profiles to create group matches')
      return
    }

    // Find compatible groups
    const compatibleGroups = await findCompatibleProfiles(profiles)
  // console.log(`Found ${compatibleGroups.length} compatible groups`)

    let successCount = 0
    let failureCount = 0

    // Create group matches
    for (const group of compatibleGroups) {
      try {
        // Find a suitable activity for the group
        const activity = await findSuitableActivity(group)
        if (!activity) {
        // console.log('No suitable activity found for group')
          continue
        }

        // Create the group match
        const groupMatch = await createGroupMatch(group, activity)
        if (groupMatch) {
        // console.log(`✅ Created group match for activity: ${activity.title} with ${group.length} members`)
          successCount++
        } else {
          failureCount++
        }
      } catch (error: any) {
        console.error(`❌ Error creating group match: ${error.message}`)
        failureCount++
      }
    }

  // console.log('\n=== Import Summary ===')
  // console.log(`✅ Successfully created: ${successCount} group matches`)
  // console.log(`❌ Failed to create: ${failureCount} group matches`)
  // console.log('=====================\n')

  } catch (error) {
    console.error('Fatal error during import:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Execute the import
importGroupMatches()
  .catch(console.error) 