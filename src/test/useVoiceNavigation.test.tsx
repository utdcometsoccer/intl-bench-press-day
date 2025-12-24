import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useVoiceNavigation, VOICE_COMMANDS } from '../hooks/useVoiceNavigation';

// Mock SpeechRecognition
class MockSpeechRecognition {
  continuous = false;
  interimResults = false;
  lang = '';
  onstart: (() => void) | null = null;
  onresult: ((event: { results: { 0: { 0: { transcript: string } } }; resultIndex: number }) => void) | null = null;
  onerror: ((event: { error: string }) => void) | null = null;
  onend: (() => void) | null = null;

  start() {
    if (this.onstart) {
      this.onstart();
    }
  }

  stop() {
    if (this.onend) {
      this.onend();
    }
  }

  abort() {
    if (this.onend) {
      this.onend();
    }
  }

  // Helper to simulate a speech result
  simulateResult(transcript: string) {
    if (this.onresult) {
      this.onresult({
        results: { 0: { 0: { transcript } } },
        resultIndex: 0,
      });
    }
  }

  // Helper to simulate an error
  simulateError(error: string) {
    if (this.onerror) {
      this.onerror({ error });
    }
  }
}

let mockRecognitionInstance: MockSpeechRecognition | null = null;

// Type for window with SpeechRecognition for cleanup operations in tests
type WindowWithSpeechRecognition = { SpeechRecognition?: unknown };

describe('useVoiceNavigation', () => {
  beforeEach(() => {
    // Reset mock instance
    mockRecognitionInstance = null;
    
    // Mock the SpeechRecognition API using Object.defineProperty to bypass TypeScript's strict type checking
    const MockClass = class extends MockSpeechRecognition {
      constructor() {
        super();
        // Assign directly to module-level variable
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        mockRecognitionInstance = this;
      }
    };
    Object.defineProperty(window, 'SpeechRecognition', {
      value: MockClass,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    // Clean up
    Object.defineProperty(window, 'SpeechRecognition', {
      value: undefined,
      writable: true,
      configurable: true,
    });
    mockRecognitionInstance = null;
    vi.clearAllTimers();
  });

  it('should detect speech recognition support', () => {
    const { result } = renderHook(() => useVoiceNavigation());
    expect(result.current.isSupported).toBe(true);
  });

  it('should detect when speech recognition is not supported', () => {
    delete (window as WindowWithSpeechRecognition).SpeechRecognition;
    
    const { result } = renderHook(() => useVoiceNavigation());
    expect(result.current.isSupported).toBe(false);
  });

  it('should start listening when startListening is called', () => {
    const { result } = renderHook(() => useVoiceNavigation());
    
    expect(result.current.isListening).toBe(false);
    
    act(() => {
      result.current.startListening();
    });
    
    expect(result.current.isListening).toBe(true);
    expect(result.current.feedback).toBe('Listening... Say a command');
  });

  it('should stop listening when stopListening is called', () => {
    const { result } = renderHook(() => useVoiceNavigation());
    
    act(() => {
      result.current.startListening();
    });
    
    expect(result.current.isListening).toBe(true);
    
    act(() => {
      result.current.stopListening();
    });
    
    expect(result.current.isListening).toBe(false);
  });

  it('should toggle listening state', () => {
    const { result } = renderHook(() => useVoiceNavigation());
    
    expect(result.current.isListening).toBe(false);
    
    act(() => {
      result.current.toggleListening();
    });
    
    expect(result.current.isListening).toBe(true);
    
    act(() => {
      result.current.toggleListening();
    });
    
    expect(result.current.isListening).toBe(false);
  });

  it('should call onNavigate with correct tab for navigation commands', () => {
    const mockNavigate = vi.fn();
    const { result } = renderHook(() => useVoiceNavigation(mockNavigate));
    
    act(() => {
      result.current.startListening();
    });
    
    // Simulate saying "progress"
    act(() => {
      mockRecognitionInstance?.simulateResult('progress');
    });
    
    expect(mockNavigate).toHaveBeenCalledWith('progress');
  });

  it('should recognize tracker command', () => {
    const mockNavigate = vi.fn();
    const { result } = renderHook(() => useVoiceNavigation(mockNavigate));
    
    act(() => {
      result.current.startListening();
    });
    
    act(() => {
      mockRecognitionInstance?.simulateResult('go to exercise tracker');
    });
    
    expect(mockNavigate).toHaveBeenCalledWith('tracker');
  });

  it('should recognize planner command', () => {
    const mockNavigate = vi.fn();
    const { result } = renderHook(() => useVoiceNavigation(mockNavigate));
    
    act(() => {
      result.current.startListening();
    });
    
    act(() => {
      mockRecognitionInstance?.simulateResult('five three one planner');
    });
    
    expect(mockNavigate).toHaveBeenCalledWith('planner');
  });

  it('should recognize logger command', () => {
    const mockNavigate = vi.fn();
    const { result } = renderHook(() => useVoiceNavigation(mockNavigate));
    
    act(() => {
      result.current.startListening();
    });
    
    act(() => {
      mockRecognitionInstance?.simulateResult('workout logger');
    });
    
    expect(mockNavigate).toHaveBeenCalledWith('logger');
  });

  it('should recognize plates command', () => {
    const mockNavigate = vi.fn();
    const { result } = renderHook(() => useVoiceNavigation(mockNavigate));
    
    act(() => {
      result.current.startListening();
    });
    
    act(() => {
      mockRecognitionInstance?.simulateResult('plate calculator');
    });
    
    expect(mockNavigate).toHaveBeenCalledWith('plates');
  });

  it('should recognize export command', () => {
    const mockNavigate = vi.fn();
    const { result } = renderHook(() => useVoiceNavigation(mockNavigate));
    
    act(() => {
      result.current.startListening();
    });
    
    act(() => {
      mockRecognitionInstance?.simulateResult('data export');
    });
    
    expect(mockNavigate).toHaveBeenCalledWith('export');
  });

  it('should show feedback for unrecognized commands', () => {
    const { result } = renderHook(() => useVoiceNavigation());
    
    act(() => {
      result.current.startListening();
    });
    
    act(() => {
      mockRecognitionInstance?.simulateResult('random gibberish');
    });
    
    expect(result.current.feedback).toContain('Command not recognized');
    expect(result.current.lastCommand).toBe('random gibberish');
  });

  it('should handle speech recognition errors', () => {
    const { result } = renderHook(() => useVoiceNavigation());
    
    act(() => {
      result.current.startListening();
    });
    
    act(() => {
      mockRecognitionInstance?.simulateError('not-allowed');
    });
    
    expect(result.current.error).toBe('Microphone access denied. Please allow microphone access.');
    expect(result.current.isListening).toBe(false);
  });

  it('should provide available voice commands list', () => {
    const { result } = renderHook(() => useVoiceNavigation());
    
    expect(result.current.availableCommands).toEqual(VOICE_COMMANDS);
    expect(result.current.availableCommands.length).toBeGreaterThan(0);
  });

  it('should show error when speech recognition is not supported and trying to start', () => {
    delete (window as WindowWithSpeechRecognition).SpeechRecognition;
    
    const { result } = renderHook(() => useVoiceNavigation());
    
    act(() => {
      result.current.startListening();
    });
    
    expect(result.current.error).toBe('Speech recognition is not supported in this browser.');
  });

  it('should register and use custom handlers', () => {
    const customHandler = vi.fn().mockReturnValue(true);
    const { result } = renderHook(() => useVoiceNavigation());
    
    let unregister: () => void;
    act(() => {
      unregister = result.current.registerHandler(customHandler);
    });
    
    act(() => {
      result.current.startListening();
    });
    
    act(() => {
      mockRecognitionInstance?.simulateResult('custom command');
    });
    
    expect(customHandler).toHaveBeenCalledWith('custom command', 'custom command');
    
    // Cleanup
    act(() => {
      unregister();
    });
  });
});
