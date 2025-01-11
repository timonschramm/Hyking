'use client'

import { useEffect, useState } from 'react'
import { GroupMatchCard } from '@/app/components/GroupMatchCard'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { Skeleton } from '@/components/ui/skeleton'
import { GroupMatchWithIncludes } from '@/types/groupMatch'
import { createClient } from '@/utils/supabase/client'
import { Users } from 'lucide-react'

export default function GroupMatchesPage() {
  const [groupMatches, setGroupMatches] = useState<GroupMatchWithIncludes[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [selectedMatch, setSelectedMatch] = useState<GroupMatchWithIncludes | null>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const initializePage = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          return
        }
        
        setCurrentUserId(user.id)

        const response = await fetch('/api/groupmatches')
        if (!response.ok) throw new Error('Failed to fetch group matches')
        const data = await response.json()
        setGroupMatches(data)
      } catch (error) {
        console.error('Error initializing page:', error)
      } finally {
        setLoading(false)
      }
    }

    initializePage()
  }, [supabase.auth, router])

  const handleAcceptMatch = async (groupMatchId: string) => {
    try {
      const response = await fetch(`/api/groupmatches/${groupMatchId}/accept`, {
        method: 'POST',
      })
      
      if (!response.ok) throw new Error('Failed to accept group match')
      
      const updatedMatch = await response.json()
      if (updatedMatch.chatRoomId) {
        router.push(`/dashboard/chats/${updatedMatch.chatRoomId}`)
      }
      
      const matchesResponse = await fetch('/api/groupmatches')
      if (matchesResponse.ok) {
        const data = await matchesResponse.json()
        setGroupMatches(data)
      }
    } catch (error) {
      console.error('Error accepting group match:', error)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 md:py-12">
        <h1 className="text-3xl font-bold mb-8">Group Matches</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[500px] rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  if (groupMatches.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 md:py-12">
        <h1 className="text-3xl font-bold mb-8">Group Matches</h1>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-24 h-24 mb-6 rounded-full bg-secondary-sage/20 flex items-center justify-center">
            <Users className="w-12 h-12 text-secondary-sage" />
          </div>
          <h3 className="text-xl font-semibold text-primary dark:text-primary-white mb-2">
            No group matches yet
          </h3>
          <p className="text-muted-foreground max-w-md">
            We're working on finding the perfect hiking group for you! We'll notify you when we have some great matches.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <h1 className="text-3xl font-bold mb-8">Group Matches</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groupMatches.map((match) => (
          <div key={match.id}>
            <GroupMatchCard
              groupMatch={{
                ...match,
                currentUserId
              }}
              onAccept={handleAcceptMatch}
              onViewChat={(chatRoomId) => router.push(`/dashboard/chats/${chatRoomId}`)}
            />
          </div>
        ))}
      </div>
    </div>
  )
}