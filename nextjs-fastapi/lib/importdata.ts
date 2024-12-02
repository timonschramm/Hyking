import { PrismaClient } from '@prisma/client'
import { promises as fs } from 'fs'
import path from 'path'

const prisma = new PrismaClient()

async function importActivities() {
    try {
        // Read the JSON file
        const filePath = path.join(process.cwd(), 'lib/updatedBavaria.json')
        const rawData = await fs.readFile(filePath, 'utf-8')

        // Parse the entire JSON file
        const data = JSON.parse(rawData)

        const uniqueCategories = new Set()

        let successCount = 0;
        let failureCount = 0;

        // Iterate through the tours array
        for (const activity of data.tours) {
            try {
                // Convert category_id to integer
                const categoryId = parseInt(activity.category_id)

                // Ensure the category exists or create it
                const category = await prisma.category.upsert({
                    where: { id: categoryId },
                    update: { name: activity.category_name },
                    create: {
                        id: categoryId,
                        name: activity.category_name
                    }
                });

                // Create the activity
                const createdActivity = await prisma.activity.create({
                    data: {
                        id: parseInt(activity.id),
                        title: activity.title,
                        teaserText: activity.teaser_text || '',
                        descriptionShort: activity.description_short || '',
                        descriptionLong: activity.description_long || '',
                        categoryId: category.id,
                        difficulty: activity.difficulty,
                        landscapeRating: activity.landscape_rating,
                        experienceRating: activity.experience_rating,
                        staminaRating: activity.stamina_rating,
                        length: activity.length,
                        ascent: activity.ascent,
                        descent: activity.descent,
                        durationMin: activity.duration_min,
                        minAltitude: activity.min_altitude,
                        maxAltitude: activity.max_altitude,
                        pointLat: activity.point_lat,
                        pointLon: activity.point_lon,
                        isWinter: activity.is_winter,
                        isClosed: activity.is_closed,
                        primaryRegion: activity.primary_region,
                        primaryImageId: activity.primary_image_id,
                        publicTransportFriendly: activity.publicTransportFriendly,

                        // Handle Seasons
                        seasons: {
                            create: Object.entries(activity.season || {}).map(([month, isActive]) => ({
                                month,
                                isActive: isActive === 'yes'
                            })
                            )
                        },

                        // Handle Images
                        images: {
                            create: [
                                ...(activity.primary_image_id ? [{ imageId: activity.primary_image_id }] : []),
                                ...(activity.image_ids || []).map((imageId: string) => ({ imageId }))
                            ]
                        }
                    }
                })

                console.log(`Imported activity: ${createdActivity.title}`)
                successCount++;

            } catch (innerError: any) {
                console.error(`Error processing activity: ${innerError.message}`)
                failureCount++;
            }
        }

        console.log('All activities imported successfully!')
        console.log(`Successfully imported activities: ${successCount}`)
        console.log(`Failed to import activities: ${failureCount}`)

    } catch (error) {
        console.error('Error importing activities:', error)
    } finally {
        await prisma.$disconnect()
    }
}

importActivities()