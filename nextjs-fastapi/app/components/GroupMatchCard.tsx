import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, Check, Users, MessageCircle } from "lucide-react"
import Image from "next/image"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { UserCard } from "@/app/components/UserCard"
import { Badge } from "@/components/ui/badge"
import { GroupMatchCardProps, ProfileWithGroupSuggestion } from "@/types/groupMatch"
import { cn } from "@/lib/utils"

export function GroupMatchCard({ groupMatch, onAccept, onViewChat }: GroupMatchCardProps) {
  const hikeActivity = groupMatch.hikeSuggestions[0]
  const currentUserProfile = groupMatch.profiles.find(
    (p) => p.profileId === groupMatch.currentUserId
  )
  const otherProfiles = groupMatch.profiles.filter(
    (p) => p.profileId !== groupMatch.currentUserId
  )

  const hasCurrentUserAccepted = currentUserProfile?.hasAccepted
  const acceptedCount = groupMatch.profiles.filter(p => p.hasAccepted).length
  const totalCount = groupMatch.profiles.length

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300">
      <div className="relative h-48">
        <Image
          src={`https://img.oastatic.com/img2/${hikeActivity.primaryImageId}/default/variant.jpg`}
          alt={hikeActivity.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute bottom-0 p-4 text-white">
          <h3 className="text-xl font-semibold mb-2">{hikeActivity.title}</h3>
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4" />
            <span>{hikeActivity.primaryRegion}</span>
          </div>
        </div>
        <div className="absolute top-4 right-4 flex gap-2">
          <Badge variant="secondary" className="bg-black/50 border-none text-white">
            <Users className="w-3 h-3 mr-1" />
            {acceptedCount}/{totalCount}
          </Badge>
          {hasCurrentUserAccepted && (
            <Badge variant="default" className="bg-green-500/90 border-none">
              <Check className="w-3 h-3 mr-1" />
              Joined
            </Badge>
          )}
        </div>
      </div>
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-4 text-sm">
              <div>
                <span className="font-medium">Length:</span> {hikeActivity.length}km
              </div>
              <div>
                <span className="font-medium">Duration:</span> {Math.round(hikeActivity.durationMin / 60)}h
              </div>
              <div>
                <span className="font-medium">Difficulty:</span> {hikeActivity.difficulty}/5
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-sm">Group Members</h4>
            <div className="flex -space-x-2 overflow-hidden">
              {otherProfiles.map((profileMatch: ProfileWithGroupSuggestion) => (
                <Dialog key={profileMatch.profileId}>
                  <DialogTrigger asChild>
                    <button className="relative w-10 h-10 rounded-full border-2 border-white hover:z-10 transition-transform hover:scale-105">
                      <Image
                        src={profileMatch.profile.imageUrl || '/default-avatar.jpg'}
                        fill
                        alt={`${profileMatch.profile.email}'s profile`}
                        className="rounded-full object-cover"
                      />
                      {profileMatch.hasAccepted && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                      )}
                    </button>
                  </DialogTrigger>
                  <DialogContent className="p-0 border-none !rounded-2xl overflow-hidden max-w-[95vw] md:max-w-[400px]">
                    <UserCard
                      data={profileMatch.profile}
                      active={true}
                      removeCard={() => {}}
                      disableActions={true}
                      displayMode="grid"
                    />
                  </DialogContent>
                </Dialog>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            {groupMatch.chatRoom && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewChat?.(groupMatch.chatRoom!.id)}
                className="text-sm"
              >
                <MessageCircle className="w-4 h-4 mr-1" />
                Chat
              </Button>
            )}
            {!hasCurrentUserAccepted && (
              <Button
                size="sm"
                onClick={() => onAccept(groupMatch.id)}
                className="text-sm"
              >
                Join Group
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 