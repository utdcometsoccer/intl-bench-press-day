# Feature Inventory — International Bench Press Day

**Last Updated:** February 2026  
**Version:** 2.2

This document is the single source of truth for every feature in the
application — both implemented and planned.

---

## 📋 Table of Contents

1. [How to Read This Document](#how-to-read-this-document)
2. [Implemented Features](#implemented-features)
   - [5/3/1 Program Management](#1-531-program-management)
   - [Workout Logging System](#2-workout-logging-system)
   - [Exercise Database & Management](#3-exercise-database--management)
   - [Smart Plate Calculator](#4-smart-plate-calculator)
   - [Progress Visualization](#5-progress-visualization)
   - [Progressive Web App (PWA)](#6-progressive-web-app-pwa)
   - [Accessibility](#7-accessibility)
   - [Voice Navigation](#8-voice-navigation)
   - [Health Platform Integration](#9-health-platform-integration)
   - [Data Export & Import](#10-data-export--import)
   - [User Experience Enhancements](#11-user-experience-enhancements)
   - [Progress Photos](#12-progress-photos)
   - [Rest Timer](#13-rest-timer)
   - [Smart Workout Suggestions](#14-smart-workout-suggestions)
   - [Calendar Synchronization](#15-calendar-synchronization)
   - [Workout Template System (Backend)](#16-workout-template-system-backend)
3. [Planned Features](#planned-features)
   - [Q1 2025 — User Experience](#q1-2025--user-experience)
   - [Q2 2025 — Cloud & Authentication](#q2-2025--cloud--authentication)
   - [Q3 2025 — Social & Growth](#q3-2025--social--growth)
   - [Q4 2025 — Advanced Analytics & AI](#q4-2025--advanced-analytics--ai)
4. [Status Key](#status-key)

---

## How to Read This Document

Each entry lists the feature name, current status, the relevant source
files or components, and a concise description of what is included.
Where a separate detailed document exists it is linked in the entry.

---

## Implemented Features

### 1. 5/3/1 Program Management

**Status:** ✅ Production Ready  
**Components:** `FiveThreeOnePlanner`, `CreateCycleForm`, `CycleCard`,
`ManageCyclesTab`, `ViewWorkoutsTab`  
**Tests:** `fiveThreeOneStorage.test.ts` (16 tests)

Complete implementation of Jim Wendler's 5/3/1 strength methodology.

- Wave periodization with 4-week cycles
- Training max calculations (90 % of 1RM or custom value)
- AMRAP set tracking and automatic 1RM estimation
- Assistance work programming
- Deload week support
- Multiple concurrent cycle management
- Progression tracking across cycles

---

### 2. Workout Logging System

**Status:** ✅ Production Ready  
**Components:** `WorkoutLogger`, `GuidedWorkout`, `QuickLog`  
**Tests:** `workoutResultsStorage.test.ts` (10 tests)

Full session recording for both 5/3/1 and general workouts.

- Warm-up, main sets, and assistance work tracking
- RPE (Rate of Perceived Exertion) per set
- AMRAP support with rep counting
- Per-set notes
- Session duration tracking
- Complete workout history
- Deep integration with 5/3/1 cycles

---

### 3. Exercise Database & Management

**Status:** ✅ Production Ready  
**Components:** `ExerciseManager`, `ExerciseOneRepMaxTracker`  
**Services:** `customExercisesStorage`, `oneRepMaxStorage`,
`exerciseRecordsStorage`  
**Tests:** 37 tests across 4 test files

Comprehensive exercise library with custom additions and 1RM tooling.

- Pre-loaded exercise library
- Custom exercise creation and categorization
- 1RM calculator — Epley, Brzycki, Lander, Lombardi, and custom formulas
- Exercise record and personal-record history

**Related doc:** [AMRAP 1RM Feature](AMRAP-1RM-FEATURE.md)

---

### 4. Smart Plate Calculator

**Status:** ✅ Production Ready  
**Components:** `PlateCalculator`, `PlateSetManager`  
**Tests:** `plateCalculatorStorage.test.ts` (15 tests)

GPS-aware plate loading calculator.

- Automatic gym detection within 1 km radius
- Optimal plate combination algorithm
- Custom plate set configurations per gym location
- Multiple bar types (Olympic 45 lb, Women's 35 lb, Training, Metric)
- Colour-coded visual plate display
- One-tap launch from WorkoutLogger (🏋️ buttons)
- Preset templates (Olympic, Metric)

**Related doc:** [Plate Calculator](PLATE-CALCULATOR.md)

---

### 5. Progress Visualization

**Status:** ✅ Production Ready  
**Components:** `ProgressChart`, `Dashboard`, `ProgressSummary`  
**Tests:** `ProgressChart.test.tsx` (14 tests)

Interactive charting and statistics dashboard.

- Line charts (1RM trends, training volume, frequency) via Recharts
- Exercise filtering and date-range selection
- Personal record highlights
- Summary statistics
- Trend analysis
- Data export

---

### 6. Progressive Web App (PWA)

**Status:** ✅ Production Ready  
**Components:** `PWAInstallPrompt`, Workbox service worker  
**Tests:** `PWAInstallPrompt.test.tsx` (7 tests)

Full offline-capable installable application.

- Install to home screen (iOS, Android, Desktop)
- Complete offline functionality
- Background caching via Workbox
- Automatic updates on new deployments
- Standalone app mode
- iOS safe-area support
- Custom install banner with dismiss persistence

**Related doc:** [PWA Implementation](PWA-IMPLEMENTATION.md)

---

### 7. Accessibility

**Status:** ✅ Section 508 Compliant (90 / 100 score)  
**Implementation:** Application-wide

Full WCAG 2.1 AA / Section 508 compliance.

- Complete ARIA roles, labels, and live regions throughout
- Semantic HTML landmark structure
- Keyboard navigation with skip links
- Screen-reader–optimised content and announcements
- Focus management and trapping for modals
- High-contrast mode
- Colour-blind–friendly palette
- Dark / light theme support
- Reduced-motion support

**Related docs:** [Accessibility Improvements Summary](../accessibility/ACCESSIBILITY-IMPROVEMENTS-SUMMARY.md),
[Section 508 Audit Report](../accessibility/accessibility-audit-report.md)

---

### 8. Voice Navigation

**Status:** ✅ Production Ready  
**Components:** `VoiceNavigationButton`, `VoiceFeedback`  
**Hooks:** `useVoiceNavigation`  
**Tests:** `useVoiceNavigation.test.tsx` (16 tests)

Hands-free navigation using the browser's Web Speech API.

- Voice command recognition for tab and section navigation
- Visual feedback for recognised commands
- Built-in help system listing available commands
- Accessibility enhancement for users with motor impairments

---

### 9. Health Platform Integration

**Status:** ✅ Production Ready  
**Services:** `googleFitClient`, `googleFitService`, `appleHealthExport`  
**Tests:** 40 tests across 3 test files

Two-way health data integration.

- Google Fit OAuth authentication and workout sync
- Apple Health export in HealthKit-compatible format
- Cross-platform workout session sharing
- Session metadata: duration, activity type, exercises

---

### 10. Data Export & Import

**Status:** ✅ Production Ready  
**Components:** `DataExport`  
**Tests:** `DataExport.test.tsx` (9 tests)

Full backup and restore capability.

- Complete JSON export (cycles, workouts, exercises, records)
- Data import from a previous backup
- Cross-device migration support
- Local-only processing (privacy-first)

---

### 11. User Experience Enhancements

**Status:** ✅ Production Ready  
**Components:** `WelcomeScreen`, `FirstTimeUserWizard`, `QuickProfileSetup`,
`TodaysWorkout`, `CalendarView`, `NotificationSettings`  
**Tests:** 15 tests across 2 test files

Onboarding, navigation, and quality-of-life improvements.

- First-time user onboarding wizard
- Quick profile setup screen
- Dashboard with today's suggested workout
- Calendar view of past and upcoming workouts
- Guided workout flow
- Notification preferences (audio, vibration)
- Enhanced empty states with contextual guidance and calls-to-action across
  Dashboard, WorkoutLogger, ExerciseManager, and FiveThreeOnePlanner

---

### 12. Progress Photos

**Status:** ✅ Production Ready (January 2026)  
**Components:** `ProgressPhotos`, `ShareModal`  
**Services:** `progressPhotosStorage`, `socialSharingService`  
**Tests:** `progressPhotosStorage.test.ts` (20+ tests)

Visual body-composition tracking with social sharing.

- Photo upload from device storage
- Direct camera capture with live preview
- Photo gallery with thumbnail grid
- Side-by-side before/after comparison
- Social sharing: Twitter, Facebook, LinkedIn, WhatsApp, Reddit
- Web Share API (native mobile sheet)
- Copy to clipboard and download to device
- Optional metadata: body weight, body measurements, notes
- Local-only IndexedDB storage (privacy-first)

**Related doc:** [Progress Photos](../PROGRESS-PHOTOS.md)

---

### 13. Rest Timer

**Status:** ✅ Production Ready (January 2026)  
**Components:** `RestTimer`  
**Tests:** `RestTimer.test.tsx` (28 tests)

Configurable between-set rest timer integrated into the workout logger.

- Preset rest durations: 30 s, 1 min, 90 s, 2 min, 3 min, 5 min
- Custom duration entry
- Animated circular countdown progress ring
- Audio notification using Web Audio API (800 Hz sine-wave beep)
- Vibration notification — 5-pulse pattern for mobile devices
- Quick-adjust buttons (+30 s / −30 s)
- Optional auto-start after each logged set
- User preference storage (preferred duration, auto-start toggle)

**Related doc:** [Rest Timer](REST-TIMER.md)

---

### 14. Smart Workout Suggestions

**Status:** ✅ Production Ready (January 2026)  
**Components:** `TodaysWorkout` (Dashboard integration)  
**Services:** `workoutSuggestionService`  
**Tests:** 32 tests (18 service + 12 component + 11 integration)

Intelligent next-workout recommendations surfaced on the Dashboard.

- Detects the next unfinished workout in the active cycle
- "Overdue workout" indicator when the planned date has passed
- Quick-start button that opens WorkoutLogger at the correct day/week
- Suggestion algorithm uses full completion history

**Related doc:** [Smart Workout Suggestions](SMART-WORKOUT-SUGGESTIONS.md)

---

### 15. Calendar Synchronization

**Status:** ✅ Production Ready (January 2026)  
**Components:** `CalendarExport`  
**Tests:** 45 tests (28 service + 17 component)

Export the workout schedule to any major calendar application.

- Google Calendar export (opens add-event URL)
- Outlook Calendar export
- Apple Calendar export
- Downloadable ICS file compatible with any calendar app
- Supports both single-event and multi-event bulk export

**Related doc:** [Calendar Synchronization](CALENDAR-SYNC.md)

---

### 16. Workout Template System (Backend)

**Status:** ✅ Backend Production Ready (January 2026); UI Planned  
**Services:** `workoutTemplateStorage`  
**Types:** `WorkoutTemplate`, `ProgramType`, `WorkoutSplit`,
`TrainingFrequency`, `TemplateSetScheme`, `TemplateExercise`,
`TemplateDayWorkout`, `TemplateWeek`

Data layer for multi-program template support. UI components are
planned for Q1 2026 (see [Workout Templates](#q3-2025--social--growth)).

- Full CRUD operations for custom templates in IndexedDB
- Template filtering by program type, split type, and frequency
- Seven built-in program templates:
  - 5/3/1 for Beginners
  - StrongLifts 5×5
  - Starting Strength
  - Juggernaut Method 2.0
  - Texas Method
  - Madcow 5×5
  - Westside Barbell (Conjugate)

**Related doc:** [Workout Templates](WORKOUT-TEMPLATES.md)

---

## Planned Features

### Q1 2025 — User Experience

#### Visual Progress Indicators 📊

**Status:** 📋 Planned  
**Target:** Q1 2025  
**Effort:** ~3 days

Colour-coded visual cues to show training progress at a glance.

- Weekly progress bar component
- Workout cards coloured by status: grey (not started), yellow (in
  progress), green (completed), red (overdue)
- Workout streak counter
- Monthly calendar heatmap

---

#### Color Contrast Audit & Fixes 🎨

**Status:** 📋 Planned  
**Target:** Q1 2025  
**Effort:** ~2–3 days

Full WCAG 2.1 AAA (7:1) contrast verification and remediation.

- Automated contrast audits (Lighthouse, axe, WAVE)
- Document all colour pairs with contrast ratios
- Fix failing combinations
- High-contrast theme variant
- Visual regression test suite

---

#### Onboarding Improvements 👋

**Status:** 📋 Planned  
**Target:** Q1 2025  
**Effort:** ~3 days

Enhanced first-run experience.

- Updated `WelcomeScreen` messaging
- Optional guided tooltip tour
- Feature-highlight carousel
- Improved `QuickProfileSetup` flow with skip option for experienced users
- Updated `FirstTimeUserWizard` steps

---

#### Bundle Size Optimisation ⚡

**Status:** 📋 Planned  
**Target:** Q1 2025  
**Effort:** ~5–7 days

Reduce initial load time. Target: < 250 KB gzipped.

- Code splitting with `React.lazy()` for heavy components
  (ProgressChart, WorkoutLogger, FiveThreeOnePlanner, PlateCalculator,
  DataExport)
- Tree-shake unused Recharts internals
- Critical CSS extraction
- WebP image conversion
- Bundle size monitoring in CI

---

#### E2E Testing Suite

**Status:** 📋 Planned  
**Target:** Q1 2025  
**Effort:** ~5 days

Playwright end-to-end tests covering major user flows.

- Onboarding flow
- Create 5/3/1 cycle
- Log a workout
- Data export / import
- PWA installation
- Voice navigation

---

### Q2 2025 — Cloud & Authentication

#### User Authentication (Azure / MSAL)

**Status:** 📋 Planned  
**Target:** Q2 2025  
**Effort:** ~5 days

Microsoft Entra ID (Azure AD) sign-in so users can access their data
from any device.

- `@azure/msal-browser` / `@azure/msal-react` integration
- Login, logout, and token-refresh flows
- `AuthProvider` component and `useAuth` hook
- Authentication UI: login page, user profile, account settings

---

#### Cloud Data Synchronisation

**Status:** 📋 Planned  
**Target:** Q2 2025  
**Effort:** ~10 days

Real-time sync of local IndexedDB data to Azure Cosmos DB (or Firebase).

- `syncService` with push / pull operations
- Last-write-wins conflict resolution
- Offline change queue with background sync
- Retry logic with exponential back-off
- Sync status indicator in the header
- Manual sync button and last-sync timestamp
- Conflict resolution modal with side-by-side comparison
- One-time local-to-cloud migration wizard

---

### Q3 2025 — Social & Growth

#### Workout Sharing

**Status:** 📋 Planned  
**Target:** Q3 2025  
**Effort:** ~5 days

Generate and share image cards of completed workouts.

- Canvas-rendered shareable workout card
- Web Share API with social-media fallbacks
  (Twitter, Facebook, Instagram)
- QR code generation
- Share analytics

---

#### Marketing Landing Page

**Status:** 📋 Planned  
**Target:** Q3 2025  
**Effort:** ~5 days

Public-facing marketing page separate from the app.

- Hero section with value proposition
- Feature highlights
- "How It Works" section
- Testimonials, accessibility section
- SEO, Open Graph tags, and schema.org structured data

---

#### Blog

**Status:** 📋 Planned  
**Target:** Q3 2025  
**Effort:** ~5 days

Static-markdown blog integrated into the site.

- Markdown rendering with syntax highlighting
- Categories, RSS feed, and SEO per post
- Initial posts: 5/3/1 beginner guide, training max calculation,
  plate calculator walkthrough, getting started guide

---

#### Workout Template UI

**Status:** 📋 Planned (backend complete — see [Feature 16](#16-workout-template-system-backend))  
**Target:** Q1–Q3 2026  
**Effort:** ~4 days

Front-end components to surface the template system to users.

- `TemplateSelector` component
- `TemplateBuilder` for custom user templates
- `TemplateLibrary` with search, filter, preview, and categories
- Template import / export
- Hotel / travel dumbbell-only template (Push / Pull / Legs / Full Body)
- Body-weight templates (hotel room, jungle gym, outdoor calisthenics)
  with beginner / intermediate / advanced progression levels

---

#### Calendar View Enhancements

**Status:** 📋 Planned  
**Target:** Q3 2025  
**Effort:** ~3 days (partial — export already complete)

Further improvements to the built-in calendar view.

- Drag-to-reschedule workouts
- Monthly / weekly / daily view toggle
- Future workout scheduling and rest-day marking
- Improved mobile layout

---

#### Personal Records Board

**Status:** 📋 Planned  
**Target:** Q3 2025  
**Effort:** ~3 days

Dedicated PR showcase.

- All-time records view
- Recent PRs filter (30 / 60 / 90 days)
- PR projections based on trend analysis
- Shareable PR cards
- PR notifications and goal-setting

---

### Q4 2025 — Advanced Analytics & AI

#### AI-Powered Workout Recommendations

**Status:** 📋 Planned  
**Target:** Q4 2025  
**Effort:** ~10 days (model) + ~4 days (UI)

Machine-learning–based programme suggestions.

- Pattern recognition from historical workout data
- Fatigue detection and recovery recommendations
- Deload timing alerts
- Weak-point identification
- Confidence scores displayed with each recommendation
- `AIInsights` component with recommendation and fatigue cards

---

#### Advanced Analytics Dashboard

**Status:** 📋 Planned  
**Target:** Q4 2025  
**Effort:** ~10 days

Deep-dive metrics beyond the current ProgressChart.

- Training volume trends
- Frequency and exercise-distribution analysis
- Strength velocity and 1RM projection charts
- Periodisation visualisation
- Date-range filters and analytics export
- `analyticsService` backend (volume, frequency, distribution,
  strength velocity, projections)

---

#### Body Measurement Tracker

**Status:** 📋 Planned (partial — photo metadata available)  
**Target:** Q4 2025 / Q4 2026  
**Effort:** ~3–4 days (remaining UI)

Dedicated body-metrics tracking beyond progress photos.

- `bodyMeasurementsStorage` service with full CRUD
- Measurement types: weight, waist, arms, chest, thighs, hips
- Measurement history and trend visualisation
- BMI / body-fat estimates
- Goal-setting for measurements

---

#### Nutrition Tracking

**Status:** 📋 Planned  
**Target:** Q4 2025 / 2026  
**Effort:** ~10 days

Basic calorie and macro logging.

- `nutritionStorage` service
- Quick food logging with meal templates
- Daily calorie / macro summary
- Weekly averages
- Trend charts and goal-setting
- Optional MyFitnessPal integration (future)

---

#### Achievement System 🏆

**Status:** 📋 Planned  
**Target:** Q4 2025  
**Effort:** ~7 days

Gamification layer to reward training consistency.

- Workout streak badges
- Personal-record milestone awards
- Volume record achievements
- Consistency awards
- Achievement notifications
- Shareable achievement cards
- Achievement gallery component

---

#### Enhanced Voice Logging

**Status:** 📋 Planned  
**Target:** Q4 2025  
**Effort:** ~5 days

Extend voice navigation to log individual sets hands-free.

- "Add 5 reps at 225" style commands
- Confirmation and error-correction UI
- Optional wake-word activation

---

## Status Key

| Symbol | Meaning |
| ------ | ------- |
| ✅ | Implemented and production ready |
| 🔄 | In active development |
| 📋 | Planned — not yet started |
| ⚠️ | Needs attention / partially complete |
