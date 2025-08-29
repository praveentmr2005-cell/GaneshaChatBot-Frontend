import React from 'react';
import { User, Crown, Volume2 } from 'lucide-react';
import { ChatMessage as ChatMessageType } from '../types';

interface Props {
  message: ChatMessageType;
}

export default function ChatMessage({ message }: Props) {
  const isUser = message.type === 'user';

  const playAudio = () => {
    if (message.audioUrl) {
      const audio = new Audio(message.audioUrl);
      audio.play().catch(console.error);
    }
  };
  return (
    <div className={`flex gap-3 mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center shadow-lg">
          <Crown className="w-5 h-5 text-white" />
        </div>
      )}
      
      <div className={`max-w-[80%] ${isUser ? 'order-first' : ''}`}>
        <div
          className={`rounded-2xl px-4 py-3 shadow-sm ${
            isUser
              ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white ml-auto'
              : 'bg-white text-gray-800 border border-orange-100'
          }`}
        >
          {!isUser && message.ganeshResponse ? (
            <div className="space-y-3">
              {message.ganeshResponse.blessing_open && (
                <p className="text-sm text-orange-600 font-medium italic">
                  {message.ganeshResponse.blessing_open}
                </p>
              )}
              <p className="text-gray-800 leading-relaxed">
                {message.ganeshResponse.answer}
              </p>
              {message.ganeshResponse.blessing_close && (
                <p className="text-sm text-orange-600 font-medium italic">
                  {message.ganeshResponse.blessing_close}
                </p>
              )}
              {message.audioUrl && (
                <button
                  onClick={playAudio}
                  className="flex items-center gap-2 mt-2 px-3 py-1 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-full text-sm transition-colors"
                >
                  <Volume2 className="w-4 h-4" />
                  Play Audio Response
                </button>
              )}
            </div>
          ) : (
            <p className="leading-relaxed">{message.content}</p>
          )}
        </div>
        
        <div className={`flex items-center gap-2 mt-1 text-xs text-gray-500 ${isUser ? 'justify-end' : 'justify-start'}`}>
          {message.isVoice && (
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
              Voice
            </span>
          )}
          <span>{message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
          <User className="w-5 h-5 text-white" />
        </div>
      )}
    </div>
  );
}