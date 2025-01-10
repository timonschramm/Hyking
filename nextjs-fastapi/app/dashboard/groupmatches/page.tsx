'use client'

import { useEffect, useState } from 'react'
import { GroupMatchCard } from '@/app/components/GroupMatchCard'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { Skeleton } from '@/components/ui/skeleton'
import { GroupMatchWithIncludes } from '@/types/groupMatch'
import { createClient } from '@/utils/supabase/client'

export default function GroupMatchesPage() {
  const [groupMatches, setGroupMatches] = useState<GroupMatchWithIncludes[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const initializePage = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        console.log('user', user)
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
      
      // If there's a chat room, redirect to it
      const updatedMatch = await response.json()
      if (updatedMatch.chatRoomId) {
        router.push(`/dashboard/chats/${updatedMatch.chatRoomId}`)
      }
      
      // Refresh the matches
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
      <div className="container mx-auto py-8 space-y-6">
        <h1 className="text-2xl font-bold mb-6">Group Matches</h1>
        <div className="space-y-6">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-[600px] w-full max-w-2xl mx-auto" />
          ))}
        </div>
      </div>
    )
  }

  if (groupMatches.length === 0) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6">Group Matches</h1>
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No group matches yet</h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            We'll notify you when we find a perfect hiking group for you!
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Group Matches</h1>
      <div className="space-y-6">
        {groupMatches.map((match) => (
          <div key={match.id} className="flex justify-center">
            <GroupMatchCard
              groupMatch={{
                ...match,
                currentUserId
              }}
              onAccept={handleAcceptMatch}
            />
          </div>
        ))}
      </div>
    </div>
  )
}