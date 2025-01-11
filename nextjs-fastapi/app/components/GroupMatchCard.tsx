import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, Check } from "lucide-react"
import Image from "next/image"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { UserCard } from "@/app/components/UserCard"
import { Badge } from "@/components/ui/badge"
import { GroupMatchCardProps, ProfileWithGroupSuggestion } from "@/types/groupMatch"

export function GroupMatchCard({ groupMatch, onAccept }: GroupMatchCardProps) {
  
  const hikeActivity = groupMatch.hikeSuggestions[0]
  const currentUserProfile = groupMatch.profiles.find(
    (p) => p.profileId === groupMatch.currentUserId
  )
  const otherProfiles = groupMatch.profiles.filter(
    (p) => p.profileId !== groupMatch.currentUserId
  )
  console.log(groupMatch.currentUserId)

  const hasCurrentUserAccepted = currentUserProfile?.hasAccepted

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Hiking Group Suggestion</CardTitle>
            <CardDescription>
              We found some hiking buddies for you!
            </CardDescription>
          </div>
          
          {hasCurrentUserAccepted && (
            <Badge variant="default" className="bg-green-500/10 text-green-500 border-green-500/20">
              <Check className="w-3 h-3 mr-1" />
              You&apos;ve Joined
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Suggested Hike */}
        <div className="rounded-lg overflow-hidden border">
          <div className="relative h-48 w-full">
            <Image
              src={`https://img.oastatic.com/img2/${hikeActivity.primaryImageId}/default/variant.jpg`}
              alt={hikeActivity.title}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-0 p-4 text-white">
              <h3 className="text-xl font-semibold">{hikeActivity.title}</h3>
              <div className="flex items-center gap-1 mt-1">
                <MapPin className="h-4 w-4" />
                <span className="text-sm">{hikeActivity.primaryRegion}</span>
              </div>
            </div>
          </div>
          <div className="p-4 space-y-2">
            <p className="text-sm text-muted-foreground">{hikeActivity.descriptionShort}</p>
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
        </div>

        {/* Group Members */}
        <div className="space-y-2">
          <h3 className="font-medium">Suggested Group Members</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {otherProfiles.map((profileMatch: ProfileWithGroupSuggestion) => (
              <Dialog key={profileMatch.profileId}>
                <DialogTrigger asChild>
                  <div className="cursor-pointer">
                    <div className="relative aspect-[3/4] rounded-xl overflow-hidden group">
                      <Image
                        src={profileMatch.profile.imageUrl || '/default-avatar.png'}
                        fill
                        alt={`${profileMatch.profile.email}'s profile`}
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                      {profileMatch.hasAccepted && (
                        <div className="absolute top-2 right-2 z-10">
                          <Badge variant="default" className="bg-green-500/10 text-green-500 border-green-500/20">
                            <Check className="w-3 h-3 mr-1" />
                            Joined
                          </Badge>
                        </div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent p-2">
                        <div className="flex items-end justify-between">
                          <div>
                            <h3 className="text-white text-sm font-medium leading-tight">
                              {profileMatch.profile.email.split('@')[0]}
                            </h3>
                            <p className="text-white/90 text-xs">
                              {profileMatch.profile.age} years
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
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

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 pt-4">
          {!hasCurrentUserAccepted ? (
            <>
              <Button variant="outline">Maybe Later</Button>
              <Button onClick={() => onAccept(groupMatch.id)}>Join Group</Button>
            </>
          ) : (
            <div className="text-sm text-muted-foreground">
              Waiting for others to join...
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 