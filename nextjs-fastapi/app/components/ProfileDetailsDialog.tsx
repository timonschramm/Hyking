import { useEffect, useState } from 'react'
import { UserCard } from './UserCard'
import { Skeleton } from '@/components/ui/skeleton'
import Image from 'next/image'

interface ProfileDetailsDialogProps {
  profileId: string
  initialData: {
    imageUrl: string | null
    displayName: string | null
  }
}

export function ProfileDetailsDialog({ profileId, initialData }: ProfileDetailsDialogProps) {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProfileDetails = async () => {
      try {
        const response = await fetch(`/apinextjs/profile?userId=${profileId}`)
        if (!response.ok) throw new Error('Failed to fetch profile details')
        const data = await response.json()
        setProfile(data)
      } catch (error) {
        console.error('Error fetching profile details:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProfileDetails()
  }, [profileId])

  if (loading) {
    return (
      <div className="relative aspect-[3/4] w-full">
        <Image
          src={initialData.imageUrl || '/default-avatar.jpg'}
          alt={initialData.displayName || 'User'}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <Skeleton className="w-12 h-12 rounded-full" />
        </div>
      </div>
    )
  }

  if (!profile) {
    return <div className="p-4">Failed to load profile details</div>
  }

  return (
    <UserCard
      data={profile}
      active={true}
      removeCard={() => {}}
      disableActions={true}
      displayMode="grid"
    />
  )
} 
