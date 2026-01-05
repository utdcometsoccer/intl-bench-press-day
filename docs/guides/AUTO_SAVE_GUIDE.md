# Auto-Save Workout Sessions - Implementation Guide

## Overview

This document describes the auto-save functionality for workout sessions implemented in the International Bench Press Day fitness tracker application.

## Features Implemented

1. **Automatic Session Saving**: Workout sessions are automatically saved at configurable intervals
2. **User Configurable Settings**: Users can enable/disable auto-save and adjust the save interval
3. **Old Session Cleanup**: Incomplete workout sessions older than 3 hours are automatically discarded
4. **Manual Save Support**: Users can trigger manual saves when needed

## Core Components

### 1. User Preferences Storage

**File**: `src/services/userPreferencesStorage.ts`

Extended `UserPreferences` interface to include:

- `autoSaveEnabled: boolean` - Enable/disable auto-save (default: `true`)
- `autoSaveInterval: number` - Auto-save interval in seconds (default: `30`)

New methods:

- `setAutoSaveEnabled(enabled: boolean)` - Update auto-save preference
- `setAutoSaveInterval(seconds: number)` - Update auto-save interval

### 2. Workout Results Storage

**File**: `src/services/workoutResultsStorage.ts`

New methods:

- `getIncompleteWorkoutSessions()` - Get all incomplete workout sessions
- `deleteWorkoutSession(id: string)` - Delete a specific session
- `cleanupOldIncompleteSessions(maxAgeHours: number)` - Cleanup old incomplete sessions

### 3. useAutoSave Hook

**File**: `src/hooks/useAutoSave.ts`

Custom React hook for auto-saving workout sessions.

#### Usage Example

```typescript
import { useAutoSave, useSessionCleanup } from '../hooks/useAutoSave';
import type { WorkoutSession } from '../types';

function WorkoutComponent() {
  const [currentSession, setCurrentSession] = useState<WorkoutSession | null>(null);
  
  // Auto-save the session
  const { manualSave, isAutoSaveEnabled, autoSaveInterval } = useAutoSave(
    currentSession,
    {
      onSave: (session) => {
        console.log('Session auto-saved:', session.id);
      },
      onError: (error) => {
        console.error('Auto-save failed:', error);
      }
    }
  );
  
  // Cleanup old sessions on mount
  useSessionCleanup(3); // Cleanup sessions older than 3 hours
  
  // Manual save when user clicks button
  const handleSave = async () => {
    await manualSave();
  };
  
  return (
    <div>
      <p>Auto-save: {isAutoSaveEnabled ? 'Enabled' : 'Disabled'}</p>
      <p>Save interval: {autoSaveInterval}s</p>
      <button onClick={handleSave}>Save Now</button>
    </div>
  );
}
```

#### Hook Options

```typescript
interface UseAutoSaveOptions {
  enabled?: boolean;        // Override user preference
  interval?: number;        // Override user interval (in seconds)
  onSave?: (session: WorkoutSession) => void;    // Success callback
  onError?: (error: Error) => void;              // Error callback
}
```

#### Hook Return Value

```typescript
{
  manualSave: () => Promise<void>;  // Trigger manual save
  isAutoSaveEnabled: boolean;       // Current auto-save status
  autoSaveInterval: number;         // Current interval in seconds
}
```

### 4. User Interface

**File**: `src/components/NotificationSettings.tsx`

Extended the NotificationSettings component to include auto-save preferences:

- Toggle switch to enable/disable auto-save
- Dropdown to select save interval (15s, 30s, 1m, 2m, 5m)
- Information about the 3-hour cleanup policy

#### Component Props

```typescript
interface NotificationSettingsProps {
  inline?: boolean;      // Render inline version
  showAutoSave?: boolean; // Show auto-save settings (default: true)
}
```

## Technical Details

### Auto-Save Behavior

1. **Initial Save**: When a workout session is started and auto-save is enabled, an initial save occurs immediately
2. **Periodic Saves**: Subsequent saves occur at the configured interval
3. **Change Detection**: The hook only saves when the session data has changed (prevents duplicate saves)
4. **Cleanup**: When the component unmounts, the auto-save interval is cleared

### Session Cleanup

1. **Trigger**: The `useSessionCleanup` hook runs once on mount
2. **Age Check**: Checks all incomplete sessions and compares their `dateStarted` to current time
3. **Deletion**: Sessions older than the specified max age (default 3 hours) are deleted
4. **Non-intrusive**: Cleanup happens in the background and doesn't affect user experience

### Storage Layer

- Uses IndexedDB for persistent storage
- Separate object stores for:
  - `workoutResults` - Completed workout results
  - `workoutSessions` - Active/incomplete workout sessions
- Indexes on `isCompleted` for efficient querying

## Testing

All features are comprehensively tested:

### Test Files

1. **`src/test/useAutoSave.test.tsx`** (15 tests)
   - Auto-save initialization
   - Session state handling (null, completed, active)
   - Interval-based saving
   - User preference handling
   - Callbacks (onSave, onError)
   - Manual save functionality
   - Component unmount cleanup
   - Session cleanup behavior

2. **`src/test/userPreferencesStorage.test.ts`** (14 tests)
   - Auto-save preferences CRUD operations
   - Default values
   - Persistence

3. **`src/test/workoutResultsStorage.test.ts`** (10 tests)
   - Session retrieval
   - Session deletion
   - Old session cleanup logic

### Running Tests

```bash
npm test                    # Watch mode
npm run test:run            # Run once
npm run test:run src/test/useAutoSave.test.tsx  # Run specific test
```

## Best Practices

1. **Always initialize storage**: Call `workoutResultsStorage.initialize()` before using storage methods
2. **Handle errors gracefully**: Provide `onError` callback to handle save failures
3. **Cleanup on app load**: Use `useSessionCleanup()` in your main app component
4. **Respect user preferences**: Don't override user preferences unless necessary
5. **Test thoroughly**: Ensure auto-save doesn't interfere with user actions

## Configuration Examples

### Shorter interval for testing

```typescript
const { manualSave } = useAutoSave(session, { interval: 5 }); // Save every 5 seconds
```

### Disable auto-save for specific component

```typescript
const { manualSave } = useAutoSave(session, { enabled: false });
```

### Custom cleanup age

```typescript
useSessionCleanup(1); // Cleanup sessions older than 1 hour
```

## Accessibility

All UI elements follow Section 508 compliance and WCAG 2.1 AA standards:

- Toggle switches have proper ARIA labels
- Dropdown has associated label
- Focus states are clearly visible
- Keyboard navigation fully supported
- Screen reader friendly

## Future Enhancements

Potential improvements for future versions:

1. Visual indicator when auto-save occurs
2. Offline sync queue for failed saves
3. Conflict resolution for multi-device usage
4. User-configurable cleanup age
5. Session recovery UI
6. Auto-save status in workout logger

## Support

For issues or questions about the auto-save feature:

1. Check test files for usage examples
2. Review this documentation
3. Check TypeScript types for API details
4. Submit GitHub issue for bugs or feature requests
