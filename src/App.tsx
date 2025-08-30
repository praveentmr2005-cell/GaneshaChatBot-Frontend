import { useState, useRef, useEffect } from 'react';
import { Crown, Sparkles, Volume2, VolumeX } from 'lucide-react'; // Import speaker icons
import ChatMessage from './components/ChatMessage';
import VoiceRecorder from './components/VoiceRecorder';
import TextInput from './components/TextInput';
import { transcribeAudio, sendTextMessage, getOrCreateSessionId } from './utils/api';
import { ChatMessage as ChatMessageType } from './types';
import AvatarVideo from './components/AvatarVideo';

function App() {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isTtsEnabled, setIsTtsEnabled] = useState(true); // --- NEW STATE FOR TTS TOGGLE ---
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const playAudioResponse = async (audioUrl?: string | null) => {
    // --- MODIFIED: Only play audio if TTS is enabled ---
    if (!audioUrl || !isTtsEnabled) {
      setIsSpeaking(false);
      return;
    }
    
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    
    audioRef.current.pause();
    // Add a timestamp to prevent the browser from caching the audio file
    audioRef.current.src = `${audioUrl}?t=${new Date().getTime()}`;
    
    try {
      setIsSpeaking(true);
      await audioRef.current.play();
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const welcomeMessage: ChatMessageType = {
      id: 'welcome',
      type: 'ganesh',
      content: 'Welcome, devotee',
      timestamp: new Date(),
      ganeshResponse: {
        lang: 'en',
        blessing_open: 'Om Gam Ganapataye Namaha',
        answer: 'Welcome to my divine presence. I am here to remove obstacles and guide you. You may speak to me or type your questions.',
        blessing_close: 'May wisdom be with you',
        refusal: false
      }
    };
    setMessages([welcomeMessage]);
  }, []);

  const handleVoiceRecording = async (audioBlob: Blob) => {
    setIsLoading(true);
    if (audioRef.current) audioRef.current.pause();
    setIsSpeaking(false);
    
    try {
      const sessionId = getOrCreateSessionId();
      const response = await transcribeAudio(audioBlob, sessionId);

      if (response?.transcription && response?.ganesha_response?.answer) {
        const userMessage: ChatMessageType = { id: Date.now().toString() + '-user', type: 'user', content: response.transcription, timestamp: new Date(), isVoice: true };
        const ganeshMessage: ChatMessageType = { id: Date.now().toString() + '-ganesh', type: 'ganesh', content: response.ganesha_response.answer, timestamp: new Date(), ganeshResponse: response.ganesha_response, audioUrl: response.audio_url };
        
        setMessages(prev => [...prev, userMessage, ganeshMessage]);
        await playAudioResponse(response.audio_url);
      } else {
        throw new Error("Invalid response from API.");
      }
    } catch (error) {
      console.error('Voice processing error:', error);
      const errorMessage: ChatMessageType = { id: Date.now().toString() + '-error', type: 'ganesh', content: 'I apologize, but I could not hear your message clearly.', timestamp: new Date(), ganeshResponse: { lang: 'en', blessing_open: '', answer: 'I apologize, but I could not hear your message clearly. Please try again.', blessing_close: '', refusal: true, refusal_reason: 'Audio transcription failed' }};
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTextMessage = async (message: string) => {
    const userMessage: ChatMessageType = { id: Date.now().toString() + '-user', type: 'user', content: message, timestamp: new Date(), isVoice: false };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    
    if (audioRef.current) audioRef.current.pause();
    setIsSpeaking(false);

    try {
      const sessionId = getOrCreateSessionId();
      // --- MODIFIED: Pass the TTS toggle state to the API call ---
      const response = await sendTextMessage(message, sessionId, isTtsEnabled);

      if (response?.ganesha_response?.answer) {
        const ganeshMessage: ChatMessageType = { id: Date.now().toString() + '-ganesh', type: 'ganesh', content: response.ganesha_response.answer, timestamp: new Date(), ganeshResponse: response.ganesha_response, audioUrl: response.audio_url };
        setMessages(prev => [...prev, ganeshMessage]);
        // The playAudioResponse function will automatically respect the isTtsEnabled flag
        await playAudioResponse(response.audio_url);
      } else {
        throw new Error("Invalid response from API.");
      }
    } catch (error) {
      console.error('Text message error:', error);
      const errorMessage: ChatMessageType = { id: Date.now().toString() + '-error', type: 'ganesh', content: 'I apologize for the difficulty. Please try again.', timestamp: new Date(), ganeshResponse: { lang: 'en', blessing_open: '', answer: 'I apologize for the difficulty. Please try again.', blessing_close: '', refusal: true, refusal_reason: 'Message processing failed' } };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-orange-50 via-red-50 to-yellow-50 font-sans">
      <header className="bg-gradient-to-r from-orange-600 to-red-700 shadow-lg w-full z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-center gap-3 relative">
            <div className="p-2 bg-white/20 rounded-full"><Crown className="w-6 h-6 text-white" /></div>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-white tracking-wide">Ganapathi</h1>
              <p className="text-orange-100 text-xs">Divine Wisdom & Guidance</p>
            </div>
            <div className="p-2 bg-white/20 rounded-full"><Sparkles className="w-6 h-6 text-white" /></div>
            
            {/* --- NEW UI: TTS Toggle Button --- */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <button
                onClick={() => setIsTtsEnabled(!isTtsEnabled)}
                className={`p-2 rounded-full transition-all duration-300 ${isTtsEnabled ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-gray-300 text-gray-600 hover:bg-gray-400'}`}
                title={isTtsEnabled ? "Disable Ganesha's Voice" : "Enable Ganesha's Voice"}
              >
                {isTtsEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 min-h-0 w-full max-w-7xl mx-auto p-4 flex flex-col lg:flex-row gap-6">
        <div className="lg:w-1/2 flex items-center justify-center">
          <AvatarVideo isSpeaking={isSpeaking} className="w-full max-w-md lg:max-w-none rounded-2xl shadow-2xl" />
        </div>

        <div className="lg:w-1/2 flex flex-col flex-1 min-h-0">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg flex-1 min-h-0 flex flex-col border border-orange-100">
            <div className="flex-1 min-h-0 p-4 space-y-4 overflow-y-auto">
              {messages.map((message) => <ChatMessage key={message.id} message={message} />)}
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

            <div className="border-t border-orange-100 px-4 py-4 bg-white/50 rounded-b-2xl">
              <div className="space-y-3">
                <div className="flex items-center justify-center">
                  <VoiceRecorder onRecordingComplete={handleVoiceRecording} disabled={isLoading} />
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-px bg-orange-200"></div>
                  <span className="text-xs text-gray-400 px-2">or type</span>
                  <div className="flex-1 h-px bg-orange-200"></div>
                </div>
                <TextInput onSendMessage={handleTextMessage} disabled={isLoading} />
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="text-center py-4 text-gray-500 text-xs">
        <p>🕉️ May Lord Ganesha remove all obstacles from your path 🕉️</p>
      </footer>
    </div>
  );
}

export default App;
