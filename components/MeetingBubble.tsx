import React, { useState, useEffect } from 'react';
import { Meeting } from '../types';
import { Video, Calendar, Clock, X, ChevronUp, ChevronDown, ExternalLink } from 'lucide-react';

interface MeetingBubbleProps {
  meetings: Meeting[];
  onJoin: (id: string) => void;
  currentUserId: string;
}

export const MeetingBubble: React.FC<MeetingBubbleProps> = ({ meetings, onJoin, currentUserId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [relevantMeetings, setRelevantMeetings] = useState<Meeting[]>([]);

  useEffect(() => {
    const checkMeetings = () => {
      const now = new Date();
      const nowTimeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      const todayStr = now.toLocaleDateString('vi-VN'); // DD/MM/YYYY

      const active = meetings.filter(m => {
        // Parse meeting end time
        const [day, month, year] = m.date.split('/');
        const [endHour, endMinute] = m.endTime.split(':');
        const meetingEndDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(endHour), parseInt(endMinute));
        
        // If current time is past the meeting end time, don't show it
        if (now > meetingEndDate) {
            return false;
        }

        // Status check (Show all ongoing/upcoming regardless of date for demo purposes)
        if (m.status === 'ongoing') return true;
        if (m.status === 'upcoming') return true;
        
        return false;
      }).sort((a, b) => {
          // Sort: Ongoing first, then by date and time
          if (a.status === 'ongoing' && b.status !== 'ongoing') return -1;
          if (a.status !== 'ongoing' && b.status === 'ongoing') return 1;
          
          // Compare dates first (YYYY-MM-DD format needed for proper sort, but let's try simple string compare for now or just time)
          // Since dates are DD/MM/YYYY, we need to parse them to compare correctly
          const dateA = a.date.split('/').reverse().join('-');
          const dateB = b.date.split('/').reverse().join('-');
          if (dateA !== dateB) return dateA.localeCompare(dateB);
          
          return a.startTime.localeCompare(b.startTime);
      });

      setRelevantMeetings(active);
    };

    checkMeetings();
    const interval = setInterval(checkMeetings, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [meetings]);

  if (relevantMeetings.length === 0) return null;

  const primaryMeeting = relevantMeetings[0];
  const count = relevantMeetings.length;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end space-y-2">
      
      {/* Expanded Content */}
      {isOpen && (
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 w-80 mb-2 animate-slide-in-up">
            <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-100">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    Lịch Họp Hôm Nay
                </h3>
                <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-4 h-4" />
                </button>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                {relevantMeetings.map(meeting => (
                    <div key={meeting.id} className={`p-3 rounded-xl border ${meeting.status === 'ongoing' ? 'bg-emerald-50 border-emerald-100' : 'bg-gray-50 border-gray-100'}`}>
                        <div className="flex justify-between items-start mb-1">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${meeting.status === 'ongoing' ? 'bg-emerald-100 text-emerald-700 animate-pulse' : 'bg-blue-100 text-blue-700'}`}>
                                {meeting.status === 'ongoing' ? 'Đang diễn ra' : 'Sắp diễn ra'}
                            </span>
                            <div className="flex flex-col items-end">
                                <span className="text-xs text-gray-500 font-mono flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {meeting.startTime}
                                </span>
                                <span className="text-[10px] text-gray-400">
                                    {meeting.date}
                                </span>
                            </div>
                        </div>
                        <h4 className="font-semibold text-gray-800 text-sm line-clamp-2 mb-1">{meeting.title}</h4>
                        <p className="text-xs text-gray-500 mb-2">Phòng: {meeting.roomId}</p>
                        
                        <button 
                            onClick={() => {
                                onJoin(meeting.id);
                                setIsOpen(false);
                            }}
                            className={`w-full py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors ${
                                meeting.status === 'ongoing' 
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200 shadow-sm' 
                                : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-700'
                            }`}
                        >
                            {meeting.status === 'ongoing' ? (
                                <>
                                    <Video className="w-3 h-3" /> Tham Gia Ngay
                                </>
                            ) : (
                                <>
                                    <Video className="w-3 h-3" /> Tham gia Cuộc họp
                                </>
                            )}
                        </button>
                    </div>
                ))}
            </div>
        </div>
      )}

      {/* Floating Bubble Trigger */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`group relative flex items-center justify-center w-14 h-14 rounded-full shadow-xl transition-all duration-300 hover:scale-105 ${
            isOpen ? 'bg-gray-800 text-white rotate-90' : 'bg-emerald-600 text-white'
        }`}
      >
        {isOpen ? (
            <X className="w-6 h-6" />
        ) : (
            <>
                <Video className="w-6 h-6 animate-bounce-slow" />
                {count > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold flex items-center justify-center rounded-full border-2 border-white">
                        {count}
                    </span>
                )}
                <span className="absolute right-full mr-3 bg-gray-900 text-white text-xs font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    {count} cuộc họp
                </span>
            </>
        )}
      </button>
    </div>
  );
};
