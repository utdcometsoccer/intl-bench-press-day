# Rest Timer Feature

## Overview

The Rest Timer feature helps users track rest periods between workout sets with configurable durations, audio and vibration notifications, and visual countdown display. It integrates directly into the Workout Logger for seamless workout tracking.

## How It Works

### Starting the Timer

When logging a workout:

- Click the "⏱️ Rest" button next to any workout set
- Timer appears with circular progress visualization
- Optionally auto-starts based on user preferences
- Loads user's preferred rest duration (default: 90 seconds)

### Timer Display

The timer shows:

- **Circular Progress Bar**: Visual countdown with animated progress ring
- **Time Display**: Minutes and seconds (e.g., "1:30")
- **Preset Buttons**: Quick selection for common rest periods
- **Custom Input**: Enter any duration from 1-3600 seconds
- **Control Buttons**: Start/Pause, Reset, and Close

### Notifications

When the timer completes:

- **Audio**: 800Hz sine wave beep (0.5 seconds)
- **Vibration**: Pattern of 200ms on, 100ms off (5 pulses) on supported devices
- Timer automatically stops

### Timer Controls

- **Start/Pause**: Toggle timer running state
- **Reset**: Return to selected preset duration
- **Close (✕)**: Dismiss the timer
- **+30s/-30s**: Adjust time in 30-second increments
- **Preset Buttons**: 30s, 1min, 90s, 2min, 3min, 5min
- **Custom**: Enter any duration

## User Configuration

### Settings Location

Navigate to Settings → Rest Timer section to configure:

### Available Settings

1. **Preferred Rest Time**
   - Default: 90 seconds
   - Options: 30s, 1min, 90s, 2min, 3min, 5min
   - Automatically loads when timer is started

2. **Auto-Start Timer**
   - Default: Off
   - When enabled, timer starts automatically after clicking "Rest" button
   - When disabled, manual Start button press required

### Saving Preferences

All preferences are automatically saved to `localStorage` and persist across sessions.

## Manual Testing Steps

### Basic Timer Functionality

1. **Start the application**

   ```bash
   npm run dev
   ```

2. **Navigate to Workout Logger**
   - Ensure you have an active workout plan
   - Select any workout with sets

3. **Start Rest Timer**
   - Click "⏱️ Rest" button on any set row
   - Timer should appear below the main sets section
   - Verify time displays correctly (default 1:30)

4. **Test Timer Controls**
   - Click "▶ Start" - timer should count down
   - Click "⏸ Pause" - timer should pause
   - Click "🔄 Reset" - timer should return to initial time
   - Click "✕" - timer should close

5. **Test Extend/Reduce**
   - Click "+30s" - time should increase by 30 seconds
   - Click "-30s" - time should decrease by 30 seconds
   - Verify -30s button disabled when time < 30 seconds

6. **Test Preset Selection**
   - Click "30s" button - timer should change to 0:30
   - Click "2min" button - timer should change to 2:00
   - Verify active preset is highlighted

7. **Test Custom Time**
   - Click "Custom" button
   - Enter "45" in the input field
   - Click "Set" button
   - Timer should display 0:45

8. **Test Completion**
   - Set timer to 3 seconds (custom)
   - Start timer
   - Wait for completion
   - Verify audio beep plays
   - On mobile: verify vibration occurs
   - Timer should display 0:00 and stop

### Settings Integration

1. **Open Settings**
   - Navigate to Settings page
   - Scroll to "Rest Timer" section

2. **Change Preferred Rest Time**
   - Select "2 minutes" from dropdown
   - Return to Workout Logger
   - Start rest timer
   - Verify timer starts at 2:00

3. **Test Auto-Start**
   - Return to Settings
   - Enable "Auto-start timer after sets" toggle
   - Return to Workout Logger
   - Click "⏱️ Rest" button
   - Verify timer starts automatically (countdown begins immediately)

4. **Verify Persistence**
   - Close browser tab
   - Reopen application
   - Check Settings - preferences should be saved
   - Start timer - should use saved preferences

## Accessibility Features

### Keyboard Navigation

- All buttons are keyboard accessible
- Tab order follows logical flow
- Enter/Space activates buttons
- Focus visible on all interactive elements

### Screen Reader Support

- `role="timer"` on timer container
- `aria-live="polite"` on time display for live updates
- `aria-atomic="true"` ensures entire time is announced
- All buttons have descriptive `aria-label` attributes
- Custom input has proper label association

### Visual Accessibility

- High contrast colors for time display
- Active states clearly indicated
- Disabled buttons have reduced opacity
- Focus outlines on all interactive elements (2px solid)
- Sufficient color contrast ratios (WCAG AA compliant)

### Reduced Motion

- Respects `prefers-reduced-motion` media query
- Disables progress bar animation when motion reduction preferred
- Disables button transition animations

## Technical Details

### Files Created

- `src/components/RestTimer.tsx`: Main component implementation (325 lines)
- `src/components/RestTimer.css`: Component styling (242 lines)
- `src/test/RestTimer.test.tsx`: Comprehensive test suite (337 lines)

### Files Modified

- `src/components/WorkoutLogger.tsx`: Timer integration
- `src/components/NotificationSettings.tsx`: Settings UI
- `src/services/userPreferencesStorage.ts`: Preference storage
- `src/App.css`: Rest button styling

### Dependencies Used

- **React Hooks**: useState, useEffect, useCallback, useRef
- **Web Audio API**: For audio notification (AudioContext, OscillatorNode, GainNode)
- **Vibration API**: For mobile haptic feedback
- **localStorage**: For preference persistence via userPreferencesStorage

### State Management

Component state:

- `timeRemaining`: Current countdown time in seconds
- `isRunning`: Whether timer is actively counting down
- `selectedPreset`: Currently selected preset duration
- `customTime`: User's custom input value
- `showCustomInput`: Toggle for custom input visibility

Refs:

- `intervalRef`: Stores setInterval ID for countdown
- `audioContextRef`: Single AudioContext instance for audio playback
- `hasCompletedRef`: Prevents duplicate completion callbacks

Props:

- `initialTime`: Starting duration in seconds (default: 90)
- `onComplete`: Callback fired when timer reaches 0
- `onDismiss`: Callback fired when timer is closed
- `autoStart`: Whether to start automatically (default: false)
- `show`: Controls visibility (default: true)

### Audio Implementation

- Single `AudioContext` created on component mount
- Reused for all beep sounds (performance optimization)
- Properly cleaned up on unmount
- 800Hz sine wave with exponential gain ramp
- Graceful fallback if AudioContext unavailable

### Integration Points

1. **WorkoutLogger**
   - State: `showRestTimer`, `restTimerDuration`, `autoStartRestTimer`
   - Loads preferences on initialization
   - Passes state values to RestTimer component
   - Handlers for complete/dismiss events

2. **NotificationSettings**
   - Dropdown for preferred rest time selection
   - Toggle for auto-start preference
   - Immediate save on change
   - Settings grouped with other workout preferences

3. **userPreferencesStorage**
   - New fields: `preferredRestTime`, `autoStartRestTimer`
   - Methods: `setPreferredRestTime()`, `setAutoStartRestTimer()`
   - Default values in `DEFAULT_PREFERENCES`

## Code Quality

### Testing

- 28 test cases covering all functionality
- Tests for timer logic, UI interactions, accessibility
- Mock Web Audio API and Vibration API
- Uses Vitest fake timers for precise control
- 100% pass rate with all existing tests maintained

### Linting

- ESLint passes with 0 errors
- Strict TypeScript mode compliance
- No `any` types used (except for browser API type guards)
- Proper type definitions for all functions

### Build

- Production build successful
- PWA service worker integration maintained
- No build warnings or errors
- Optimized bundle size

### Security

- CodeQL scan: 0 vulnerabilities found
- No secrets or sensitive data
- Input validation on custom times (1-3600 seconds)
- Safe DOM manipulation
- No XSS vulnerabilities

## Performance Considerations

### Optimizations

1. **Single AudioContext**: Created once, reused for all beeps
2. **useCallback**: Memoized functions to prevent unnecessary re-renders
3. **Refs for DOM operations**: Avoids state updates when not needed
4. **Cleanup**: Proper interval and AudioContext cleanup
5. **Conditional rendering**: Timer only rendered when visible

### Resource Usage

- Minimal memory footprint (~2KB compressed CSS)
- Efficient countdown using setInterval (1 second interval)
- No memory leaks (verified with cleanup functions)
- AudioContext properly closed on unmount

## Browser Compatibility

### Supported Features

- **AudioContext**: Chrome 35+, Firefox 25+, Safari 14.1+, Edge 12+
- **Vibration API**: Chrome 32+, Firefox 16+, Opera 19+ (mobile focus)
- **localStorage**: All modern browsers
- **CSS Grid/Flexbox**: All modern browsers

### Fallbacks

- AudioContext: Warning logged if unavailable, no error thrown
- Vibration: Silently fails if not supported
- Visual countdown works in all browsers
- localStorage: Graceful degradation if blocked

## Future Enhancements

Potential improvements for future PRs:

- Sound selection (different beep tones or notification sounds)
- Custom vibration patterns
- Timer history/analytics (average rest times)
- Per-exercise rest time recommendations
- Integration with workout templates
- Progress notifications (e.g., "30 seconds remaining")
- Dark/light theme customization for timer display
- Timer shortcuts in other workout views
- Multiple simultaneous timers for supersets
- Rest time recommendations based on exercise intensity
