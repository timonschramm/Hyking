import { format } from 'date-fns';
import { cn } from "@/lib/utils";
import Image from 'next/image';

interface ChatBubbleProps {
  content: string;
  timestamp: Date;
  isOwn: boolean;
  status?: 'sent' | 'delivered' | 'read';
  isGroupChat?: boolean;
  senderProfile?: {
    imageUrl: string | null;
    email: string;
  } | null;
}

export const ChatBubble = ({ 
  content, 
  timestamp, 
  isOwn, 
  status = 'sent',
  isGroupChat = false,
  senderProfile
}: ChatBubbleProps) => {
  return (
    <div className={cn(
      "flex items-end gap-2 mb-2",
      isOwn ? "flex-row-reverse" : "flex-row",
      "w-full"
    )}>
      {/* {isGroupChat && isOwn && senderProfile && ( */}
      {isGroupChat && senderProfile && (
        <div className="flex-shrink-0 w-8">
          <div className="relative h-8 w-8">
            <Image
              src={senderProfile.imageUrl || '/default-avatar.jpg'}
              alt={senderProfile.email}
              fill
              className="rounded-full object-cover border border-gray-200"
              priority
            />
          </div>
        </div>
      )}
      <div className="flex flex-col max-w-[75%]">
       
        <div className={cn(
          "relative rounded-lg px-3 py-2",
          isOwn ? "bg-[#E7FFDB] text-gray-800" : "bg-white text-gray-800",
          "shadow-sm"
        )}>
             {isGroupChat && !isOwn && senderProfile && (
          <span className="text-xs font-medium text-blue-600 mb-0.5 ml-1">
            {senderProfile.email.split('@')[0]}
          </span>
        )}
          <div className="mb-1 break-words text-[0.9375rem] leading-[1.25rem]">{content}</div>
          <div className="flex items-center justify-end gap-1">
            <span className="text-[0.65rem] text-gray-500">
              {format(timestamp, 'HH:mm')}
            </span>
            {/* {isOwn && (
              <span className="text-[0.65rem] text-gray-500">
                {status === 'read' && (
                  <svg className="h-3 w-4 text-blue-500" viewBox="0 0 16 11" fill="currentColor">
                    <path d="M11.071.894L4.929 7.036 2.929 5.036 1.515 6.45l3.414 3.414.707.707 7.071-7.071L11.071.894z" />
                    <path d="M15.071.894L8.929 7.036l-.707-.707L14.364.187l.707.707z" />
                  </svg>
                )}
                {status === 'delivered' && (
                  <svg className="h-3 w-4" viewBox="0 0 16 11" fill="currentColor">
                    <path d="M11.071.894L4.929 7.036 2.929 5.036 1.515 6.45l3.414 3.414.707.707 7.071-7.071L11.071.894z" />
                  </svg>
                )}
                {status === 'sent' && (
                  <svg className="h-3 w-3" viewBox="0 0 12 11" fill="currentColor">
                    <path d="M11.071.894L4.929 7.036 2.929 5.036 1.515 6.45l3.414 3.414.707.707 7.071-7.071L11.071.894z" />
                  </svg>
                )}
              </span>
            )} */}
          </div>
          
          {/* Triangle for chat bubble */}
          <div className={cn(
            "absolute top-0 w-4 h-4 overflow-hidden",
            isOwn ? "-right-2" : "-left-2"
          )}>
            <div className={cn(
              "absolute w-3 h-3 transform rotate-45",
              isOwn ? "bg-[#E7FFDB] -left-1.5 top-1" : "bg-white -right-1.5 top-1"
            )} />
          </div>
        </div>
      </div>
    </div>
  );
}; 