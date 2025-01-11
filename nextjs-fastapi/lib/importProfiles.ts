import { PrismaClient } from '@prisma/client'
import { faker } from '@faker-js/faker'
import {

  InterestCategory
} from '@prisma/client'
import path from 'path'

const prisma = new PrismaClient()

// Constants
const PROFILES_TO_GENERATE = 10
const MIN_INTERESTS_PER_USER = 3
const MAX_INTERESTS_PER_USER = 8
const MIN_ARTISTS_PER_USER = 2
const MAX_ARTISTS_PER_USER = 6

// Profile images mapping
const PROFILE_IMAGES = {
  male: ['1.jpg', '3.jpg', '4.jpg', '5.jpg', '6.jpg', '7.jpg', '11.jpg', '12.jpg', '15.jpg', '17.jpg'],
  female: ['2.jpg', '8.jpg', '9.jpg', '13.jpg', '14.jpg', '16.jpg', '18.jpg']
}

// Predefined artists to avoid unique constraint issues
const PREDEFINED_ARTISTS = [
  { name: 'Taylor Swift', genre: 'Pop' },
  { name: 'Ed Sheeran', genre: 'Pop' },
  { name: 'Drake', genre: 'Hip Hop' },
  { name: 'Adele', genre: 'Pop' },
  { name: 'The Weeknd', genre: 'R&B' },
  { name: 'Billie Eilish', genre: 'Pop' },
  { name: 'Post Malone', genre: 'Hip Hop' },
  { name: 'Dua Lipa', genre: 'Pop' },
  { name: 'Bruno Mars', genre: 'Pop' },
  { name: 'Lady Gaga', genre: 'Pop' },
  // Add more as needed
]

// Predefined interests by category for more realistic data
const PREDEFINED_INTERESTS = {
  SELF_CARE: ['Meditation', 'Yoga', 'Spa', 'Reading', 'Journaling'],
  SPORTS: ['Hiking', 'Running', 'Swimming', 'Cycling', 'Rock Climbing'],
  CREATIVITY: ['Painting', 'Photography', 'Writing', 'Music', 'Dancing'],
  GOING_OUT: ['Restaurants', 'Concerts', 'Museums', 'Theater', 'Festivals'],
  STAYING_IN: ['Gaming', 'Cooking', 'Movies', 'Board Games', 'Podcasts']
}

async function getRandomProfileImage(gender: string): Promise<string> {
  const images = gender.toLowerCase() === 'male' ? PROFILE_IMAGES.male : PROFILE_IMAGES.female
  const randomImage = faker.helpers.arrayElement(images)
  return `/dummyprofileimages/${randomImage}`
}

// First, create all artists and store their IDs
async function seedArtists() {
  console.log('🎵 Creating artists...')
  const createdArtists = []

  for (const artistData of PREDEFINED_ARTISTS) {
    // First ensure the genre exists
    const genre = await prisma.genre.upsert({
      where: { 
        name: artistData.genre 
      },
      update: {},
      create: {
        name: artistData.genre
      }
    })

    // Generate a consistent spotifyId
    const spotifyId = `spotify-${artistData.name.toLowerCase().replace(/\s+/g, '-')}`

    // Create or update the artist with proper genre relation
    const artist = await prisma.artist.upsert({
      where: { 
        spotifyId: spotifyId
      },
      update: {
        genres: {
          connect: {
            id: genre.id
          }
        }
      },
      create: {
        spotifyId: spotifyId,
        name: artistData.name,
        imageUrl: faker.image.avatar(),
        genres: {
          connect: {
            id: genre.id
          }
        }
      }
    })
    createdArtists.push(artist)
    console.log(`✅ Created/Updated artist: ${artist.name} (${artist.spotifyId})`)
  }
  return createdArtists
}

async function createRandomProfile(availableArtists: any[]) {
  const gender = faker.person.sex()
  const firstName = faker.person.firstName(gender as "female" | "male")
  const lastName = faker.person.lastName()

  // Create base profile (unchanged)
  const profile = await prisma.profile.create({
    data: {
      email: faker.internet.email({ firstName, lastName }),
      age: faker.number.int({ min: 18, max: 28 }),
      displayName: `${firstName} ${lastName.charAt(0)}.`,
      imageUrl: await getRandomProfileImage(gender),
      gender: gender,
      location: faker.location.city(),
      dogFriendly: faker.datatype.boolean(),
      onboardingCompleted: true,
      bio: faker.lorem.paragraph(),
      spotifyConnected: faker.datatype.boolean()
    }
  })

  // Add interests (unchanged)
  const interests = await prisma.interest.findMany()
  const numInterests = faker.number.int({ 
    min: MIN_INTERESTS_PER_USER, 
    max: MAX_INTERESTS_PER_USER 
  })
  
  const selectedInterests = faker.helpers.arrayElements(interests, numInterests)
  
  for (const interest of selectedInterests) {
    await prisma.userInterest.create({
      data: {
        profileId: profile.id,
        interestId: interest.id
      }
    })
  }

  // Add artists from our pre-created list
  const numArtists = faker.number.int({ 
    min: MIN_ARTISTS_PER_USER, 
    max: MAX_ARTISTS_PER_USER 
  })

  const selectedArtists = faker.helpers.arrayElements(availableArtists, numArtists)
  
  for (const artist of selectedArtists) {
    await prisma.userArtist.create({
      data: {
        profileId: profile.id,
        artistId: artist.id
      }
    })
  }

  return profile
}

async function seedInterests() {
  for (const [category, interests] of Object.entries(PREDEFINED_INTERESTS)) {
    for (const interestName of interests) {
      await prisma.interest.upsert({
        where: { name: interestName },
        update: {},
        create: {
          name: interestName,
          category: category as InterestCategory
        }
      })
    }
  }
}

async function generateDummyProfiles() {
  try {
    console.log('🚀 Starting dummy profile generation...')
    
    // First seed interests
    await seedInterests()
    
    // Then create all artists
    const availableArtists = await seedArtists()
    
    let successCount = 0
    let failureCount = 0

    for (let i = 0; i < PROFILES_TO_GENERATE; i++) {
      try {
        const profile = await createRandomProfile(availableArtists)
        console.log(`✅ Created profile: ${profile.displayName} (ID: ${profile.id})`)
        successCount++
      } catch (error: any) {
        console.error(`❌ Failed to create profile #${i + 1}:`, error.message)
        failureCount++
      }
    }

    console.log('\n=== Generation Summary ===')
    console.log(`✅ Successfully created: ${successCount} profiles`)
    console.log(`❌ Failed to create: ${failureCount} profiles`)
    console.log('========================\n')

  } catch (error) {
    console.error('Fatal error during profile generation:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Execute the generation
generateDummyProfiles()
  .catch(console.error) 