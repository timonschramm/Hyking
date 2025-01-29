import { promises as fs } from 'fs'
import path from 'path'
import { prisma } from '@/lib/prisma'

async function importActivities() {
    try {
        // Read the JSON file
        const filePath = path.join(process.cwd(), 'lib/updatedBavaria.json')
        const rawData = await fs.readFile(filePath, 'utf-8')
        const data = JSON.parse(rawData)

        let successCount = 0
        let failureCount = 0

        // Process activities in batches to improve performance
        for (const activity of data.tours) {
            try {
                // Validate required numeric fields
                const activityId = parseInt(activity.id)
                const categoryId = parseInt(activity.category_id)

                if (isNaN(activityId) || isNaN(categoryId)) {
                    throw new Error(`Invalid ID format for activity ${activity.title}`)
                }

                // Ensure the category exists or create it
                const category = await prisma.category.upsert({
                    where: { id: categoryId },
                    update: { name: activity.category_name },
                    create: {
                        id: categoryId,
                        name: activity.category_name
                    }
                })

                // Create the activity with validated data
                const createdActivity = await prisma.activity.create({
                    data: {
                        id: activityId,
                        title: activity.title,
                        teaserText: activity.teaser_text || '',
                        descriptionShort: activity.description_short || '',
                        descriptionLong: activity.description_long || '',
                        categoryId: category.id,
                        difficulty: Number(activity.difficulty) || 0,
                        landscapeRating: Number(activity.landscape_rating) || 0,
                        experienceRating: Number(activity.experience_rating) || 0,
                        staminaRating: Number(activity.stamina_rating) || 0,
                        length: Number(activity.length) || 0,
                        ascent: Number(activity.ascent) || 0,
                        descent: Number(activity.descent) || 0,
                        durationMin: Number(activity.duration_min) || 0,
                        minAltitude: Number(activity.min_altitude) || 0,
                        maxAltitude: Number(activity.max_altitude) || 0,
                        pointLat: Number(activity.point_lat) || 0,
                        pointLon: Number(activity.point_lon) || 0,
                        isWinter: Boolean(activity.is_winter),
                        isClosed: Boolean(activity.is_closed),
                        primaryRegion: activity.primary_region || '',
                        primaryImageId: activity.primary_image_id || '',
                        publicTransportFriendly: Boolean(activity.publicTransportFriendly),

                        // Handle Seasons with proper month validation
                        seasons: {
                            create: Object.entries(activity.season || {}).map(([month, isActive]) => ({
                                month: month.toLowerCase(),
                                isActive: isActive === 'yes'
                            }))
                        },

                        // Handle Images with deduplication
                        images: {
                            create: Array.from(new Set([
                                ...(activity.primary_image_id ? [activity.primary_image_id] : []),
                                ...(activity.image_ids || [])
                            ])).map(imageId => ({
                                imageId: String(imageId)
                            }))
                        }
                    }
                })

                console.log(`✅ Imported activity: ${createdActivity.title} (ID: ${createdActivity.id})`)
                successCount++

            } catch (innerError: any) {
                console.error(`❌ Error processing activity: ${activity?.title || 'Unknown'} - ${innerError.message}`)
                failureCount++
            }
        }

        console.log('\n=== Import Summary ===')
        console.log(`✅ Successfully imported: ${successCount} activities`)
        console.log(`❌ Failed to import: ${failureCount} activities`)
        console.log('=====================\n')

    } catch (error) {
        console.error('Fatal error during import:', error)
        throw error
    } finally {
        await prisma.$disconnect()
    }
}

// Execute the import
importActivities()
    .catch(console.error)