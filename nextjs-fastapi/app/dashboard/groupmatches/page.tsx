'use client'

import { useEffect, useState } from 'react'
import { GroupMatchCard } from '@/app/components/GroupMatchCard'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { Skeleton } from '@/components/ui/skeleton'
import { GroupMatchWithIncludes } from '@/types/groupMatch'
import { createClient } from '@/utils/supabase/client'
import { Users, UserCircle, Globe } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/app/components/ui/tabs"
import { cn } from "@/lib/utils"

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

        const response = await fetch('/apinextjs/groupmatches')
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
      const response = await fetch(`/apinextjs/groupmatches/${groupMatchId}/accept`, {
        method: 'POST',
      })
      
      if (!response.ok) throw new Error('Failed to accept group match')
      
      const updatedMatch = await response.json()
      if (updatedMatch.chatRoomId) {
        router.push(`/dashboard/chats/${updatedMatch.chatRoomId}`)
      }
      
      const matchesResponse = await fetch('/apinextjs/groupmatches')
      if (matchesResponse.ok) {
        const data = await matchesResponse.json()
        setGroupMatches(data)
      }
    } catch (error) {
      console.error('Error accepting group match:', error)
    }
  }

  const memberGroups = groupMatches.filter(match => match.isMember)
  const allGroups = groupMatches

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

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-24 h-24 mb-6 rounded-full bg-blue-50 flex items-center justify-center">
        <Users className="w-12 h-12 text-blue-500" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        No group matches yet
      </h3>
      <p className="text-gray-600 max-w-md">
        We&apos;re working on finding the perfect hiking group for you! We&apos;ll notify you when we have some great matches. Therefore please complete your profile and swipe our users so we can match you with them.
      </p>
    </div>
  )

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <h1 className="text-3xl font-bold mb-8 text-gray-900">Group Matches</h1>
      <Tabs defaultValue="member" className="w-full space-y-8">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 bg-gray-100/80 p-1 rounded-full">
          <TabsTrigger 
            value="member" 
            className={cn(
              "data-[state=active]:bg-white data-[state=active]:text-blue-600",
              "data-[state=active]:shadow-sm",
              "rounded-full transition-all duration-300 ease-in-out",
              "flex items-center justify-center gap-2 py-2.5",
              "text-gray-600 hover:text-gray-900"
            )}
          >
            <UserCircle className="w-4 h-4" />
            My Groups
          </TabsTrigger>
          <TabsTrigger 
            value="all"
            className={cn(
              "data-[state=active]:bg-white data-[state=active]:text-blue-600",
              "data-[state=active]:shadow-sm",
              "rounded-full transition-all duration-300 ease-in-out",
              "flex items-center justify-center gap-2 py-2.5",
              "text-gray-600 hover:text-gray-900"
            )}
          >
            <Globe className="w-4 h-4" />
            All Groups
          </TabsTrigger>
        </TabsList>
        
        <TabsContent 
          value="member"
          className="space-y-6 focus-visible:outline-none focus-visible:ring-0"
        >
          {memberGroups.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {memberGroups.map((match) => (
                <div key={match.id} className="transform transition-all duration-300 hover:scale-[1.02] hover:shadow-lg">
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
          )}
        </TabsContent>

        <TabsContent 
          value="all"
          className="space-y-6 focus-visible:outline-none focus-visible:ring-0"
        >
          {allGroups.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allGroups.map((match) => (
                <div key={match.id} className="transform transition-all duration-300 hover:scale-[1.02] hover:shadow-lg">
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
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}