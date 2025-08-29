import { useState, useRef, useEffect } from 'react';
import { Crown, Sparkles } from 'lucide-react';
import ChatMessage from './components/ChatMessage';
import VoiceRecorder from './components/VoiceRecorder';
import TextInput from './components/TextInput';
import { transcribeAudio, sendTextMessage , getOrCreateSessionId} from './utils/api';
import { ChatMessage as ChatMessageType } from './types';
import AvatarVideo from './components/AvatarVideo';

function App() {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // ... (all your functions like playAudioResponse, etc. remain unchanged)
  /**
   * Plays the audio response from a given URL.
   * @param {string | null | undefined} audioUrl - The URL of the audio file to play.
   */
  const playAudioResponse = async (audioUrl?: string | null) => {
    if (!audioUrl) {
      setIsSpeaking(false);
      return;
    }
    
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    
    // Stop any currently playing audio
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    audioRef.current.src = audioUrl;
    
    try {
      setIsSpeaking(true);
      await audioRef.current.play();
      // Set up listeners for when the audio ends or errors out
      audioRef.current.onended = () => setIsSpeaking(false);
      audioRef.current.onerror = () => {
        console.error("Error playing audio.");
        setIsSpeaking(false);
      };
    } catch (error) {
      console.error('Failed to play audio response:', error);
      setIsSpeaking(false);
    }
  };

  /**
   * Scrolls the chat container to the latest message.
   */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Effect to scroll to the bottom whenever messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Effect to set the initial welcome message
  useEffect(() => {
    const welcomeMessage: ChatMessageType = {
      id: 'welcome',
      type: 'ganesh',
      content: 'Welcome, devotee',
      timestamp: new Date(),
      ganeshResponse: {
        lang: 'en',
        blessing_open: 'Om Gam Ganapataye Namaha',
        answer: 'Welcome to my divine presence. I am here to remove obstacles and guide you on your spiritual journey. You may speak to me or type your questions.',
        blessing_close: 'May wisdom and prosperity be with you',
        refusal: false
      }
    };
    setMessages([welcomeMessage]);
  }, []);

  /**
   * Handles the process of sending a voice recording to the API.
   * @param {Blob} audioBlob - The recorded audio data.
   */
  const handleVoiceRecording = async (audioBlob: Blob) => {
    setIsLoading(true);
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsSpeaking(false);
    
    try {
      const sessionId = getOrCreateSessionId();
      const response = await transcribeAudio(audioBlob,sessionId);

      if (response?.transcription && response?.ganesha_response?.answer) {
        const userMessage: ChatMessageType = {
          id: Date.now().toString() + '-user',
          type: 'user',
          content: response.transcription,
          timestamp: new Date(),
          isVoice: true
        };
        
        const ganeshMessage: ChatMessageType = {
          id: Date.now().toString() + '-ganesh',
          type: 'ganesh',
          content: response.ganesha_response.answer,
          timestamp: new Date(),
          ganeshResponse: response.ganesha_response,
          audioUrl: response.audio_url
        };
        
        setMessages(prev => [...prev, userMessage, ganeshMessage]);
        
        await playAudioResponse(response.audio_url);

      } else {
        throw new Error("Invalid response structure from API.");
      }

    } catch (error) {
      console.error('Voice processing error:', error);
      
      const errorMessage: ChatMessageType = {
        id: Date.now().toString() + '-error',
        type: 'ganesh',
        content: 'I apologize, but I could not hear your message clearly. Please try again.',
        timestamp: new Date(),
        ganeshResponse: {
          lang: 'en',
          blessing_open: '',
          answer: 'I apologize, but I could not hear your message clearly. Please try again or type your question.',
          blessing_close: '',
          refusal: true,
          refusal_reason: 'Audio transcription failed or response invalid'
        }
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles sending a text message to the API.
   * @param {string} message - The text message from the user.
   */
  const handleTextMessage = async (message: string) => {
    const userMessage: ChatMessageType = {
      id: Date.now().toString() + '-user',
      type: 'user',
      content: message,
      timestamp: new Date(),
      isVoice: false
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsSpeaking(false);

    try {
      const sessionId = getOrCreateSessionId(); 
      const response = await sendTextMessage(message, sessionId);
      if (response?.ganesha_response?.answer) {
        const ganeshMessage: ChatMessageType = {
          id: Date.now().toString() + '-ganesh',
          type: 'ganesh',
          content: response.ganesha_response.answer,
          timestamp: new Date(),
          ganeshResponse: response.ganesha_response,
          audioUrl: response.audio_url
        };

        setMessages(prev => [...prev, ganeshMessage]);
        await playAudioResponse(response.audio_url);
      } else {
        throw new Error("Invalid response structure from API.");
      }
      
    } catch (error) {
      console.error('Text message error:', error);
      
      const errorMessage: ChatMessageType = {
        id: Date.now().toString() + '-error',
        type: 'ganesh',
        content: 'I apologize for the difficulty. Please try again.',
        timestamp: new Date(),
        ganeshResponse: {
          lang: 'en',
          blessing_open: '',
          answer: 'I apologize for the difficulty. Please try again with your question.',
          blessing_close: '',
          refusal: true,
          refusal_reason: 'Message processing failed'
        }
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-orange-50 via-red-50 to-yellow-50 font-sans">
      {/* Header takes its natural height */}
      <header className="bg-gradient-to-r from-orange-600 to-red-700 shadow-lg w-full z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-center gap-3">
            <div className="p-2 bg-white/20 rounded-full">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-white tracking-wide">Ganapathi</h1>
              <p className="text-orange-100 text-xs">Divine Wisdom & Guidance</p>
            </div>
            <div className="p-2 bg-white/20 rounded-full">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </header>

      {/* STEP 2: Make the main area grow to fill the space and prevent it from overflowing. */}
      <main className="flex-1 min-h-0 w-full max-w-7xl mx-auto p-4 flex flex-col lg:flex-row gap-6">
        
        {/* Left Column: Avatar */}
        <div className="lg:w-1/2 flex items-center justify-center">
          <AvatarVideo isSpeaking={isSpeaking} className="w-full max-w-md lg:max-w-none rounded-2xl shadow-2xl" />
        </div>

        {/* Right Column: Chat Interface */}
        {/* STEP 3: The chat box must also fill its parent's height and handle its own vertical layout. */}
        <div className="lg:w-1/2 flex flex-col flex-1 min-h-0">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg flex-1 min-h-0 flex flex-col border border-orange-100">
            
            {/* STEP 4: This is the ONLY scrollable part. It grows to fill space and scrolls when content overflows. */}
            <div className="flex-1 min-h-0 p-4 space-y-4 overflow-y-auto">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              {isLoading && (
                <div className="flex justify-start items-center gap-2 mb-4">
                    <div className="w-8 h-8 flex-shrink-0 bg-orange-100 rounded-full p-1.5">
                      <img src="https://placehold.co/32x32/FFEFE6/F97316?text=G" alt="Ganesha Avatar" className="w-full h-full rounded-full" />
                    </div>
                  <span className="text-sm text-gray-500 bg-gray-100 px-3 py-2 rounded-lg">Ganesha is responding...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* The input area takes its natural height at the bottom */}
            <div className="border-t border-orange-100 px-4 py-4 bg-white/50 rounded-b-2xl">
              <div className="space-y-3">
                <div className="flex items-center justify-center">
                  <VoiceRecorder 
                    onRecordingComplete={handleVoiceRecording}
                    disabled={isLoading}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-px bg-orange-200"></div>
                  <span className="text-xs text-gray-400 px-2">or type</span>
                  <div className="flex-1 h-px bg-orange-200"></div>
                </div>
                <TextInput 
                  onSendMessage={handleTextMessage}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer takes its natural height */}
      <footer className="text-center py-4 text-gray-500 text-xs">
        <p>🕉️ May Lord Ganesha remove all obstacles from your path 🕉️</p>
      </footer>
    </div>
  );
}

export default App;