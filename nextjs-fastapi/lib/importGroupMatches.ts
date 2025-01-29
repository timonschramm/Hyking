import { ac, as } from '@faker-js/faker/dist/airline-BnpeTvY9'
import { PrismaClient } from '@prisma/client'
import { create } from 'domain'

const prisma = new PrismaClient()

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

    console.log(`Created group match: ${groupMatch.id} with chat room: ${groupMatch.chatRoom?.id}`)
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
    
    console.log(`Created chat room: ${updatedChatRoom.id} for match: ${matchId}`)
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
  const activities = await prisma.activity.findMany({
    where: {
      // Ensure it's not closed and suitable for the current season
      isClosed: false,
    },
    orderBy: {
      id: 'asc' // Just to ensure consistent results
    }
  });

  
  const closestActivities = activities.sort((a, b) => Math.abs(a.experienceRating - avgExperience) - Math.abs(b.experienceRating - avgExperience)).slice(0, 10); 
  return closestActivities[Math.floor(Math.random() * closestActivities.length)]
}


async function importGroupMatches() {
  try {
    console.log('Starting group matches import...')
    
    // Get all profiles that have completed onboarding
    const profiles = await prisma.profile.findMany({
      where: {
        onboardingCompleted: true,
        age: { not: null }
      }
    })

    if (profiles.length < 3) {
      console.log('Not enough profiles to create group matches')
      return
    }

    // Find compatible groups
    const compatibleGroups = await findCompatibleProfiles(profiles)
    console.log(`Found ${compatibleGroups.length} compatible groups`)

    let successCount = 0
    let failureCount = 0

    // Create group matches
    for (const group of compatibleGroups) {
      try {
        // Find a suitable activity for the group
        const activity = await findSuitableActivity(group)
        if (!activity) {
          console.log('No suitable activity found for group')
          continue
        }

        // Create the group match
        const groupMatch = await createGroupMatch(group, activity)
        if (groupMatch) {
          console.log(`✅ Created group match for activity: ${activity.title} with ${group.length} members`)
          successCount++
        } else {
          failureCount++
        }
      } catch (error: any) {
        console.error(`❌ Error creating group match: ${error.message}`)
        failureCount++
      }
    }

    console.log('\n=== Import Summary ===')
    console.log(`✅ Successfully created: ${successCount} group matches`)
    console.log(`❌ Failed to create: ${failureCount} group matches`)
    console.log('=====================\n')

  } catch (error) {
    console.error('Fatal error during import:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}
/*
// Execute the import
importGroupMatches()
  .catch(console.error) 
*/
export async function findMatchChain() {
  const matches = await prisma.usersOnMatch.findMany(
    {
      select: {
        matchId: true,
        userId: true,
      }
    }
  );
  const connectionMap: Map<string, Set<string>> = new Map<string, Set<string>>();

  matches.forEach(match => {
    if (!connectionMap.has(match.userId)) {
      connectionMap.set(match.userId, new Set());
    }
  });

  const matchGroups = matches.reduce((groups, match) => {
    if (!groups[match.matchId]) groups[match.matchId] = [];
    groups[match.matchId].push(match.userId);
    return groups;
  }, {} as Record<string, string[]>);

  Object.values(matchGroups).forEach(users => {
    if (users.length === 2) {
      connectionMap.get(users[0])?.add(users[1]);
      connectionMap.get(users[1])?.add(users[0]);
    }
  });

  function findChainWithinRange(
    currentUser: string,
    visited: Set<string>,
    chain: string[],
    result: string[][],
  ) {
    // Überspringe Nutzer, die schon in der Kette sind
    if (visited.has(currentUser)) {
      return;
    }

    // Nutzer zur Kette und zu den besuchten hinzufügen
    const newChain = [...chain, currentUser];
    const newVisited = new Set(visited);
    newVisited.add(currentUser);

    // Wenn die Kette zwischen 3 und 6 Nutzer enthält, speichern
    if (newChain.length >= 4 && newChain.length <= 6) {
      result.push(newChain);
    }

    // Abbrechen, wenn die Kette die maximale Länge erreicht hat
    if (newChain.length === 6) {
      return;
    }

    // Verbindungen des aktuellen Nutzers durchgehen
    const connections = Array.from(connectionMap.get(currentUser) || new Set<string>());
    for (const nextUser of connections) {
      findChainWithinRange(nextUser, newVisited, newChain, result);
    }
  }

  // Alle Nutzer IDs iterieren und Chains finden
  const userIds = Array.from(connectionMap.keys());
  const allChains: string[][] = [];

  for (const userId of userIds) {
    findChainWithinRange(userId, new Set(), [], allChains);
  }

  // Doppelte Chains entfernen
  const uniqueChains: string[][] = Array.from(
    new Set(allChains.map((chain) => JSON.stringify(chain))),
  ).map((chain) => JSON.parse(chain));

  return uniqueChains;
}

async function getGroupSkillEmbedding(group: Array<string>){

  const minmaxValues = {
    Distance: { min: 1, max: 10 },
    Experience: { min: 1, max: 10 },
    Pace: { min: 1, max: 10 },
  }

  const normalize = (val:number, min:number, max:number) => (val-min) / (max-min)


  const skills = await Promise.all(
    group.map(async (user_id) => {
      const userSkills = await prisma.userSkill.findMany({
        where: {
          profileId: user_id,
          skill: {
            displayName: {
              not: "Transportation", // Alle Skills außer "Car"
            },
          },
        },
        select: {
          skillLevel: {
            select: {
              numericValue: true, // Nur den numerischen Wert des SkillLevels holen
            },
          },
        },
        orderBy: {
          skill: {
            name: "asc"  // Values come back in order Distance, Experience, Pace
          }
        }
      });

      // Extrahiere die numericValues für den aktuellen User
      const numericValues = userSkills
        .map((userSkill) => userSkill.skillLevel?.numericValue || 0);

        const normalizedValues = numericValues.map((value, index) => {
          if (index === 0) {
            // Distance
            const { min, max } = minmaxValues.Distance;
            return normalize(value, min, max);
          } else if (index === 1) {
            // Experience
            const { min, max } = minmaxValues.Experience;
            return normalize(value, min, max);
          } else {
            // Pace
            const { min, max } = minmaxValues.Pace;
            return normalize(value, min, max);
          } 
        });

      return normalizedValues
    })
  );

  const sums = Array(3).fill(0);

  // Summiere die Werte für jede Dimension
  skills.forEach((array) => {
    array.forEach((value, index) => {
      sums[index] += value;
    });
  });

  // Berechne den Mittelwert für jede Dimension
  const groupSkillEmbedding = sums.map((sum) => sum / skills.length);

  return groupSkillEmbedding;

}


export async function getHikeEmbeddings(){

  const allHikes = await prisma.activity.findMany();

  const normalize = (val:number, min:number, max:number) => (val-min) / (max-min)

  const minmaxValues = {
    length: { min: 92, max: 480886 },
    ascent: { min: 0, max: 9910 },
    descent: { min: 0, max: 10551 },
    staminaRating: {min: 0, max: 6},
    durationMin: { min: 1, max: 17015 },
    experienceRating: { min: 0, max: 6 },
    difficulty: { min: 0, max: 3 },
  }

  const hikesWithScore: [number, number[]][] = allHikes.map((hike) => {

    const distanceScore = normalize(hike.length, minmaxValues.length.min, minmaxValues.length.max);
    const experienceScore = normalize((hike.experienceRating + hike.difficulty) / 2,
      minmaxValues.experienceRating.min,
      minmaxValues.experienceRating.max);
    const paceScore = normalize(hike.durationMin, minmaxValues.durationMin.min,  minmaxValues.durationMin.max);
    return [hike.id, [distanceScore, experienceScore, paceScore]]
  })
  return hikesWithScore;
}

function cosineSimilarity(A: number[], B: number[]): number {
  const dotProduct = A.reduce((sum, a, index) => sum + a * B[index], 0);
  const magnitudeA = Math.sqrt(A.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(B.reduce((sum, b) => sum + b * b, 0));

  return dotProduct / (magnitudeA * magnitudeB);
}

async function findHikeForGroup(group: Array<string>){
  const groupSkillEmbedding = await getGroupSkillEmbedding(group);
  const hikeEmbeddings: [number, number[]][] = await getHikeEmbeddings();

  const simScoresHikes = hikeEmbeddings.map(([hikeID, hikeScore]) => {

    const simScore = cosineSimilarity(groupSkillEmbedding, hikeScore)

    return [hikeID, simScore];
  })

  simScoresHikes.sort((a,b) => b[1] - a[1])

  // A random of the top 5 hikes is selected
  const rand = Math.floor(Math.random() * 6);
  const hikeId = simScoresHikes[rand][0]
  
  const hikeDesc = await prisma.activity.findFirst({
    where: {
      id: hikeId,
    },
    select: {
      title: true,
    }
  })

  return [hikeId, hikeDesc?.title];
}

async function checkGroupMatchExist(group: Array<string>) {
  const groupMatches = await prisma.profileOnGroupSuggestion.findMany({
    where: {
      profileId: {
        in: group,
      },
    },
    select: {
      profileId: true,
      groupMatchId: true,
    },
  });

  const userGroupsMap = new Map();

  groupMatches.forEach(({profileId, groupMatchId}) => {
    if (userGroupsMap.has(profileId)){
      userGroupsMap.get(profileId).add(groupMatchId);
    }
    else {
      userGroupsMap.set(profileId, new Set([groupMatchId]));
    }
  });

   const allMatchIds = Array.from(userGroupsMap.values());

   if (allMatchIds.length < group.length) return false;

   let intersection = allMatchIds[0];

   for (let i = 1; i < allMatchIds.length; i++) {
    intersection = new Set([...intersection].filter(x => allMatchIds[i].has(x)));
  }
  if (intersection.size === 0) return false;
  else return true;
}

export async function generateGroupMatches() {
  const possibleGroups = await findMatchChain();

  const userGroups = [];
  
  for (const group of possibleGroups) {
    const result = await checkGroupMatchExist(group);
    if (!result) { 
      const hikeSuggestion = await findHikeForGroup(group); 
      const success = await createGroupMatchNew(group, hikeSuggestion[0], hikeSuggestion[1])
    }
  }

 
}

async function createGroupMatchNew(profileIds: any[], activityId: any, activityTitle: any) {
  try {
    // Create the GroupMatch with chat room
    const groupMatch = await prisma.groupMatch.create({
      data: {
        description: `Group hiking suggestion for ${activityTitle}`,
        hikeSuggestions: {
          connect: [{ id: activityId }]
        },
        profiles: {
          create: profileIds.map(profileId => ({
            profileId: profileId,
          }))
        },
        chatRoom: {
          create: {
            participants: {
              create: profileIds.map(profileId => ({
                profileId: profileId,
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

    console.log(`Created group match: ${groupMatch.id} with chat room: ${groupMatch.chatRoom?.id}`)
    return groupMatch
  } catch (error) {
    console.error('Error creating group match:', error)
    return null
  }
}