// --- API Utility Functions (utils/api.ts) ---

const API_BASE_URL = 'http://localhost:5000';

/**
 * Creates and retrieves a unique session ID from localStorage.
 * @returns {string} The session ID.
 */
export const getOrCreateSessionId = (): string => {
  let sessionId = localStorage.getItem('ganesha_session_id');
  if (!sessionId) {
    // A simple way to generate a unique enough ID for this purpose
    sessionId = Date.now().toString(36) + Math.random().toString(36).substring(2);
    localStorage.setItem('ganesha_session_id', sessionId);
    console.log("New session started:", sessionId);
  }
  return sessionId;
};

/**
 * Sends an audio blob to the backend for transcription and response.
 * @param {Blob} audioBlob - The recorded audio data.
 * @param {string} sessionId - The user's unique session ID.
 * @returns {Promise<any>} The JSON response from the server.
 */
export const transcribeAudio = async (audioBlob: Blob, sessionId: string): Promise<any> => {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.webm');
  // **IMPORTANT**: Send the session_id along with the audio file
  formData.append('session_id', sessionId);

  const response = await fetch(`${API_BASE_URL}/transcribe`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.details || 'Failed to transcribe audio');
  }
  return response.json();
};

/**
 * Sends a text message to the backend for a response.
 * @param {string} message - The user's text message.
 * @param {string} sessionId - The user's unique session ID.
 * @returns {Promise<any>} The JSON response from the server.
 */
export const sendTextMessage = async (message: string, sessionId: string): Promise<any> => {
  const response = await fetch(`${API_BASE_URL}/text-message`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    // **IMPORTANT**: Send the session_id in the JSON body
    body: JSON.stringify({ message, session_id: sessionId }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.details || 'Failed to send message');
  }
  return response.json();
};
