# Workout Template System

**Status:** ✅ Backend Implemented (January 2026)  
**Version:** 1.0  
**Last Updated:** January 5, 2026

---

## Overview

The Workout Template System provides a flexible, extensible framework for managing multiple workout programs beyond the original 5/3/1 methodology. It supports various training philosophies, workout splits, and training frequencies to accommodate different fitness goals and experience levels.

## Features

### Built-in Program Templates

The system includes seven professionally designed workout programs:

1. **5/3/1 for Beginners** - Jim Wendler's progressive overload program
2. **StrongLifts 5x5** - Simple linear progression full-body routine
3. **Starting Strength** - Mark Rippetoe's novice program
4. **Juggernaut Method 2.0** - Chad Wesley Smith's block periodization
5. **Texas Method** - Weekly periodization for intermediate lifters
6. **Madcow 5x5** - Bill Starr's ramping sets program
7. **Westside Barbell** - Louie Simmons' conjugate method

### Workout Splits

Supports multiple training split philosophies:

- **Full-body** - All muscle groups each session
- **Upper/Lower** - Upper body and lower body split
- **Push/Pull/Legs** - Push exercises, pull exercises, leg exercises
- **Body-part** - Individual muscle group focus (chest day, back day, etc.)
- **Agonist/Antagonist** - Opposing muscle groups
- **Agonist/Synergist** - Complementary muscle groups
- **Power Building** - Hybrid power and hypertrophy

### Training Frequency

Configurable workout frequency from 1 to 7 days per week, allowing programs to accommodate:

- Busy schedules (1-2 days/week)
- Standard routines (3-4 days/week)
- High-frequency training (5-7 days/week)

## Technical Architecture

### Type Definitions

#### Core Types

```typescript
// Program types
type ProgramType = 
  | '531'
  | 'stronglifts5x5'
  | 'starting-strength'
  | 'juggernaut'
  | 'texas-method'
  | 'madcow5x5'
  | 'westside-barbell'
  | 'custom';

// Workout split types
type WorkoutSplit = 
  | 'full-body'
  | 'push-pull-legs'
  | 'upper-lower'
  | 'body-part'
  | 'agonist-antagonist'
  | 'agonist-synergist'
  | 'power-building';

// Training frequency (days per week)
type TrainingFrequency = 1 | 2 | 3 | 4 | 5 | 6 | 7;
```

#### Template Structure

```typescript
interface WorkoutTemplate {
  id: string;
  name: string;
  programType: ProgramType;
  description: string;
  split: WorkoutSplit;
  frequency: TrainingFrequency;
  weekCount: number;
  weeks: TemplateWeek[];
  requiresOneRepMax: boolean;
  isBuiltIn: boolean;
  createdDate: Date;
  createdBy: 'system' | 'user' | 'coach';
  tags?: string[];
  notes?: string;
}
```

### Storage Service

The `workoutTemplateStorage` service manages templates in IndexedDB:

#### Key Methods

- `getAllTemplates()` - Retrieve all templates
- `getTemplate(id)` - Get specific template by ID
- `getTemplatesByProgramType(type)` - Filter by program type
- `getTemplatesBySplit(split)` - Filter by split type
- `getTemplatesByFrequency(days)` - Filter by training frequency
- `getBuiltInTemplates()` - Get only system templates
- `saveTemplate(template)` - Save or update a template
- `deleteTemplate(id)` - Remove a template
- `initializeBuiltInTemplates()` - Load default templates

## Program Details

### 5/3/1 for Beginners

**Type:** `531`  
**Split:** Upper/Lower  
**Frequency:** 4 days/week  
**Duration:** 4 weeks (repeating)  
**Requires 1RM:** Yes

Four-week wave periodization:
- Week 1: 5 reps (65%, 75%, 85%+)
- Week 2: 3 reps (70%, 80%, 90%+)
- Week 3: 5/3/1 (75%, 85%, 95%+)
- Week 4: Deload (40%, 50%, 60%)

Focus on four main lifts: Squat, Bench Press, Deadlift, Overhead Press

**Best for:** Intermediate lifters with 1+ year experience

### StrongLifts 5x5

**Type:** `stronglifts5x5`  
**Split:** Full-body  
**Frequency:** 3 days/week  
**Duration:** Ongoing (linear progression)  
**Requires 1RM:** No

Two alternating workouts:
- **Workout A:** Squat 5x5, Bench Press 5x5, Barbell Row 5x5
- **Workout B:** Squat 5x5, Overhead Press 5x5, Deadlift 1x5

Linear progression: Add 5 lbs upper body, 10 lbs lower body each session

**Best for:** Beginners starting strength training

### Starting Strength

**Type:** `starting-strength`  
**Split:** Full-body  
**Frequency:** 3 days/week  
**Duration:** Ongoing (linear progression)  
**Requires 1RM:** No

Two alternating workouts:
- **Workout A:** Squat 3x5, Overhead Press 3x5, Deadlift 1x5
- **Workout B:** Squat 3x5, Bench Press 3x5, Deadlift 1x5

Linear progression with focus on form and technique

**Best for:** Absolute beginners with no training history

### Juggernaut Method 2.0

**Type:** `juggernaut`  
**Split:** Upper/Lower  
**Frequency:** 4 days/week  
**Duration:** 16 weeks (4 mesocycles)  
**Requires 1RM:** Yes

Block periodization with four phases:
1. 10s Wave (Accumulation)
2. 8s Wave (Intensification)
3. 5s Wave (Realization)
4. 3s Wave (Peak)

Each phase has accumulation, intensification, and realization weeks

**Best for:** Intermediate to advanced lifters, powerlifters

### Texas Method

**Type:** `texas-method`  
**Split:** Full-body  
**Frequency:** 3 days/week  
**Duration:** Ongoing (weekly progression)  
**Requires 1RM:** Yes

Weekly periodization:
- **Monday (Volume Day):** 5x5 at 90% of 5RM
- **Wednesday (Recovery):** 2x5 light squats, 3x5 overhead press
- **Friday (Intensity):** 1x5 PR attempt on squat and bench

**Best for:** Intermediate lifters who exhausted linear gains

### Madcow 5x5

**Type:** `madcow5x5`  
**Split:** Full-body  
**Frequency:** 3 days/week  
**Duration:** Ongoing (weekly progression with periodic deloads)  
**Requires 1RM:** Yes

Ramping sets progression:
- **Monday (Volume):** Ramping 5x5 (70%, 75%, 80%, 90%, 90%)
- **Wednesday (Light):** 4x5 at 70%
- **Friday (Intensity):** Ramping to new 5RM

Increase weights 2.5% weekly, deload every 4-6 weeks

**Best for:** Intermediate lifters transitioning from linear programs

### Westside Barbell (Conjugate)

**Type:** `westside-barbell`  
**Split:** Upper/Lower  
**Frequency:** 4 days/week  
**Duration:** 3 weeks (rotating max effort exercises)  
**Requires 1RM:** Yes

Four training days:
1. **Max Effort Lower:** Work to 1RM on rotation exercise
2. **Max Effort Upper:** Work to 1RM on rotation exercise
3. **Dynamic Effort Lower:** 10x2 speed squats at 50%
4. **Dynamic Effort Upper:** 9x3 speed bench at 50%

Rotate max effort exercises every 1-3 weeks to avoid accommodation

**Best for:** Advanced powerlifters with extensive training experience

## Usage Examples

### Initialize Built-in Templates

```typescript
import { workoutTemplateStorage } from './services/workoutTemplateStorage';

// Initialize database and load built-in templates
await workoutTemplateStorage.initialize();
await workoutTemplateStorage.initializeBuiltInTemplates();
```

### Get All Templates

```typescript
const allTemplates = await workoutTemplateStorage.getAllTemplates();
console.log(`Found ${allTemplates.length} templates`);
```

### Filter Templates

```typescript
// Get all beginner-friendly programs
const beginnerTemplates = allTemplates.filter(t => 
  t.tags?.includes('beginner')
);

// Get 3-day per week programs
const threeDayTemplates = await workoutTemplateStorage.getTemplatesByFrequency(3);

// Get full-body programs
const fullBodyTemplates = await workoutTemplateStorage.getTemplatesBySplit('full-body');
```

### Get Specific Template

```typescript
const stronglifts = await workoutTemplateStorage.getTemplate('builtin-stronglifts5x5');
if (stronglifts) {
  console.log(`${stronglifts.name}: ${stronglifts.description}`);
  console.log(`Frequency: ${stronglifts.frequency} days/week`);
  console.log(`Weeks: ${stronglifts.weekCount}`);
}
```

## Future Enhancements

### Phase 2: UI Components (Q1 2026)

- [ ] Template selector component
- [ ] Template preview with visual calendar
- [ ] Template comparison view
- [ ] Custom template builder UI
- [ ] Template import/export functionality

### Phase 3: Advanced Features (Q2-Q3 2026)

- [ ] Template customization (modify built-in templates)
- [ ] Template sharing between users
- [ ] Community template library
- [ ] AI-powered template recommendations
- [ ] Template analytics and success tracking
- [ ] Video demonstrations for exercises
- [ ] Progressive overload automation

## Testing

### Test Coverage

Tests should cover:

1. **Storage Operations**
   - CRUD operations
   - Filtering by various criteria
   - Built-in template initialization
   - Error handling

2. **Template Validation**
   - Required fields present
   - Valid program types
   - Valid split types
   - Valid frequency ranges
   - Week structure consistency

3. **Data Integrity**
   - Exercise references valid
   - Set schemes properly formatted
   - Percentages within valid ranges
   - Dates properly stored and retrieved

### Example Test

```typescript
describe('workoutTemplateStorage', () => {
  beforeEach(async () => {
    await workoutTemplateStorage.initialize();
  });

  it('should initialize built-in templates', async () => {
    await workoutTemplateStorage.initializeBuiltInTemplates();
    const templates = await workoutTemplateStorage.getBuiltInTemplates();
    expect(templates.length).toBe(7);
  });

  it('should filter by frequency', async () => {
    await workoutTemplateStorage.initializeBuiltInTemplates();
    const threeDayTemplates = await workoutTemplateStorage.getTemplatesByFrequency(3);
    expect(threeDayTemplates.length).toBeGreaterThan(0);
    threeDayTemplates.forEach(t => {
      expect(t.frequency).toBe(3);
    });
  });
});
```

## Accessibility Considerations

When implementing UI components:

- Provide clear descriptions of each program
- Include difficulty level indicators
- Show expected time commitment
- Offer sample workouts for preview
- Support keyboard navigation
- Provide screen reader friendly content
- Include ARIA labels for all interactive elements

## Database Schema

### IndexedDB Structure

**Database:** `WorkoutTemplateDB`  
**Version:** 1  
**Object Store:** `templates`  
**Key Path:** `id`

**Indexes:**
- `programType` (non-unique)
- `split` (non-unique)
- `frequency` (non-unique)
- `isBuiltIn` (non-unique)

## API Reference

See `src/services/workoutTemplateStorage.ts` for complete API documentation.

## Related Documentation

- [Product Roadmap](../planning/PRODUCT-ROADMAP.md) - Issue #5: Limited Workout Templates
- [TODO List](../planning/TODO.md) - Custom Workout Templates section
- [Types Documentation](../../src/types.ts) - WorkoutTemplate type definitions

---

**Contributors:** Copilot AI  
**Date Created:** January 5, 2026  
**Last Reviewed:** January 5, 2026
