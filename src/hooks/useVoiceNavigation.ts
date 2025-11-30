import { useState, useEffect, useCallback, useRef } from 'react';

// Extend Window interface for Web Speech API
interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export type VoiceCommand = {
  command: string;
  action: string;
  description: string;
};

export type VoiceNavigationState = {
  isListening: boolean;
  isSupported: boolean;
  lastCommand: string | null;
  error: string | null;
  feedback: string | null;
};

export type VoiceCommandHandler = (command: string, transcript: string) => boolean;

// Available voice commands for navigation
export const VOICE_COMMANDS: VoiceCommand[] = [
  { command: 'tracker', action: 'navigate', description: 'Go to Exercise Tracker' },
  { command: 'exercise tracker', action: 'navigate', description: 'Go to Exercise Tracker' },
  { command: 'progress', action: 'navigate', description: 'Go to Progress Chart' },
  { command: 'progress chart', action: 'navigate', description: 'Go to Progress Chart' },
  { command: 'planner', action: 'navigate', description: 'Go to 5-3-1 Planner' },
  { command: '531 planner', action: 'navigate', description: 'Go to 5-3-1 Planner' },
  { command: 'five three one', action: 'navigate', description: 'Go to 5-3-1 Planner' },
  { command: 'logger', action: 'navigate', description: 'Go to Workout Logger' },
  { command: 'workout logger', action: 'navigate', description: 'Go to Workout Logger' },
  { command: 'log workout', action: 'navigate', description: 'Go to Workout Logger' },
  { command: 'plates', action: 'navigate', description: 'Go to Plate Calculator' },
  { command: 'plate calculator', action: 'navigate', description: 'Go to Plate Calculator' },
  { command: 'calculate plates', action: 'navigate', description: 'Go to Plate Calculator' },
  { command: 'export', action: 'navigate', description: 'Go to Data Export' },
  { command: 'data export', action: 'navigate', description: 'Go to Data Export' },
  { command: 'help', action: 'help', description: 'Show available voice commands' },
  { command: 'commands', action: 'help', description: 'Show available voice commands' },
  { command: 'stop', action: 'stop', description: 'Stop listening' },
  { command: 'cancel', action: 'stop', description: 'Stop listening' },
];

export const useVoiceNavigation = (onNavigate?: (tab: string) => void) => {
  const [state, setState] = useState<VoiceNavigationState>({
    isListening: false,
    isSupported: false,
    lastCommand: null,
    error: null,
    feedback: null,
  });

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const customHandlersRef = useRef<VoiceCommandHandler[]>([]);
  const onNavigateRef = useRef(onNavigate);

  // Keep ref updated
  useEffect(() => {
    onNavigateRef.current = onNavigate;
  }, [onNavigate]);

  // Check if speech recognition is supported
  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    setState(prev => ({
      ...prev,
      isSupported: !!SpeechRecognitionAPI,
    }));
  }, []);

  // Parse transcript to find matching commands
  const parseCommand = useCallback((transcript: string): { command: string; tab: string | null } | null => {
    const lowerTranscript = transcript.toLowerCase().trim();
    
    // Check for navigation commands
    for (const cmd of VOICE_COMMANDS) {
      if (lowerTranscript.includes(cmd.command)) {
        if (cmd.action === 'navigate') {
          // Map command to tab
          let tab: string | null = null;
          if (cmd.command.includes('tracker') || cmd.command === 'tracker') tab = 'tracker';
          else if (cmd.command.includes('progress')) tab = 'progress';
          else if (cmd.command.includes('planner') || cmd.command.includes('five three one') || cmd.command.includes('531')) tab = 'planner';
          else if (cmd.command.includes('logger') || cmd.command.includes('log workout')) tab = 'logger';
          else if (cmd.command.includes('plate') || cmd.command.includes('calculate')) tab = 'plates';
          else if (cmd.command.includes('export')) tab = 'export';
          
          return { command: cmd.command, tab };
        }
        return { command: cmd.command, tab: null };
      }
    }
    
    return null;
  }, []);

  // Stop listening - defined before initializeRecognition to avoid circular dependency
  const stopListeningInternal = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setState(prev => ({
      ...prev,
      isListening: false,
      feedback: null,
    }));
  }, []);

  // Initialize speech recognition
  const initializeRecognition = useCallback(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return null;

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setState(prev => ({
        ...prev,
        isListening: true,
        error: null,
        feedback: 'Listening... Say a command',
      }));
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[event.resultIndex][0].transcript;
      
      // First, try custom handlers
      let handled = false;
      for (const handler of customHandlersRef.current) {
        if (handler(transcript.toLowerCase(), transcript)) {
          handled = true;
          break;
        }
      }

      if (!handled) {
        // Try built-in navigation commands
        const parsed = parseCommand(transcript);
        
        if (parsed) {
          setState(prev => ({
            ...prev,
            lastCommand: parsed.command,
            feedback: `Recognized: "${parsed.command}"`,
          }));

          if (parsed.tab && onNavigateRef.current) {
            onNavigateRef.current(parsed.tab);
            setState(prev => ({
              ...prev,
              feedback: `Navigating to ${parsed.tab}`,
            }));
          } else if (parsed.command === 'help' || parsed.command === 'commands') {
            setState(prev => ({
              ...prev,
              feedback: 'Available commands: tracker, progress, planner, logger, plates, export, help, stop',
            }));
          } else if (parsed.command === 'stop' || parsed.command === 'cancel') {
            stopListeningInternal();
            return;
          }
        } else {
          setState(prev => ({
            ...prev,
            lastCommand: transcript,
            feedback: `Command not recognized: "${transcript}". Say "help" for available commands.`,
          }));
        }
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      let errorMessage = 'Speech recognition error';
      switch (event.error) {
        case 'not-allowed':
          errorMessage = 'Microphone access denied. Please allow microphone access.';
          break;
        case 'no-speech':
          errorMessage = 'No speech detected. Please try again.';
          break;
        case 'network':
          errorMessage = 'Network error. Please check your connection.';
          break;
        case 'aborted':
          errorMessage = 'Speech recognition aborted.';
          break;
        default:
          errorMessage = `Speech recognition error: ${event.error}`;
      }
      
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isListening: false,
        feedback: null,
      }));
    };

    recognition.onend = () => {
      setState(prev => ({
        ...prev,
        isListening: false,
      }));
    };

    return recognition;
  }, [parseCommand, stopListeningInternal]);

  // Start listening
  const startListening = useCallback(() => {
    if (!state.isSupported) {
      setState(prev => ({
        ...prev,
        error: 'Speech recognition is not supported in this browser.',
      }));
      return;
    }

    // Stop any existing recognition
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }

    const recognition = initializeRecognition();
    if (recognition) {
      recognitionRef.current = recognition;
      try {
        recognition.start();
      } catch (err) {
        const errorMessage = err instanceof Error 
          ? `Failed to start speech recognition: ${err.message}`
          : 'Failed to start speech recognition. Please try again.';
        setState(prev => ({
          ...prev,
          error: errorMessage,
        }));
      }
    }
  }, [state.isSupported, initializeRecognition]);

  // Public stop listening
  const stopListening = stopListeningInternal;

  // Toggle listening
  const toggleListening = useCallback(() => {
    if (state.isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [state.isListening, startListening, stopListening]);

  // Register a custom command handler
  const registerHandler = useCallback((handler: VoiceCommandHandler) => {
    customHandlersRef.current.push(handler);
    return () => {
      customHandlersRef.current = customHandlersRef.current.filter(h => h !== handler);
    };
  }, []);

  // Clear feedback after a delay
  useEffect(() => {
    if (state.feedback) {
      const timer = setTimeout(() => {
        setState(prev => ({
          ...prev,
          feedback: null,
        }));
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [state.feedback]);

  // Clear error after a delay
  useEffect(() => {
    if (state.error) {
      const timer = setTimeout(() => {
        setState(prev => ({
          ...prev,
          error: null,
        }));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [state.error]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  return {
    ...state,
    startListening,
    stopListening,
    toggleListening,
    registerHandler,
    availableCommands: VOICE_COMMANDS,
  };
};
