# AMRAP 1RM Recording Feature

## Overview
This feature automatically offers to save a 1 Rep Max (1RM) record after completing an AMRAP (As Many Reps As Possible) set in the Workout Logger.

## How It Works

### Automatic Detection
When you save a workout that includes an AMRAP set with valid data:
- The system detects the AMRAP set
- Calculates the estimated 1RM using the Epley formula: `Weight × (1 + 0.0333 × reps)`
- Shows a modal dialog offering to save the record

### Dialog Contents
The 1RM save dialog displays:
- **Weight**: The weight used in the AMRAP set (lbs)
- **Reps**: The number of repetitions completed
- **Estimated 1RM**: The calculated one-rep max
- Note about the formula used (Epley)

### User Actions
- **Save 1RM Record**: Saves the record to exerciseRecordsStorage with a note indicating it came from an AMRAP set
- **Skip**: Closes the dialog without saving

## Manual Testing Steps

1. **Start the application**
   ```bash
   npm run dev
   ```

2. **Navigate to Workout Logger**
   - Ensure you have an active 5-3-1 cycle
   - Select a workout with AMRAP sets (Week 1, 2, or 3 - the last set is AMRAP)

3. **Complete an AMRAP Set**
   - Fill in the reps and weight for the AMRAP set (marked with "AMRAP" badge)
   - Example: 8 reps × 225 lbs

4. **Save the Workout**
   - Click "Save Workout Results" button
   - Wait for success message

5. **Verify Dialog Appears**
   - Dialog should appear automatically
   - Check that it shows:
     - Correct weight (225 lbs)
     - Correct reps (8)
     - Calculated 1RM (~284.9 lbs)

6. **Test Save Functionality**
   - Click "Save 1RM Record"
   - Dialog should close
   - Success message should appear
   - Record should be saved in ExerciseOneRepMaxTracker

7. **Test Skip Functionality**
   - Repeat steps 3-5
   - Click "Skip" button
   - Dialog should close
   - No record should be saved

## Accessibility Features

### Keyboard Navigation
- Dialog can be closed with Skip button or X button
- Tab navigation works through all interactive elements
- Focus is trapped within the modal (cannot tab outside)
- Focus automatically moves to first focusable element when dialog opens
- Focus returns to previously focused element when dialog closes

### Screen Reader Support
- `role="dialog"` on modal container
- `aria-modal="true"` to indicate modal state
- `aria-labelledby` links to dialog title
- All buttons have descriptive `aria-label` attributes

### Visual Indicators
- Green border on details section highlights positive action
- Blue focus outlines on all interactive elements for keyboard navigation
- Disabled state for buttons during save operation
- Clear visual hierarchy

## Technical Details

### Files Modified
- `src/components/WorkoutLogger.tsx`: Main implementation
- `src/App.css`: Styling for dialog

### Dependencies Used
- `exerciseRecordsStorage`: Saves the 1RM record
- `oneRepMaxStorage`: Initializes storage system
- `findExerciseById`: Retrieves exercise details
- `calculateEstimated1RM`: Epley formula calculation
- `useFocusTrap`: Traps focus within modal for accessibility

### State Management
- `show1RMDialog`: Controls dialog visibility
- `pendingAmrapSet`: Stores AMRAP set data (weight, reps, estimated1RM)
- `isSaving1RM`: Tracks save operation progress
- `dialogRef`: Ref for focus trap functionality
- `workoutSuccessTimeoutRef` & `oneRMSuccessTimeoutRef`: Timeout cleanup refs

### Multiple AMRAP Sets
If a workout has multiple AMRAP sets, the system automatically selects the one with the highest estimated 1RM to offer for recording. This ensures users don't miss their best performance.

## Code Quality

### Testing
- All 351 existing tests pass
- No regressions introduced
- Lint and build verification successful
- Note: New tests for this feature should be added in a future PR

### Security
- CodeQL scan: 0 vulnerabilities found
- No secrets or sensitive data exposed
- Input validation on AMRAP set data (must have reps > 0 and weight > 0)

### Code Review
- Minimal changes approach followed
- Integrated with existing patterns (modal, storage services)
- Consistent with existing code style
- Full accessibility compliance

## Future Enhancements

Potential improvements for future PRs:
- Allow user to select different 1RM formulas (Brzycki, Lander, etc.)
- Show comparison with previous 1RM records
- Option to adjust the calculated 1RM before saving
- Batch save multiple 1RM records from one workout
- Chart showing 1RM progression over time in the dialog
