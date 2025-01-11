import { format } from 'date-fns';
import { cn } from "@/lib/utils";

interface ChatBubbleProps {
  content: string;
  timestamp: Date;
  isOwn: boolean;
  status?: 'sent' | 'delivered' | 'read';
}

export const ChatBubble = ({ content, timestamp, isOwn, status = 'sent' }: ChatBubbleProps) => {
  return (
    <div className={cn(
      "flex w-full ",
      isOwn ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "relative max-w-[75%] rounded-2xl px-4 py-2",
        isOwn ? "bg-[#DCF8C6] text-black" : "bg-white text-black",
        "shadow-md"
      )}>
        <div className="mb-1 break-words">{content}</div>
        <div className="flex items-center justify-end gap-1">
          <span className="text-[0.65rem] text-neutral-500">
            {format(timestamp, 'HH:mm')}
          </span>
          {/* {isOwn && (
            <span className="text-[0.65rem] text-neutral-500">
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
            isOwn ? "bg-[#DCF8C6] -left-1.5 top-1" : "bg-white -right-1.5 top-1"
          )} />
        </div>
      </div>
    </div>
  );
}; 