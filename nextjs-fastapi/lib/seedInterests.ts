import { InterestCategory } from '@prisma/client'
import { prisma } from '@/lib/prisma'

async function seedInterests() {
    try {
        const interests = [
            // Self-care category
            {
                name: 'nutrition',
                category: InterestCategory.SELF_CARE
            },
            {
                name: 'coldPlunging',
                category: InterestCategory.SELF_CARE
            },
            {
                name: 'deepChats',
                category: InterestCategory.SELF_CARE
            },
            {
                name: 'mindfulness',
                category: InterestCategory.SELF_CARE
            },

            // Sports category
            {
                name: 'badminton',
                category: InterestCategory.SPORTS
            },
            {
                name: 'basketball',
                category: InterestCategory.SPORTS
            },
            {
                name: 'running',
                category: InterestCategory.SPORTS
            },
            {
                name: 'cycling',
                category: InterestCategory.SPORTS
            },
            {
                name: 'swimming',
                category: InterestCategory.SPORTS
            },

            // Creativity category
            {
                name: 'art',
                category: InterestCategory.CREATIVITY
            },
            {
                name: 'dancing',
                category: InterestCategory.CREATIVITY
            },

            // Going out category
            {
                name: 'bars',
                category: InterestCategory.GOING_OUT
            },
            {
                name: 'karaoke',
                category: InterestCategory.GOING_OUT
            },
            {
                name: 'concerts',
                category: InterestCategory.GOING_OUT
            },
            {
                name: 'festivals',
                category: InterestCategory.GOING_OUT
            },

            // Staying in category
            {
                name: 'baking',
                category: InterestCategory.STAYING_IN
            },
            {
                name: 'chess',
                category: InterestCategory.STAYING_IN
            },
            {
                name: 'boardgames',
                category: InterestCategory.STAYING_IN
            },
            {
                name: 'reading',
                category: InterestCategory.STAYING_IN
            },
            {
                name: 'movies',
                category: InterestCategory.STAYING_IN
            },
            {
                name: 'tv',
                category: InterestCategory.STAYING_IN
            },
            {
                name: 'videoGames',
                category: InterestCategory.STAYING_IN
            }
        ]

        let successCount = 0
        let failureCount = 0

        for (const interest of interests) {
            try {
                const createdInterest = await prisma.interest.upsert({
                    where: { name: interest.name },
                    update: { category: interest.category },
                    create: {
                        name: interest.name,
                        category: interest.category
                    }
                })

                console.log(`✅ Created/Updated interest: ${createdInterest.name} (Category: ${createdInterest.category})`)
                successCount++
            } catch (error) {
                console.error(`❌ Failed to create interest: ${interest.name}`, error)
                failureCount++
            }
        }

        console.log('\n=== Seeding Summary ===')
        console.log(`✅ Successfully processed: ${successCount} interests`)
        console.log(`❌ Failed to process: ${failureCount} interests`)
        console.log('=====================\n')

    } catch (error) {
        console.error('Fatal error during seeding:', error)
        throw error
    } finally {
        await prisma.$disconnect()
    }
}

// Execute the seeding
seedInterests()
    .catch(console.error) 