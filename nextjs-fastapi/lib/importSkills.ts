import { prisma } from '@/lib/prisma'

const skillsData = [
  {
    name: 'EXPERIENCE',
    displayName: 'Experience Level',
    levels: [
      { name: 'BEGINNER', displayName: 'Beginner', numericValue: 1 },
      { name: 'INTERMEDIATE', displayName: 'Intermediate', numericValue: 2 },
      { name: 'ADVANCED', displayName: 'Advanced', numericValue: 3 },
      { name: 'EXPERT', displayName: 'Expert', numericValue: 4 },
    ],
  },
  {
    name: 'PACE',
    displayName: 'Preferred Pace',
    levels: [
      { name: 'LEISURELY', displayName: 'Leisurely', numericValue: 1 },
      { name: 'MODERATE', displayName: 'Moderate', numericValue: 2 },
      { name: 'FAST', displayName: 'Fast', numericValue: 3 },
      { name: 'VERY_FAST', displayName: 'Very Fast', numericValue: 4 },
    ],
  },
  {
    name: 'DISTANCE',
    displayName: 'Preferred Distance',
    levels: [
      { name: 'SHORT', displayName: 'Short', numericValue: 1 },
      { name: 'MEDIUM', displayName: 'Medium', numericValue: 2 },
      { name: 'LONG', displayName: 'Long', numericValue: 3 },
      { name: 'VERY_LONG', displayName: 'Very Long', numericValue: 4 },
    ],
  },
  {
    name: 'TRANSPORTATION',
    displayName: 'Transportation',
    levels: [
      { name: 'CAR', displayName: 'Car', numericValue: 1 },
      { name: 'PUBLIC_TRANSPORT', displayName: 'Public Transport', numericValue: 2 },
      { name: 'BOTH', displayName: 'Both', numericValue: 3 },
    ],
  },
]

async function importSkills() {
  try {
    console.log('Starting skills import...')
    let successCount = 0
    let failureCount = 0

    for (const skillData of skillsData) {
      try {
        // Create or update the skill
        const skill = await prisma.skill.upsert({
          where: { name: skillData.name },
          update: { displayName: skillData.displayName },
          create: {
            name: skillData.name,
            displayName: skillData.displayName,
          },
        })

        // Create or update skill levels
        for (const levelData of skillData.levels) {
          await prisma.skillLevel.upsert({
            where: {
              skillId_name: {
                skillId: skill.id,
                name: levelData.name,
              },
            },
            update: {
              displayName: levelData.displayName,
              numericValue: levelData.numericValue,
            },
            create: {
              skillId: skill.id,
              name: levelData.name,
              displayName: levelData.displayName,
              numericValue: levelData.numericValue,
            },
          })
        }

        console.log(`✅ Imported skill: ${skill.displayName}`)
        successCount++
      } catch (error: any) {
        console.error(`❌ Error processing skill: ${skillData.name} - ${error.message}`)
        failureCount++
      }
    }

    console.log('\n=== Import Summary ===')
    console.log(`✅ Successfully imported: ${successCount} skills`)
    console.log(`❌ Failed to import: ${failureCount} skills`)
    console.log('=====================\n')

  } catch (error) {
    console.error('Fatal error during import:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Execute the import
importSkills()
  .catch(console.error) 