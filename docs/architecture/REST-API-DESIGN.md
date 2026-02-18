# REST API Design Specification

## Table of Contents

- [Overview](#overview)
- [Architecture Principles](#architecture-principles)
- [Base Configuration](#base-configuration)
- [Common Response Structures](#common-response-structures)
- [API Endpoints](#api-endpoints)
  - [1. Authentication & User Management](#1-authentication--user-management)
  - [2. User Preferences](#2-user-preferences)
  - [3. Exercises](#3-exercises)
  - [4. One-Rep Max Formulas](#4-one-rep-max-formulas)
  - [5. Exercise Records](#5-exercise-records)
  - [6. 5-3-1 Cycles](#6-5-3-1-cycles)
  - [7. Workouts](#7-workouts)
  - [8. Workout Results](#8-workout-results)
  - [9. Workout Scheduling](#9-workout-scheduling)
  - [10. Plate Calculator](#10-plate-calculator)
  - [11. Workout Templates](#11-workout-templates)
  - [12. Progress Analytics](#12-progress-analytics)
  - [13. Progress Photos](#13-progress-photos)
  - [14. Third-Party Integrations](#14-third-party-integrations)
  - [15. Data Export & Import](#15-data-export--import)
  - [16. Notifications](#16-notifications)
- [HTTP Status Codes](#http-status-codes)
- [Error Codes](#error-codes)
- [Rate Limiting](#rate-limiting)
- [Pagination](#pagination)
- [Security Considerations](#security-considerations)
- [Implementation Recommendations](#implementation-recommendations)
- [Migration Strategy](#migration-strategy)
- [TypeScript Type Definitions](#typescript-type-definitions)

## Overview

This document specifies a comprehensive REST API design for the International Bench Press Day fitness tracker application. The API externalizes all application logic from the client-side TypeScript codebase to enable:

- **Cross-device data synchronization** - Access your data from any device
- **Multi-platform support** - Web, mobile, and desktop applications
- **Centralized business logic** - Consistent behavior across all clients
- **Scalability** - Handle growing user base and data
- **Third-party integrations** - Google Fit, Apple Health, calendar systems
- **Social features** - Share progress and compete with friends
- **Offline-first capability** - Continue working offline with sync when online

## Architecture Principles

### RESTful Design

- **Resource-based URLs** - Each endpoint represents a resource (e.g., `/cycles`, `/workouts`)
- **Standard HTTP methods** - GET (read), POST (create), PUT/PATCH (update), DELETE (remove)
- **Stateless communication** - Each request contains all necessary information
- **JSON format** - All request/response bodies use JSON
- **Proper HTTP status codes** - Semantic status codes for all responses

### Authentication & Authorization

- **JWT (JSON Web Token)** - Token-based authentication for API access
- **OAuth 2.0** - For third-party integrations (Google Fit)
- **Role-based access control** - Support for user, coach, and admin roles
- **API keys** - Optional API key support for third-party developers
- **Refresh tokens** - Long-lived tokens for obtaining new access tokens

### Versioning

- **URL-based versioning** - `/api/v1/` prefix for all endpoints
- **Backwards compatibility** - Maintain support for previous versions
- **Deprecation notices** - Clear communication of deprecated endpoints
- **Migration guides** - Documentation for version upgrades

### Error Handling

- **Consistent error format** - All errors follow the same structure
- **Meaningful messages** - Clear, actionable error descriptions
- **HTTP status codes** - Appropriate codes for each error type
- **Error code enumeration** - Machine-readable error codes

## Base Configuration

```
Base URL: https://api.intlbenchpressday.com/api/v1
Content-Type: application/json
Authorization: Bearer <jwt_token>
```

### Common Headers

**Request Headers:**
```
Content-Type: application/json
Authorization: Bearer <jwt_token>
Accept: application/json
X-API-Version: v1
```

**Response Headers:**
```
Content-Type: application/json
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 997
X-RateLimit-Reset: 1708257600
X-Request-ID: uuid-v4
```

## Common Response Structures

### Success Response

```typescript
{
  "success": true,
  "data": T, // Generic type based on endpoint
  "meta"?: {
    "timestamp": "2026-02-18T13:40:00.857Z",
    "requestId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

### Error Response

```typescript
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details"?: {
      "field": "email",
      "reason": "invalid_format"
    },
    "timestamp": "2026-02-18T13:40:00.857Z",
    "requestId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

### Paginated Response

```typescript
{
  "success": true,
  "data": T[],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalPages": 5,
    "totalItems": 93,
    "hasNext": true,
    "hasPrevious": false
  }
}
```

## API Endpoints

---

## 1. Authentication & User Management

### 1.1 Register New User

**POST** `/auth/register`

Creates a new user account.

**Request Body:**
```typescript
{
  "email": string,           // Valid email address (required)
  "password": string,        // Min 8 characters (required)
  "firstName": string,       // Required
  "lastName": string,        // Required
  "dateOfBirth"?: string,    // ISO 8601 format (optional)
  "gender"?: "male" | "female" | "other" | "prefer_not_to_say"
}
```

**Response:** `201 Created`
```typescript
{
  "success": true,
  "data": {
    "user": {
      "id": "usr_1234567890",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "createdAt": "2026-02-18T13:40:00.857Z",
      "emailVerified": false
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "rt_abc123...",
    "expiresIn": 3600
  }
}
```

**Errors:**
- `400 BAD_REQUEST` - Invalid input data (malformed email, weak password)
- `409 CONFLICT` - Email already registered

---

### 1.2 User Login

**POST** `/auth/login`

Authenticates user and returns JWT token.

**Request Body:**
```typescript
{
  "email": string,
  "password": string
}
```

**Response:** `200 OK`
```typescript
{
  "success": true,
  "data": {
    "user": {
      "id": string,
      "email": string,
      "firstName": string,
      "lastName": string
    },
    "token": string,
    "refreshToken": string,
    "expiresIn": number  // Seconds until token expires (default: 3600)
  }
}
```

**Errors:**
- `401 UNAUTHORIZED` - Invalid credentials
- `403 FORBIDDEN` - Account locked or email not verified

---

### 1.3 Refresh Token

**POST** `/auth/refresh`

Refreshes an expired JWT token.

**Request Body:**
```typescript
{
  "refreshToken": string
}
```

**Response:** `200 OK`
```typescript
{
  "success": true,
  "data": {
    "token": string,
    "refreshToken": string,
    "expiresIn": number
  }
}
```

**Errors:**
- `401 UNAUTHORIZED` - Invalid or expired refresh token

---

### 1.4 Get Current User

**GET** `/auth/me`

Returns authenticated user's profile.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```typescript
{
  "success": true,
  "data": {
    "id": string,
    "email": string,
    "firstName": string,
    "lastName": string,
    "dateOfBirth"?: string,
    "gender"?: string,
    "createdAt": string,
    "updatedAt": string
  }
}
```

---

### 1.5 Update User Profile

**PATCH** `/auth/me`

Updates user profile information.

**Request Body:**
```typescript
{
  "firstName"?: string,
  "lastName"?: string,
  "dateOfBirth"?: string,
  "gender"?: string
}
```

**Response:** `200 OK` - Returns updated user object

---

### 1.6 Change Password

**POST** `/auth/change-password`

Changes user password.

**Request Body:**
```typescript
{
  "currentPassword": string,
  "newPassword": string
}
```

**Response:** `200 OK`

**Errors:**
- `401 UNAUTHORIZED` - Current password incorrect
- `400 BAD_REQUEST` - New password doesn't meet requirements

---

### 1.7 Logout

**POST** `/auth/logout`

Invalidates the current refresh token.

**Response:** `204 No Content`

---

## 2. User Preferences

### 2.1 Get User Preferences

**GET** `/preferences`

Retrieves user's app preferences and settings.

**Response:** `200 OK`
```typescript
{
  "success": true,
  "data": {
    "id": string,
    "userId": string,
    "notifications": {
      "enabled": boolean,
      "workoutReminders": boolean,
      "progressUpdates": boolean,
      "leadTimeMinutes": number  // Notification lead time
    },
    "workoutDefaults": {
      "defaultWorkoutTime": string,  // HH:mm format
      "autoSave": boolean,
      "autoSaveInterval": number,     // Seconds
      "defaultRestTime": number       // Seconds
    },
    "units": {
      "weightUnit": "lbs" | "kg",
      "distanceUnit": "miles" | "km"
    },
    "display": {
      "theme": "light" | "dark" | "auto",
      "showPlateCalculator": boolean,
      "showRestTimer": boolean
    },
    "updatedAt": string
  }
}
```

---

### 2.2 Update User Preferences

**PUT** `/preferences`

Updates user preferences (full replacement).

**Request Body:** Complete UserPreferences object

**Response:** `200 OK` - Returns updated preferences

---

### 2.3 Partially Update Preferences

**PATCH** `/preferences`

Partially updates user preferences (merge).

**Request Body:**
```typescript
{
  "notifications"?: {
    "enabled"?: boolean,
    "workoutReminders"?: boolean,
    "progressUpdates"?: boolean,
    "leadTimeMinutes"?: number
  },
  "workoutDefaults"?: {
    "defaultWorkoutTime"?: string,
    "autoSave"?: boolean,
    "autoSaveInterval"?: number,
    "defaultRestTime"?: number
  },
  "units"?: {
    "weightUnit"?: "lbs" | "kg",
    "distanceUnit"?: "miles" | "km"
  },
  "display"?: {
    "theme"?: "light" | "dark" | "auto",
    "showPlateCalculator"?: boolean,
    "showRestTimer"?: boolean
  }
}
```

**Response:** `200 OK` - Returns updated preferences

---

## 3. Exercises

### 3.1 List Built-in Exercises

**GET** `/exercises`

Returns all built-in exercises (27 barbell exercises by default).

**Query Parameters:**
```typescript
{
  "category"?: string,           // Filter by category
  "muscleGroup"?: string,        // Filter by muscle group
  "search"?: string,             // Search by name
  "page"?: number,               // Default: 1
  "pageSize"?: number            // Default: 50, Max: 100
}
```

**Response:** `200 OK`
```typescript
{
  "success": true,
  "data": [
    {
      "id": "back-squat",
      "name": "Back Squat",
      "category": "Barbell",
      "muscleGroups": ["Quadriceps", "Glutes", "Hamstrings"],
      "description": "Compound lower body exercise",
      "isCustom": false
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 50,
    "totalPages": 1,
    "totalItems": 27,
    "hasNext": false,
    "hasPrevious": false
  }
}
```

---

### 3.2 Create Custom Exercise

**POST** `/exercises/custom`

Creates a user-defined custom exercise.

**Request Body:**
```typescript
{
  "name": string,
  "category": string,
  "muscleGroups": string[],
  "description"?: string
}
```

**Response:** `201 Created`
```typescript
{
  "success": true,
  "data": {
    "id": "custom_exercise_123",
    "name": "Zercher Squat",
    "category": "Barbell",
    "muscleGroups": ["Quadriceps", "Core"],
    "description": "Variation of squat",
    "isCustom": true,
    "createdBy": "usr_1234567890",
    "createdAt": "2026-02-18T13:40:00.857Z"
  }
}
```

---

### 3.3 Get Custom Exercises

**GET** `/exercises/custom`

Returns user's custom exercises.

**Response:** `200 OK` - Array of custom Exercise objects

---

### 3.4 Update Custom Exercise

**PUT** `/exercises/custom/:exerciseId`

Updates a custom exercise.

**Request Body:** Exercise fields to update

**Response:** `200 OK` - Returns updated exercise

**Errors:**
- `404 NOT_FOUND` - Exercise not found
- `403 FORBIDDEN` - Not owner of custom exercise

---

### 3.5 Delete Custom Exercise

**DELETE** `/exercises/custom/:exerciseId`

Deletes a custom exercise.

**Response:** `204 No Content`

**Errors:**
- `409 CONFLICT` - Exercise is used in workouts/cycles

---

## 4. One-Rep Max Formulas

### 4.1 List Available Formulas

**GET** `/formulas`

Returns all available 1RM formulas (4 built-in + custom).

**Response:** `200 OK`
```typescript
{
  "success": true,
  "data": [
    {
      "id": "epley",
      "name": "Epley",
      "description": "Weight × (1 + 0.0333 × reps)",
      "formula": "Weight × (1 + 0.0333 × reps)",
      "isCustom": false,
      "isPredefined": true,
      "createdAt": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": "brzycki",
      "name": "Brzycki",
      "description": "Weight × (36 / (37 - reps))",
      "formula": "Weight × (36 / (37 - reps))",
      "isCustom": false,
      "isPredefined": true,
      "validForReps": "1-36",
      "createdAt": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": "lander",
      "name": "Lander",
      "description": "Weight × (100 / (101.3 - 2.67123 × reps))",
      "formula": "Weight × (100 / (101.3 - 2.67123 × reps))",
      "isCustom": false,
      "isPredefined": true,
      "createdAt": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": "lombardi",
      "name": "Lombardi",
      "description": "Weight × reps^0.1",
      "formula": "Weight × reps^0.1",
      "isCustom": false,
      "isPredefined": true,
      "createdAt": "2026-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### 4.2 Calculate One-Rep Max

**POST** `/formulas/calculate`

Calculates one-rep max using specified formula.

**Request Body:**
```typescript
{
  "formulaId": string,
  "weight": number,
  "reps": number
}
```

**Response:** `200 OK`
```typescript
{
  "success": true,
  "data": {
    "oneRepMax": 315.75,
    "formulaUsed": "Epley",
    "formulaId": "epley",
    "input": {
      "weight": 275,
      "reps": 5
    },
    "calculation": "275 × (1 + 0.0333 × 5) = 315.75"
  }
}
```

**Errors:**
- `400 BAD_REQUEST` - Invalid reps for formula (e.g., 37+ for Brzycki)
- `404 NOT_FOUND` - Formula not found

---

### 4.3 Create Custom Formula

**POST** `/formulas/custom`

Creates a custom 1RM calculation formula.

**Request Body:**
```typescript
{
  "name": string,
  "description"?: string,
  "functionBody": string  // JavaScript function as string
}
```

**Example:**
```typescript
{
  "name": "My Custom Formula",
  "description": "Custom calculation based on RPE",
  "functionBody": "(workoutSet) => { return workoutSet.Weight * (1 + 0.025 * workoutSet.Repetions); }"
}
```

**Response:** `201 Created` - Returns created formula object

**Errors:**
- `400 BAD_REQUEST` - Invalid function syntax

---

### 4.4 Delete Custom Formula

**DELETE** `/formulas/custom/:formulaId`

Deletes a custom formula.

**Response:** `204 No Content`

**Errors:**
- `409 CONFLICT` - Formula is used in exercise records

---

## 5. Exercise Records

### 5.1 List Exercise Records

**GET** `/exercise-records`

Returns all exercise records for the user.

**Query Parameters:**
```typescript
{
  "exerciseId"?: string,     // Filter by exercise
  "startDate"?: string,      // ISO 8601
  "endDate"?: string,        // ISO 8601
  "limit"?: number,          // Default: 10
  "page"?: number,           // Default: 1
  "sortBy"?: "date" | "oneRepMax",
  "sortOrder"?: "asc" | "desc"
}
```

**Response:** `200 OK`
```typescript
{
  "success": true,
  "data": [
    {
      "id": "rec_123",
      "userId": "usr_1234567890",
      "exerciseId": "bench-press",
      "exerciseName": "Bench Press",
      "workoutSet": {
        "Weight": 225,
        "Repetions": 8
      },
      "oneRepMax": 281.25,
      "formulaUsed": "Epley",
      "formulaId": "epley",
      "dateRecorded": "2026-02-18T13:40:00.857Z",
      "notes": "Felt strong today"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "totalPages": 3,
    "totalItems": 25,
    "hasNext": true,
    "hasPrevious": false
  }
}
```

---

### 5.2 Create Exercise Record

**POST** `/exercise-records`

Records a new exercise performance.

**Request Body:**
```typescript
{
  "exerciseId": string,
  "weight": number,
  "reps": number,
  "formulaId": string,
  "notes"?: string,
  "dateRecorded"?: string  // Defaults to current time if not provided
}
```

**Response:** `201 Created`
```typescript
{
  "success": true,
  "data": {
    "id": "rec_124",
    "userId": "usr_1234567890",
    "exerciseId": "bench-press",
    "exerciseName": "Bench Press",
    "workoutSet": {
      "Weight": 225,
      "Repetions": 8
    },
    "oneRepMax": 281.25,
    "formulaUsed": "Epley",
    "formulaId": "epley",
    "dateRecorded": "2026-02-18T13:40:00.857Z",
    "notes": "Felt strong today"
  }
}
```

---

### 5.3 Get Exercise Statistics

**GET** `/exercise-records/:exerciseId/stats`

Returns statistics for a specific exercise.

**Response:** `200 OK`
```typescript
{
  "success": true,
  "data": {
    "exerciseId": "bench-press",
    "exerciseName": "Bench Press",
    "totalRecords": 25,
    "bestOneRepMax": 315,
    "averageOneRepMax": 275.5,
    "latestRecord": {
      "id": "rec_123",
      "oneRepMax": 281.25,
      "dateRecorded": "2026-02-18T13:40:00.857Z"
    },
    "personalRecordDate": "2026-02-10T10:00:00.000Z",
    "progressTrend": "increasing",
    "improvementPercentage": 12.5
  }
}
```

---

### 5.4 Get Personal Records

**GET** `/exercise-records/personal-records`

Returns best 1RM for each exercise.

**Response:** `200 OK`
```typescript
{
  "success": true,
  "data": {
    "bench-press": {
      "id": "rec_100",
      "exerciseId": "bench-press",
      "exerciseName": "Bench Press",
      "oneRepMax": 315,
      "dateRecorded": "2026-02-10T10:00:00.000Z"
    },
    "back-squat": {
      "id": "rec_101",
      "exerciseId": "back-squat",
      "exerciseName": "Back Squat",
      "oneRepMax": 405,
      "dateRecorded": "2026-02-15T14:30:00.000Z"
    }
  }
}
```

---

### 5.5 Delete Exercise Record

**DELETE** `/exercise-records/:recordId`

Deletes an exercise record.

**Response:** `204 No Content`

---

## 6. 5-3-1 Cycles

### 6.1 List Cycles

**GET** `/cycles`

Returns all 5-3-1 cycles for the user.

**Query Parameters:**
```typescript
{
  "isActive"?: boolean,      // Filter by active status
  "page"?: number,
  "pageSize"?: number
}
```

**Response:** `200 OK`
```typescript
{
  "success": true,
  "data": [
    {
      "id": "cycle_123",
      "userId": "usr_1234567890",
      "name": "Winter Cycle 2026",
      "startDate": "2026-02-01T00:00:00.000Z",
      "createdDate": "2026-01-28T12:00:00.000Z",
      "isActive": true,
      "notes": "Focus on building base strength",
      "maxes": [
        {
          "exerciseId": "back-squat",
          "exerciseName": "Back Squat",
          "oneRepMax": 405,
          "trainingMax": 365  // 90% of 1RM
        },
        {
          "exerciseId": "bench-press",
          "exerciseName": "Bench Press",
          "oneRepMax": 315,
          "trainingMax": 284
        },
        {
          "exerciseId": "deadlift",
          "exerciseName": "Deadlift",
          "oneRepMax": 495,
          "trainingMax": 446
        },
        {
          "exerciseId": "overhead-press",
          "exerciseName": "Overhead Press",
          "oneRepMax": 185,
          "trainingMax": 167
        }
      ],
      "workouts": [], // 16 workouts (4 weeks × 4 exercises)
      "progress": {
        "completedWorkouts": 8,
        "totalWorkouts": 16,
        "currentWeek": 3,
        "currentDay": 1,
        "percentComplete": 50
      }
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalPages": 1,
    "totalItems": 3,
    "hasNext": false,
    "hasPrevious": false
  }
}
```

---

### 6.2 Get Cycle by ID

**GET** `/cycles/:cycleId`

Returns detailed information about a specific cycle.

**Response:** `200 OK` - Complete cycle object with all 16 workouts

---

### 6.3 Create New Cycle

**POST** `/cycles`

Creates a new 5-3-1 training cycle with auto-generated workouts.

**Request Body:**
```typescript
{
  "name": string,
  "startDate": string,  // ISO 8601
  "maxes": [
    {
      "exerciseId": string,
      "oneRepMax": number
    }
  ],
  "notes"?: string,
  "setAsActive"?: boolean  // Default: true
}
```

**Example:**
```typescript
{
  "name": "Spring Cycle 2026",
  "startDate": "2026-03-01T00:00:00.000Z",
  "maxes": [
    { "exerciseId": "back-squat", "oneRepMax": 405 },
    { "exerciseId": "bench-press", "oneRepMax": 315 },
    { "exerciseId": "deadlift", "oneRepMax": 495 },
    { "exerciseId": "overhead-press", "oneRepMax": 185 }
  ],
  "notes": "Spring strength building cycle",
  "setAsActive": true
}
```

**Response:** `201 Created`
```typescript
{
  "success": true,
  "data": {
    "id": "cycle_124",
    "userId": "usr_1234567890",
    "name": "Spring Cycle 2026",
    "startDate": "2026-03-01T00:00:00.000Z",
    "createdDate": "2026-02-18T13:40:00.857Z",
    "isActive": true,
    "notes": "Spring strength building cycle",
    "maxes": [
      {
        "exerciseId": "back-squat",
        "exerciseName": "Back Squat",
        "oneRepMax": 405,
        "trainingMax": 365
      }
      // ... other exercises
    ],
    "workouts": [
      {
        "id": "back-squat_week1",
        "week": 1,
        "day": 1,
        "exerciseId": "back-squat",
        "exerciseName": "Back Squat",
        "mainSets": [
          { "reps": 5, "percentage": 65, "weight": 240, "isAmrap": false },
          { "reps": 5, "percentage": 75, "weight": 275, "isAmrap": false },
          { "reps": 5, "percentage": 85, "weight": 310, "isAmrap": true }
        ],
        "warmupSets": [
          { "reps": 5, "percentage": 40, "weight": 145 },
          { "reps": 5, "percentage": 50, "weight": 185 },
          { "reps": 3, "percentage": 60, "weight": 220 }
        ],
        "assistanceExercises": [
          "Romanian Deadlift",
          "Bulgarian Split Squats",
          "Leg Press"
        ]
      }
      // ... 15 more workouts
    ],
    "progress": {
      "completedWorkouts": 0,
      "totalWorkouts": 16,
      "currentWeek": 1,
      "currentDay": 1,
      "percentComplete": 0
    }
  }
}
```

---

### 6.4 Update Cycle

**PATCH** `/cycles/:cycleId`

Updates cycle information (name, notes, maxes).

**Request Body:**
```typescript
{
  "name"?: string,
  "notes"?: string,
  "maxes"?: Array<{ exerciseId: string, oneRepMax: number }>
}
```

**Response:** `200 OK` - Returns updated cycle

**Note:** Updating maxes regenerates all workouts in the cycle.

---

### 6.5 Set Active Cycle

**POST** `/cycles/:cycleId/activate`

Sets a cycle as the active training cycle (deactivates all others).

**Response:** `200 OK`
```typescript
{
  "success": true,
  "data": {
    "cycleId": "cycle_124",
    "isActive": true,
    "message": "Cycle activated successfully"
  }
}
```

---

### 6.6 Get Active Cycle

**GET** `/cycles/active`

Returns the currently active cycle.

**Response:** `200 OK` - Complete cycle object or null if no active cycle

---

### 6.7 Delete Cycle

**DELETE** `/cycles/:cycleId`

Deletes a cycle and all associated data.

**Response:** `204 No Content`

**Errors:**
- `409 CONFLICT` - Cannot delete active cycle with logged workouts

---

### 6.8 Get Cycle Progress

**GET** `/cycles/:cycleId/progress`

Returns detailed progress information for a cycle.

**Response:** `200 OK`
```typescript
{
  "success": true,
  "data": {
    "cycleId": "cycle_123",
    "cycleName": "Winter Cycle 2026",
    "completedWorkouts": 8,
    "totalWorkouts": 16,
    "currentWeek": 3,
    "currentDay": 1,
    "percentComplete": 50,
    "nextWorkout": {
      "id": "back-squat_week3",
      "week": 3,
      "day": 1,
      "exerciseName": "Back Squat",
      "scheduledDate": "2026-02-19T09:00:00.000Z"
    },
    "weeklyProgress": [
      { "week": 1, "completed": 4, "total": 4, "percentComplete": 100 },
      { "week": 2, "completed": 4, "total": 4, "percentComplete": 100 },
      { "week": 3, "completed": 0, "total": 4, "percentComplete": 0 },
      { "week": 4, "completed": 0, "total": 4, "percentComplete": 0 }
    ]
  }
}
```

---

## 7. Workouts

### 7.1 List Workouts

**GET** `/workouts`

Returns workouts from cycles and custom workouts.

**Query Parameters:**
```typescript
{
  "cycleId"?: string,
  "week"?: number,
  "day"?: number,
  "exerciseId"?: string,
  "completed"?: boolean,
  "page"?: number,
  "pageSize"?: number
}
```

**Response:** `200 OK`
```typescript
{
  "success": true,
  "data": [
    {
      "id": "back-squat_week1",
      "cycleId": "cycle_123",
      "week": 1,
      "day": 1,
      "exerciseId": "back-squat",
      "exerciseName": "Back Squat",
      "type": "5-3-1",
      "warmupSets": [
        { "reps": 5, "percentage": 40, "weight": 145 },
        { "reps": 5, "percentage": 50, "weight": 185 },
        { "reps": 3, "percentage": 60, "weight": 220 }
      ],
      "mainSets": [
        { "reps": 5, "percentage": 65, "weight": 240, "isAmrap": false },
        { "reps": 5, "percentage": 75, "weight": 275, "isAmrap": false },
        { "reps": 5, "percentage": 85, "weight": 310, "isAmrap": true }
      ],
      "assistanceExercises": [
        "Romanian Deadlift",
        "Bulgarian Split Squats",
        "Leg Press"
      ],
      "scheduledTime": "09:00",
      "isCompleted": true,
      "completedDate": "2026-02-05T09:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalPages": 1,
    "totalItems": 16,
    "hasNext": false,
    "hasPrevious": false
  }
}
```

---

### 7.2 Get Workout by ID

**GET** `/workouts/:workoutId`

Returns detailed workout information.

**Response:** `200 OK` - Complete workout object

---

### 7.3 Get Today's Workout

**GET** `/workouts/today`

Returns the scheduled workout for today based on user's timezone.

**Response:** `200 OK` - Workout object or null if none scheduled

---

### 7.4 Get Next Suggested Workout

**GET** `/workouts/next`

Returns the next suggested workout based on cycle progression.

**Response:** `200 OK`
```typescript
{
  "success": true,
  "data": {
    "workout": {
      "id": "back-squat_week3",
      "week": 3,
      "day": 1,
      "exerciseName": "Back Squat",
      // ... complete workout object
    },
    "recommendation": {
      "reason": "next_in_cycle",
      "daysOverdue": 0,
      "suggestedDate": "2026-02-19T09:00:00.000Z",
      "message": "Next workout in your current cycle"
    }
  }
}
```

---

## 8. Workout Results

### 8.1 List Workout Results

**GET** `/workout-results`

Returns logged workout results.

**Query Parameters:**
```typescript
{
  "cycleId"?: string,
  "exerciseId"?: string,
  "startDate"?: string,
  "endDate"?: string,
  "page"?: number,
  "pageSize"?: number
}
```

**Response:** `200 OK`
```typescript
{
  "success": true,
  "data": [
    {
      "id": "result_123",
      "userId": "usr_1234567890",
      "workoutId": "back-squat_week1",
      "cycleId": "cycle_123",
      "cycleName": "Winter Cycle 2026",
      "exerciseId": "back-squat",
      "exerciseName": "Back Squat",
      "week": 1,
      "day": 1,
      "datePerformed": "2026-02-05T09:30:00.000Z",
      "duration": 45,  // Minutes
      "bodyWeight": 185,
      "warmupResults": [
        {
          "plannedReps": 5,
          "plannedWeight": 145,
          "actualReps": 5,
          "actualWeight": 145,
          "percentage": 40,
          "isAmrap": false,
          "rpe": 5,
          "notes": "Easy"
        }
        // ... more warmup sets
      ],
      "mainSetResults": [
        {
          "plannedReps": 5,
          "plannedWeight": 240,
          "actualReps": 5,
          "actualWeight": 240,
          "percentage": 65,
          "isAmrap": false,
          "rpe": 7
        },
        {
          "plannedReps": 5,
          "plannedWeight": 275,
          "actualReps": 5,
          "actualWeight": 275,
          "percentage": 75,
          "isAmrap": false,
          "rpe": 8
        },
        {
          "plannedReps": 5,
          "plannedWeight": 310,
          "actualReps": 8,
          "actualWeight": 310,
          "percentage": 85,
          "isAmrap": true,
          "rpe": 9,
          "notes": "Hit 8 reps on AMRAP!"
        }
      ],
      "assistanceWork": [
        {
          "exerciseName": "Romanian Deadlift",
          "sets": [
            { "reps": 10, "weight": 225, "rpe": 7 },
            { "reps": 10, "weight": 225, "rpe": 7 },
            { "reps": 10, "weight": 225, "rpe": 8 }
          ]
        }
      ],
      "overallRpe": 8,
      "workoutNotes": "Great session, felt strong",
      "estimatedOneRepMax": 387.5
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalPages": 2,
    "totalItems": 25,
    "hasNext": true,
    "hasPrevious": false
  }
}
```

---

### 8.2 Log Workout Result

**POST** `/workout-results`

Logs a completed workout.

**Request Body:**
```typescript
{
  "workoutId"?: string,
  "cycleId"?: string,
  "exerciseId": string,
  "week": number,
  "day": number,
  "datePerformed"?: string,  // Defaults to now
  "duration"?: number,
  "bodyWeight"?: number,
  "warmupResults": WorkoutSetResult[],
  "mainSetResults": WorkoutSetResult[],
  "assistanceWork"?: AssistanceExerciseResult[],
  "overallRpe"?: number,
  "workoutNotes"?: string
}
```

**Response:** `201 Created`
```typescript
{
  "success": true,
  "data": {
    "workoutResult": {
      "id": "result_124",
      // ... complete workout result
    },
    "exerciseRecord": {
      "id": "rec_125",
      "oneRepMax": 387.5,
      // ... created from AMRAP set
    },
    "cycleProgress": {
      "completedWorkouts": 9,
      "totalWorkouts": 16,
      "percentComplete": 56.25
    }
  }
}
```

---

### 8.3 Get Workout Result by ID

**GET** `/workout-results/:resultId`

Returns a specific workout result.

**Response:** `200 OK` - Complete WorkoutResult object

---

### 8.4 Update Workout Result

**PUT** `/workout-results/:resultId`

Updates a logged workout result.

**Request Body:** WorkoutResult fields to update

**Response:** `200 OK` - Returns updated workout result

---

### 8.5 Delete Workout Result

**DELETE** `/workout-results/:resultId`

Deletes a workout result.

**Response:** `204 No Content`

---

## 9. Workout Scheduling

### 9.1 List Scheduled Workouts

**GET** `/schedule`

Returns all scheduled workouts.

**Query Parameters:**
```typescript
{
  "startDate"?: string,  // ISO 8601
  "endDate"?: string,
  "completed"?: boolean,
  "page"?: number,
  "pageSize"?: number
}
```

**Response:** `200 OK`
```typescript
{
  "success": true,
  "data": [
    {
      "id": "schedule_123",
      "userId": "usr_1234567890",
      "workoutId": "back-squat_week3",
      "scheduledDate": "2026-02-19T00:00:00.000Z",
      "scheduledTime": "09:00",
      "notificationEnabled": true,
      "notificationTime": 30,  // 30 minutes before
      "isCompleted": false,
      "completedDate": null,
      "workoutResultId": null,
      "workout": {
        "id": "back-squat_week3",
        "exerciseName": "Back Squat",
        "week": 3,
        "day": 1
        // ... workout details
      }
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalPages": 1,
    "totalItems": 12,
    "hasNext": false,
    "hasPrevious": false
  }
}
```

---

### 9.2 Create Scheduled Workout

**POST** `/schedule`

Schedules a workout for a specific date/time.

**Request Body:**
```typescript
{
  "workoutId": string,
  "scheduledDate": string,
  "scheduledTime"?: string,
  "notificationEnabled"?: boolean,
  "notificationTime"?: number  // Minutes before workout
}
```

**Response:** `201 Created` - Returns created ScheduledWorkout object

---

### 9.3 Update Scheduled Workout

**PATCH** `/schedule/:scheduleId`

Updates a scheduled workout.

**Request Body:**
```typescript
{
  "scheduledDate"?: string,
  "scheduledTime"?: string,
  "notificationEnabled"?: boolean,
  "notificationTime"?: number
}
```

**Response:** `200 OK` - Returns updated scheduled workout

---

### 9.4 Complete Scheduled Workout

**POST** `/schedule/:scheduleId/complete`

Marks a scheduled workout as completed (links to workout result).

**Request Body:**
```typescript
{
  "workoutResultId": string
}
```

**Response:** `200 OK`

---

### 9.5 Delete Scheduled Workout

**DELETE** `/schedule/:scheduleId`

Deletes a scheduled workout.

**Response:** `204 No Content`

---

### 9.6 Get Upcoming Workouts

**GET** `/schedule/upcoming`

Returns upcoming scheduled workouts.

**Query Parameters:**
```typescript
{
  "days"?: number  // Default: 7 (next 7 days)
}
```

**Response:** `200 OK` - Array of ScheduledWorkout objects

---

## 10. Plate Calculator

### 10.1 List Plate Sets

**GET** `/plate-sets`

Returns all user's plate sets.

**Response:** `200 OK`
```typescript
{
  "success": true,
  "data": [
    {
      "id": "default-olympic",
      "userId": "usr_1234567890",
      "name": "Default Olympic Plates",
      "barWeight": 45,
      "plates": [
        { "weight": 45, "quantity": 4, "color": "#FF0000", "unit": "lbs" },
        { "weight": 35, "quantity": 2, "color": "#FFFF00", "unit": "lbs" },
        { "weight": 25, "quantity": 4, "color": "#00FF00", "unit": "lbs" },
        { "weight": 10, "quantity": 4, "color": "#0000FF", "unit": "lbs" },
        { "weight": 5, "quantity": 4, "color": "#FFFFFF", "unit": "lbs" },
        { "weight": 2.5, "quantity": 4, "color": "#808080", "unit": "lbs" }
      ],
      "isDefault": true,
      "latitude": null,
      "longitude": null,
      "locationName": null,
      "createdAt": "2026-01-01T00:00:00.000Z",
      "lastUsed": "2026-02-18T13:40:00.857Z"
    }
  ]
}
```

---

### 10.2 Create Plate Set

**POST** `/plate-sets`

Creates a new plate set configuration.

**Request Body:**
```typescript
{
  "name": string,
  "barWeight": number,
  "plates": Array<{
    weight: number,
    quantity: number,
    color?: string,
    unit: "lbs" | "kg"
  }>,
  "isDefault"?: boolean,
  "latitude"?: number,
  "longitude"?: number,
  "locationName"?: string
}
```

**Example:**
```typescript
{
  "name": "Gym Downtown",
  "barWeight": 45,
  "plates": [
    { "weight": 45, "quantity": 6, "color": "#FF0000", "unit": "lbs" },
    { "weight": 25, "quantity": 4, "color": "#00FF00", "unit": "lbs" },
    { "weight": 10, "quantity": 4, "color": "#0000FF", "unit": "lbs" }
  ],
  "isDefault": false,
  "latitude": 32.7767,
  "longitude": -96.7970,
  "locationName": "Downtown Fitness"
}
```

**Response:** `201 Created` - Returns created PlateSet object

---

### 10.3 Update Plate Set

**PUT** `/plate-sets/:plateSetId`

Updates a plate set.

**Request Body:** PlateSet fields to update

**Response:** `200 OK` - Returns updated plate set

---

### 10.4 Delete Plate Set

**DELETE** `/plate-sets/:plateSetId`

Deletes a plate set.

**Response:** `204 No Content`

**Errors:**
- `409 CONFLICT` - Cannot delete the last plate set

---

### 10.5 Calculate Plate Loading

**POST** `/plate-sets/calculate`

Calculates optimal plate combination for target weight.

**Request Body:**
```typescript
{
  "plateSetId": string,
  "targetWeight": number
}
```

**Response:** `200 OK`
```typescript
{
  "success": true,
  "data": {
    "targetWeight": 315,
    "actualWeight": 315,
    "barWeight": 45,
    "weightPerSide": 135,
    "platesPerSide": [
      { "weight": 45, "quantity": 2, "color": "#FF0000" },
      { "weight": 25, "quantity": 1, "color": "#00FF00" },
      { "weight": 10, "quantity": 2, "color": "#0000FF" }
    ],
    "canAchieveExact": true,
    "difference": 0,
    "loadingOrder": ["45", "45", "25", "10", "10"]
  }
}
```

---

### 10.6 Get Nearest Plate Set by Location

**POST** `/plate-sets/nearest`

Finds plate set closest to given coordinates (GPS-based).

**Request Body:**
```typescript
{
  "latitude": number,
  "longitude": number,
  "radiusKm"?: number  // Default: 1
}
```

**Response:** `200 OK`
```typescript
{
  "success": true,
  "data": {
    "plateSet": {
      "id": "plateset_gym_downtown",
      "name": "Gym Downtown",
      // ... complete plate set
    },
    "distance": 0.35,  // Kilometers
    "withinRadius": true
  }
}
```

---

## 11. Workout Templates

### 11.1 List Workout Templates

**GET** `/workout-templates`

Returns available workout program templates.

**Query Parameters:**
```typescript
{
  "type"?: "5-3-1" | "stronglifts" | "starting_strength" | "custom",
  "createdBy"?: "system" | "user",
  "page"?: number,
  "pageSize"?: number
}
```

**Response:** `200 OK`
```typescript
{
  "success": true,
  "data": [
    {
      "id": "template_531",
      "name": "5-3-1 for Beginners",
      "description": "Jim Wendler's 5-3-1 program optimized for beginners",
      "type": "5-3-1",
      "createdBy": "system",
      "isPublic": true,
      "exercises": [
        {
          "exerciseId": "back-squat",
          "exerciseName": "Back Squat",
          "day": 1,
          "sets": 3,
          "reps": "5/5/5+",
          "intensity": "65%/75%/85%",
          "notes": "AMRAP on final set"
        }
        // ... more exercises
      ],
      "durationWeeks": 4,
      "createdAt": "2026-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalPages": 1,
    "totalItems": 8,
    "hasNext": false,
    "hasPrevious": false
  }
}
```

---

### 11.2 Create Workout Template

**POST** `/workout-templates`

Creates a custom workout template.

**Request Body:**
```typescript
{
  "name": string,
  "description": string,
  "type": string,
  "exercises": Array<{
    exerciseId: string,
    day: number,
    sets: number,
    reps: string | number,
    intensity?: string,
    notes?: string
  }>,
  "durationWeeks": number,
  "isPublic"?: boolean  // Default: false
}
```

**Response:** `201 Created` - Returns created template

---

### 11.3 Get Template by ID

**GET** `/workout-templates/:templateId`

Returns a specific template.

**Response:** `200 OK` - Complete WorkoutTemplate object

---

### 11.4 Delete Workout Template

**DELETE** `/workout-templates/:templateId`

Deletes a custom template.

**Response:** `204 No Content`

**Errors:**
- `403 FORBIDDEN` - Cannot delete system templates
- `403 FORBIDDEN` - Can only delete own templates

---

## 12. Progress Analytics

### 12.1 Get Overall Progress Summary

**GET** `/analytics/progress`

Returns comprehensive progress analytics.

**Query Parameters:**
```typescript
{
  "startDate"?: string,
  "endDate"?: string,
  "exerciseIds"?: string  // Comma-separated
}
```

**Response:** `200 OK`
```typescript
{
  "success": true,
  "data": {
    "totalWorkouts": 47,
    "totalVolume": 125750,  // Total weight × reps
    "averageWorkoutsPerWeek": 3.2,
    "currentStreak": 12,  // Days
    "longestStreak": 21,
    "exerciseProgress": {
      "bench-press": {
        "exerciseName": "Bench Press",
        "firstRecorded1RM": 275,
        "latest1RM": 315,
        "best1RM": 315,
        "improvement": 14.5,  // Percentage
        "totalSessions": 18
      },
      "back-squat": {
        "exerciseName": "Back Squat",
        "firstRecorded1RM": 365,
        "latest1RM": 405,
        "best1RM": 405,
        "improvement": 11.0,
        "totalSessions": 16
      }
    },
    "recentWorkouts": [
      // ... last 5 workouts
    ]
  }
}
```

---

### 12.2 Get Exercise Progress Chart Data

**GET** `/analytics/exercise/:exerciseId/chart`

Returns time-series data for charting exercise progress.

**Query Parameters:**
```typescript
{
  "startDate"?: string,
  "endDate"?: string,
  "metric"?: "oneRepMax" | "volume" | "frequency"
}
```

**Response:** `200 OK`
```typescript
{
  "success": true,
  "data": {
    "exerciseId": "bench-press",
    "exerciseName": "Bench Press",
    "metric": "oneRepMax",
    "dataPoints": [
      {
        "date": "2026-01-15",
        "value": 275,
        "workoutResultId": "result_100"
      },
      {
        "date": "2026-01-29",
        "value": 285,
        "workoutResultId": "result_105"
      },
      {
        "date": "2026-02-12",
        "value": 295,
        "workoutResultId": "result_115"
      },
      {
        "date": "2026-02-18",
        "value": 315,
        "workoutResultId": "result_123"
      }
    ],
    "trend": {
      "direction": "increasing",
      "percentChange": 14.5,
      "averageChange": 3.6  // Per session
    }
  }
}
```

---

### 12.3 Get Volume Analytics

**GET** `/analytics/volume`

Returns training volume statistics.

**Query Parameters:**
```typescript
{
  "groupBy"?: "day" | "week" | "month",
  "startDate"?: string,
  "endDate"?: string
}
```

**Response:** `200 OK`
```typescript
{
  "success": true,
  "data": {
    "totalVolume": 125750,
    "volumeByPeriod": [
      {
        "period": "2026-W01",
        "volume": 18500,
        "workouts": 3
      },
      {
        "period": "2026-W02",
        "volume": 19200,
        "workouts": 3
      }
    ],
    "volumeByExercise": {
      "bench-press": 35750,
      "back-squat": 42000,
      "deadlift": 28000,
      "overhead-press": 20000
    }
  }
}
```

---

## 13. Progress Photos

### 13.1 List Progress Photos

**GET** `/progress-photos`

Returns user's progress photos.

**Query Parameters:**
```typescript
{
  "startDate"?: string,
  "endDate"?: string,
  "tags"?: string,  // Comma-separated
  "page"?: number,
  "pageSize"?: number
}
```

**Response:** `200 OK`
```typescript
{
  "success": true,
  "data": [
    {
      "id": "photo_123",
      "userId": "usr_1234567890",
      "imageUrl": "https://cdn.example.com/photos/photo_123.jpg",
      "thumbnailUrl": "https://cdn.example.com/photos/photo_123_thumb.jpg",
      "dateTaken": "2026-02-18T08:00:00.000Z",
      "bodyWeight": 185,
      "measurements": {
        "chest": 42,
        "waist": 32,
        "arms": 15.5,
        "legs": 24,
        "shoulders": 48,
        "unit": "inches"
      },
      "tags": ["front", "progress", "12-weeks"],
      "notes": "12 weeks into program",
      "createdAt": "2026-02-18T13:40:00.857Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalPages": 2,
    "totalItems": 24,
    "hasNext": true,
    "hasPrevious": false
  }
}
```

---

### 13.2 Upload Progress Photo

**POST** `/progress-photos`

Uploads a new progress photo.

**Request:** `multipart/form-data`
```typescript
{
  "image": File,  // Image file (JPG, PNG, max 10MB)
  "dateTaken"?: string,
  "bodyWeight"?: number,
  "measurements"?: {
    chest?: number,
    waist?: number,
    arms?: number,
    legs?: number,
    shoulders?: number,
    unit: "inches" | "cm"
  },
  "tags"?: string[],
  "notes"?: string
}
```

**Response:** `201 Created` - Returns created ProgressPhoto object

---

### 13.3 Update Progress Photo Metadata

**PATCH** `/progress-photos/:photoId`

Updates photo metadata (not the image itself).

**Request Body:**
```typescript
{
  "dateTaken"?: string,
  "bodyWeight"?: number,
  "measurements"?: object,
  "tags"?: string[],
  "notes"?: string
}
```

**Response:** `200 OK` - Returns updated photo

---

### 13.4 Delete Progress Photo

**DELETE** `/progress-photos/:photoId`

Deletes a progress photo.

**Response:** `204 No Content`

---

### 13.5 Generate Share URL

**POST** `/progress-photos/:photoId/share`

Generates a temporary shareable URL for a progress photo.

**Request Body:**
```typescript
{
  "expirationHours"?: number  // Default: 24
}
```

**Response:** `200 OK`
```typescript
{
  "success": true,
  "data": {
    "shareUrl": "https://share.intlbenchpressday.com/p/abc123",
    "expiresAt": "2026-02-19T13:40:00.857Z"
  }
}
```

---

## 14. Third-Party Integrations

### 14.1 Google Fit Authentication

**POST** `/integrations/google-fit/auth`

Initiates Google Fit OAuth flow.

**Response:** `200 OK`
```typescript
{
  "success": true,
  "data": {
    "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?..."
  }
}
```

---

### 14.2 Google Fit OAuth Callback

**POST** `/integrations/google-fit/callback`

Handles OAuth callback from Google.

**Request Body:**
```typescript
{
  "code": string  // Authorization code from Google
}
```

**Response:** `200 OK`
```typescript
{
  "success": true,
  "data": {
    "connected": true,
    "email": "user@gmail.com",
    "accessToken": "ya29.a0...",
    "refreshToken": "1//0gH..."
  }
}
```

---

### 14.3 Sync Workout to Google Fit

**POST** `/integrations/google-fit/sync`

Syncs a workout result to Google Fit.

**Request Body:**
```typescript
{
  "workoutResultId": string
}
```

**Response:** `200 OK`
```typescript
{
  "success": true,
  "data": {
    "sessionId": "fitness_session_123",
    "syncedAt": "2026-02-18T13:40:00.857Z",
    "activityType": "WeightTraining"
  }
}
```

---

### 14.4 Batch Sync to Google Fit

**POST** `/integrations/google-fit/batch-sync`

Syncs multiple workouts to Google Fit.

**Request Body:**
```typescript
{
  "workoutResultIds": string[]
}
```

**Response:** `200 OK`
```typescript
{
  "success": true,
  "data": {
    "synced": 5,
    "failed": 1,
    "results": [
      {
        "workoutResultId": "result_120",
        "success": true,
        "sessionId": "fitness_session_120"
      },
      {
        "workoutResultId": "result_121",
        "success": false,
        "error": "Network timeout"
      }
    ]
  }
}
```

---

### 14.5 Disconnect Google Fit

**DELETE** `/integrations/google-fit`

Disconnects Google Fit integration.

**Response:** `204 No Content`

---

### 14.6 Export to Apple HealthKit Format

**GET** `/integrations/apple-health/export`

Exports workout data in HealthKit-compatible format.

**Query Parameters:**
```typescript
{
  "workoutResultIds"?: string,  // Comma-separated
  "startDate"?: string,
  "endDate"?: string
}
```

**Response:** `200 OK`
```typescript
{
  "success": true,
  "data": {
    "workouts": [
      {
        "workoutActivityType": "HKWorkoutActivityTypeTraditionalStrengthTraining",
        "startDate": "2026-02-18T09:00:00.000Z",
        "endDate": "2026-02-18T09:45:00.000Z",
        "duration": 45,
        "totalEnergyBurned": 275,  // Calories (estimated)
        "metadata": {
          "exerciseName": "Back Squat",
          "cycleName": "Winter Cycle 2026",
          "totalVolume": 8750,
          "sets": 8
        }
      }
    ],
    "format": "HealthKit",
    "exportedAt": "2026-02-18T13:40:00.857Z"
  }
}
```

---

### 14.7 Export Calendar Events (ICS)

**GET** `/integrations/calendar/export`

Exports scheduled workouts as ICS calendar file.

**Query Parameters:**
```typescript
{
  "startDate"?: string,
  "endDate"?: string,
  "cycleId"?: string
}
```

**Response:** `200 OK`
```
Content-Type: text/calendar; charset=utf-8
Content-Disposition: attachment; filename="workout-schedule.ics"

BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//International Bench Press Day//NONSGML v1.0//EN
BEGIN:VEVENT
UID:schedule_123@intlbenchpressday.com
DTSTAMP:20260218T134000Z
DTSTART:20260219T090000Z
SUMMARY:Back Squat - Week 3 Day 1
DESCRIPTION:5/3/1 Workout\nWinter Cycle 2026\n...
END:VEVENT
END:VCALENDAR
```

---

### 14.8 Get Google Calendar URL

**GET** `/integrations/calendar/google-calendar-url`

Generates Google Calendar add event URL.

**Query Parameters:**
```typescript
{
  "scheduleId": string
}
```

**Response:** `200 OK`
```typescript
{
  "success": true,
  "data": {
    "url": "https://calendar.google.com/calendar/render?action=TEMPLATE&text=Back+Squat..."
  }
}
```

---

### 14.9 Get Outlook Calendar URL

**GET** `/integrations/calendar/outlook-calendar-url`

Generates Outlook Calendar add event URL.

**Query Parameters:**
```typescript
{
  "scheduleId": string
}
```

**Response:** `200 OK`
```typescript
{
  "success": true,
  "data": {
    "url": "https://outlook.live.com/calendar/0/deeplink/compose?..."
  }
}
```

---

## 15. Data Export & Import

### 15.1 Export All User Data

**GET** `/export`

Exports complete user data (GDPR compliance).

**Response:** `200 OK`
```
Content-Type: application/json
Content-Disposition: attachment; filename="ibpd-data-export-2026-02-18.json"

{
  "user": { /* User object */ },
  "preferences": { /* UserPreferences */ },
  "cycles": [ /* FiveThreeOneCycle[] */ ],
  "workoutResults": [ /* WorkoutResult[] */ ],
  "exerciseRecords": [ /* ExerciseRecord[] */ ],
  "customExercises": [ /* Exercise[] */ ],
  "plateSets": [ /* PlateSet[] */ ],
  "progressPhotos": [ /* ProgressPhoto[] (metadata only) */ ],
  "exportedAt": "2026-02-18T13:40:00.857Z",
  "version": "1.0"
}
```

---

### 15.2 Import User Data

**POST** `/import`

Imports previously exported user data.

**Request:** `multipart/form-data`
```typescript
{
  "dataFile": File,  // JSON file from export
  "mergeStrategy"?: "replace" | "merge" | "skip_duplicates"
}
```

**Response:** `200 OK`
```typescript
{
  "success": true,
  "data": {
    "imported": {
      "cycles": 3,
      "workoutResults": 47,
      "exerciseRecords": 125,
      "customExercises": 2,
      "plateSets": 2,
      "progressPhotos": 12
    },
    "skipped": {
      "duplicates": 5,
      "errors": 1
    },
    "errors": [
      "Workout result result_100: Invalid date format"
    ]
  }
}
```

---

## 16. Notifications

### 16.1 Get Pending Notifications

**GET** `/notifications`

Returns user's notifications.

**Query Parameters:**
```typescript
{
  "read"?: boolean,
  "type"?: "workout_reminder" | "progress_update" | "achievement",
  "page"?: number,
  "pageSize"?: number
}
```

**Response:** `200 OK`
```typescript
{
  "success": true,
  "data": [
    {
      "id": "notif_123",
      "userId": "usr_1234567890",
      "type": "workout_reminder",
      "title": "Workout Reminder",
      "message": "Back Squat workout scheduled in 30 minutes",
      "data": {
        "scheduleId": "schedule_123",
        "workoutId": "back-squat_week3"
      },
      "isRead": false,
      "createdAt": "2026-02-19T08:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalPages": 1,
    "totalItems": 5,
    "hasNext": false,
    "hasPrevious": false
  }
}
```

---

### 16.2 Mark Notification as Read

**PATCH** `/notifications/:notificationId/read`

Marks a notification as read.

**Response:** `200 OK`

---

### 16.3 Delete Notification

**DELETE** `/notifications/:notificationId`

Deletes a notification.

**Response:** `204 No Content`

---

### 16.4 Register Push Notification Token

**POST** `/notifications/push-token`

Registers device token for push notifications.

**Request Body:**
```typescript
{
  "token": string,
  "platform": "web" | "ios" | "android",
  "deviceId": string
}
```

**Response:** `201 Created`

---

## HTTP Status Codes

### Success Codes
- **200 OK** - Request succeeded, response body contains data
- **201 Created** - Resource created successfully
- **204 No Content** - Success with no response body (DELETE operations)

### Client Error Codes
- **400 Bad Request** - Invalid request format, parameters, or validation errors
- **401 Unauthorized** - Authentication required or failed
- **403 Forbidden** - User lacks permission for this operation
- **404 Not Found** - Resource not found
- **409 Conflict** - Resource conflict (duplicate, dependency violation)
- **422 Unprocessable Entity** - Request well-formed but contains semantic errors
- **429 Too Many Requests** - Rate limit exceeded

### Server Error Codes
- **500 Internal Server Error** - Unexpected server error
- **503 Service Unavailable** - Service temporarily unavailable

---

## Error Codes

```typescript
enum ErrorCode {
  // Authentication & Authorization
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
  TOKEN_EXPIRED = "TOKEN_EXPIRED",
  TOKEN_INVALID = "TOKEN_INVALID",
  EMAIL_NOT_VERIFIED = "EMAIL_NOT_VERIFIED",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  
  // Validation
  VALIDATION_ERROR = "VALIDATION_ERROR",
  INVALID_INPUT = "INVALID_INPUT",
  MISSING_REQUIRED_FIELD = "MISSING_REQUIRED_FIELD",
  INVALID_EMAIL_FORMAT = "INVALID_EMAIL_FORMAT",
  WEAK_PASSWORD = "WEAK_PASSWORD",
  
  // Resources
  RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND",
  DUPLICATE_RESOURCE = "DUPLICATE_RESOURCE",
  RESOURCE_IN_USE = "RESOURCE_IN_USE",
  
  // Business Logic
  INVALID_FORMULA = "INVALID_FORMULA",
  INVALID_REPS_FOR_FORMULA = "INVALID_REPS_FOR_FORMULA",
  CYCLE_NOT_ACTIVE = "CYCLE_NOT_ACTIVE",
  WORKOUT_ALREADY_COMPLETED = "WORKOUT_ALREADY_COMPLETED",
  CANNOT_DELETE_ACTIVE_CYCLE = "CANNOT_DELETE_ACTIVE_CYCLE",
  CANNOT_DELETE_LAST_PLATE_SET = "CANNOT_DELETE_LAST_PLATE_SET",
  
  // External Services
  GOOGLE_FIT_ERROR = "GOOGLE_FIT_ERROR",
  GOOGLE_FIT_NOT_CONNECTED = "GOOGLE_FIT_NOT_CONNECTED",
  STORAGE_ERROR = "STORAGE_ERROR",
  FILE_UPLOAD_ERROR = "FILE_UPLOAD_ERROR",
  FILE_TOO_LARGE = "FILE_TOO_LARGE",
  
  // General
  INTERNAL_ERROR = "INTERNAL_ERROR",
  SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED"
}
```

---

## Rate Limiting

All API endpoints are rate-limited to prevent abuse.

### Rate Limit Headers

Response includes headers:
```
X-RateLimit-Limit: 1000       // Requests per hour
X-RateLimit-Remaining: 997
X-RateLimit-Reset: 1708261200 // Unix timestamp when limit resets
```

### Rate Limits by Tier

| User Tier | Requests/Hour | Notes |
|-----------|---------------|-------|
| Unauthenticated | 100 | Public endpoints only |
| Authenticated User | 1000 | Standard tier |
| Premium User | 5000 | Paid tier |
| API Partner | 10000 | Third-party integrations |

### Endpoint-Specific Limits

| Endpoint Category | Limit |
|-------------------|-------|
| File Uploads | 50/hour |
| External Integrations | 200/hour |
| Analytics/Reports | 100/hour |
| General CRUD | 1000/hour |

### Rate Limit Exceeded Response

**429 Too Many Requests**
```typescript
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Please try again later.",
    "details": {
      "limit": 1000,
      "resetAt": "2026-02-18T14:40:00.857Z"
    }
  }
}
```

---

## Pagination

All list endpoints support cursor-based and page-based pagination.

### Query Parameters

```typescript
{
  "page": number,      // Page number (default: 1)
  "pageSize": number   // Items per page (default: 20, max: 100)
}
```

### Response Format

```typescript
{
  "success": true,
  "data": T[],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalPages": 5,
    "totalItems": 93,
    "hasNext": true,
    "hasPrevious": false
  }
}
```

### Link Headers

Responses include navigation links:
```
Link: <https://api.intlbenchpressday.com/api/v1/cycles?page=2>; rel="next",
      <https://api.intlbenchpressday.com/api/v1/cycles?page=5>; rel="last"
```

---

## Security Considerations

### Authentication

- **JWT tokens** with 1-hour expiration for access
- **Refresh tokens** with 30-day expiration for token renewal
- **Secure token storage** - httpOnly cookies recommended for web clients
- **Token rotation** - New refresh token issued on each refresh
- **Token revocation** - Logout invalidates refresh tokens

### Data Protection

- **HTTPS required** for all API endpoints
- **Password hashing** using bcrypt (cost factor 12+)
- **Input sanitization** and validation on all inputs
- **SQL injection prevention** via parameterized queries/ORM
- **XSS protection** - Content Security Policy headers
- **CSRF protection** - Token-based for state-changing operations

### Privacy

- **GDPR compliance** - Data export and deletion capabilities
- **User data isolation** - UserId in all queries prevents cross-user access
- **No third-party sharing** without explicit user consent
- **Audit logging** for sensitive operations (password changes, data exports)
- **Data minimization** - Only collect necessary information

### API Security

- **Rate limiting** per user and IP address
- **CORS configuration** - Whitelist allowed origins
- **Request size limits** - Prevent large payload attacks
- **File upload validation** - Type, size, and content checking
- **API key rotation** - Regular key rotation for integrations

---

## Implementation Recommendations

### Backend Technology Stack

**Runtime & Framework:**
- **Node.js 20+** or **Deno 2.0+** for runtime
- **NestJS** or **Fastify** for framework (TypeScript-native)
- **Express.js** as lightweight alternative

**Database & Storage:**
- **PostgreSQL 15+** for relational data (users, cycles, workouts)
- **Redis** for caching and session storage
- **AWS S3** or **Cloudflare R2** for file storage (progress photos)
- **Prisma** or **TypeORM** for database ORM

**Authentication & Security:**
- **Passport.js** with JWT strategy
- **bcrypt** for password hashing
- **express-rate-limit** for rate limiting

**External Services:**
- **Firebase Cloud Messaging** for push notifications
- **BullMQ** for background job processing
- **Sharp** for image processing/thumbnails

### Database Schema Design

**Key Principles:**
- User-centric design with `userId` foreign keys on all tables
- Proper indexing on frequently queried fields (userId, datePerformed, exerciseId)
- JSON/JSONB columns for flexible metadata (preferences, measurements)
- Database-level constraints for data integrity
- Soft deletes (deleted_at column) for auditing
- Created/updated timestamps on all tables

**Example Schema:**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  start_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT false,
  maxes JSONB NOT NULL,
  workouts JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_cycles_user_id ON cycles(user_id);
CREATE INDEX idx_cycles_is_active ON cycles(user_id, is_active);
```

### Performance Optimization

- **Database query optimization** - Use EXPLAIN ANALYZE, add indexes
- **Response caching** with Redis (5-minute TTL for analytics)
- **CDN** for static assets and images
- **Compression** - gzip/brotli for API responses
- **Connection pooling** for database connections
- **Background jobs** for expensive operations (reports, exports)
- **Lazy loading** - Paginate large result sets
- **Database read replicas** for analytics queries

### Monitoring & Observability

- **Request logging** - Morgan or Winston
- **Error tracking** - Sentry or Rollbar
- **Performance monitoring** - New Relic, DataDog, or Prometheus
- **Health check endpoints** - `/health` and `/health/db`
- **Metrics dashboard** - Grafana or built-in monitoring
- **Alerting** - PagerDuty or similar for critical errors

### Testing Strategy

- **Unit tests** for business logic (80%+ coverage)
- **Integration tests** for API endpoints (all critical paths)
- **E2E tests** for user workflows (registration, cycle creation, logging)
- **Load testing** - Artillery or k6 for scalability testing
- **Security testing** - OWASP ZAP for vulnerability scanning

---

## Migration Strategy

### Phase 1: Dual-Mode Operation (Months 1-2)

**Goal:** API coexists with IndexedDB without breaking existing users

- Create API endpoints matching current IndexedDB operations
- Client continues using IndexedDB as primary storage
- Feature flag enables API mode for testing
- Data remains local by default

**Changes:**
- Add API client layer to TypeScript app
- Implement feature flag system
- Create sync utilities (IndexedDB → API)
- No user-facing changes yet

---

### Phase 2: Gradual Migration (Months 2-4)

**Goal:** Users opt-in to cloud sync, data moves to API

- User authentication enabled (optional)
- Sync local data to API on first login
- Read from API, write to both (IndexedDB + API)
- Conflict resolution for offline changes
- Export/import maintains compatibility

**User Experience:**
- "Sign up for cloud sync" banner in app
- One-click sync of existing data
- Offline mode still works with IndexedDB
- Seamless sync when coming online

---

### Phase 3: API-First (Months 4-6)

**Goal:** API becomes primary, IndexedDB is cache

- API is primary data source
- IndexedDB used only for offline caching
- Service worker syncs changes when online
- PWA continues working offline
- Real-time updates via Server-Sent Events

**Architecture:**
```
User Action → API (if online) → IndexedDB Cache Update
User Action → IndexedDB Queue (if offline) → Sync to API when online
```

---

### Phase 4: Full Cloud (Month 6+)

**Goal:** Complete cloud-native operation

- All operations via API
- IndexedDB cache only (cleared periodically)
- Background sync for offline changes
- Real-time updates via WebSockets
- Multi-device synchronization
- Social features enabled

**New Capabilities:**
- See your data on any device
- Compare progress with friends
- Coach access to client data
- Advanced analytics and insights

---

## Versioning & Deprecation

### Version Strategy

- **Semantic versioning** - v1, v2, etc. for major versions
- **Maintain 2 major versions** simultaneously
- **6-month deprecation notice** before removing old version
- **Migration guides** published for each version upgrade

### API Version Header

Clients can specify version:
```
X-API-Version: v1
Accept: application/vnd.ibpd.v1+json
```

### Deprecation Process

1. **Announce deprecation** (6 months prior)
   - Update documentation
   - Add deprecation headers to responses
   ```
   Deprecation: true
   Sunset: Wed, 1 Jan 2027 00:00:00 GMT
   Link: <https://docs.api.com/migration>; rel="sunset"
   ```

2. **Provide migration guide**
   - Document breaking changes
   - Code examples for migration
   - Automated migration tools

3. **Monitor usage metrics**
   - Track version usage
   - Contact high-volume API users
   - Offer migration assistance

4. **Remove after deprecation period**
   - Return 410 Gone for removed endpoints
   - Redirect to latest version where possible

---

## TypeScript Type Definitions

Complete TypeScript interfaces for API requests and responses.

```typescript
// ============================================================================
// USER TYPES
// ============================================================================

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  gender?: "male" | "female" | "other" | "prefer_not_to_say";
  createdAt: string;
  updatedAt: string;
}

interface UserPreferences {
  id: string;
  userId: string;
  notifications: {
    enabled: boolean;
    workoutReminders: boolean;
    progressUpdates: boolean;
    leadTimeMinutes: number;
  };
  workoutDefaults: {
    defaultWorkoutTime: string;
    autoSave: boolean;
    autoSaveInterval: number;
    defaultRestTime: number;
  };
  units: {
    weightUnit: "lbs" | "kg";
    distanceUnit: "miles" | "km";
  };
  display: {
    theme: "light" | "dark" | "auto";
    showPlateCalculator: boolean;
    showRestTimer: boolean;
  };
  updatedAt: string;
}

// ============================================================================
// EXERCISE TYPES
// ============================================================================

interface Exercise {
  id: string;
  name: string;
  category: "Barbell" | "Dumbbell" | "Bodyweight" | "Cable" | "Machine";
  muscleGroups: string[];
  description?: string;
  isCustom: boolean;
  createdBy?: string;
  createdAt: string;
}

interface ExerciseRecord {
  id: string;
  userId: string;
  exerciseId: string;
  exerciseName: string;
  workoutSet: {
    Weight: number;
    Repetions: number;
  };
  oneRepMax: number;
  formulaUsed: string;
  formulaId: string;
  dateRecorded: string;
  notes?: string;
}

// ============================================================================
// FORMULA TYPES
// ============================================================================

interface Formula {
  id: string;
  name: string;
  description: string;
  formula: string;
  isCustom: boolean;
  isPredefined: boolean;
  validForReps?: string;
  createdAt: string;
}

// ============================================================================
// 5-3-1 TYPES
// ============================================================================

interface FiveThreeOneMax {
  exerciseId: string;
  exerciseName: string;
  oneRepMax: number;
  trainingMax: number;
}

interface FiveThreeOneSet {
  reps: number;
  percentage: number;
  weight: number;
  isAmrap?: boolean;
}

interface FiveThreeOneWorkout {
  id: string;
  week: number;
  day: number;
  exerciseId: string;
  exerciseName: string;
  mainSets: FiveThreeOneSet[];
  warmupSets: FiveThreeOneSet[];
  assistanceExercises?: string[];
  scheduledTime?: string;
}

interface FiveThreeOneCycle {
  id: string;
  userId: string;
  name: string;
  startDate: string;
  createdDate: string;
  isActive: boolean;
  notes?: string;
  maxes: FiveThreeOneMax[];
  workouts: FiveThreeOneWorkout[];
  progress?: {
    completedWorkouts: number;
    totalWorkouts: number;
    currentWeek: number;
    currentDay: number;
    percentComplete: number;
  };
}

// ============================================================================
// WORKOUT RESULT TYPES
// ============================================================================

interface WorkoutSetResult {
  plannedReps: number;
  plannedWeight: number;
  actualReps: number;
  actualWeight: number;
  percentage: number;
  isAmrap: boolean;
  rpe?: number;
  notes?: string;
}

interface AssistanceExerciseResult {
  exerciseName: string;
  sets: {
    reps: number;
    weight?: number;
    rpe?: number;
    notes?: string;
  }[];
}

interface WorkoutResult {
  id: string;
  userId: string;
  workoutId?: string;
  cycleId?: string;
  cycleName?: string;
  exerciseId: string;
  exerciseName: string;
  week: number;
  day: number;
  datePerformed: string;
  duration?: number;
  bodyWeight?: number;
  warmupResults: WorkoutSetResult[];
  mainSetResults: WorkoutSetResult[];
  assistanceWork?: AssistanceExerciseResult[];
  overallRpe?: number;
  workoutNotes?: string;
  estimatedOneRepMax?: number;
}

// ============================================================================
// SCHEDULING TYPES
// ============================================================================

interface ScheduledWorkout {
  id: string;
  userId: string;
  workoutId: string;
  scheduledDate: string;
  scheduledTime?: string;
  notificationEnabled: boolean;
  notificationTime?: number;
  isCompleted: boolean;
  completedDate?: string;
  workoutResultId?: string;
  workout?: FiveThreeOneWorkout;
}

// ============================================================================
// PLATE CALCULATOR TYPES
// ============================================================================

interface Plate {
  weight: number;
  quantity: number;
  color: string;
  unit: "lbs" | "kg";
}

interface PlateSet {
  id: string;
  userId: string;
  name: string;
  barWeight: number;
  plates: Plate[];
  isDefault: boolean;
  latitude?: number;
  longitude?: number;
  locationName?: string;
  createdAt: string;
  lastUsed?: string;
}

interface PlateCalculation {
  targetWeight: number;
  actualWeight: number;
  barWeight: number;
  weightPerSide: number;
  platesPerSide: {
    weight: number;
    quantity: number;
    color: string;
  }[];
  canAchieveExact: boolean;
  difference: number;
  loadingOrder?: string[];
}

// ============================================================================
// PROGRESS PHOTO TYPES
// ============================================================================

interface ProgressPhoto {
  id: string;
  userId: string;
  imageUrl: string;
  thumbnailUrl: string;
  dateTaken: string;
  bodyWeight?: number;
  measurements?: {
    chest?: number;
    waist?: number;
    arms?: number;
    legs?: number;
    shoulders?: number;
    unit: "inches" | "cm";
  };
  tags: string[];
  notes?: string;
  createdAt: string;
}

// ============================================================================
// ANALYTICS TYPES
// ============================================================================

interface ProgressAnalytics {
  totalWorkouts: number;
  totalVolume: number;
  averageWorkoutsPerWeek: number;
  currentStreak: number;
  longestStreak: number;
  exerciseProgress: {
    [exerciseId: string]: {
      exerciseName: string;
      firstRecorded1RM: number;
      latest1RM: number;
      best1RM: number;
      improvement: number;
      totalSessions: number;
    };
  };
  recentWorkouts: WorkoutResult[];
}

// ============================================================================
// PAGINATION TYPES
// ============================================================================

interface PaginationMeta {
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: {
    timestamp: string;
    requestId: string;
  };
}

interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    requestId?: string;
  };
}

interface ApiPaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: PaginationMeta;
}

type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
```

---

## Conclusion

This REST API specification provides a comprehensive, production-ready design for externalizing all application logic from the International Bench Press Day fitness tracker. The API enables:

✅ **Complete Functionality** - All 16 major feature areas covered  
✅ **Type Safety** - Full TypeScript type definitions  
✅ **Scalability** - Designed for growth with rate limiting and caching  
✅ **Security** - JWT auth, HTTPS, input validation, GDPR compliance  
✅ **Third-Party Integration** - Google Fit, Apple Health, calendar systems  
✅ **Offline-First** - PWA continues working with service worker sync  
✅ **Developer Experience** - Clear documentation, consistent patterns  
✅ **Migration Path** - Phased approach from IndexedDB to API  

### Next Steps

1. **Backend Implementation** - Build API using recommended stack
2. **Database Setup** - Create PostgreSQL schema and migrations
3. **Authentication** - Implement JWT and OAuth 2.0 flows
4. **Client Integration** - Add API client layer to React app
5. **Testing** - Unit, integration, and E2E test suites
6. **Deployment** - Set up CI/CD pipeline and hosting
7. **Documentation** - Interactive API docs (Swagger/OpenAPI)
8. **Monitoring** - Error tracking and performance monitoring

---

**Version**: 1.0  
**Last Updated**: February 18, 2026  
**Author**: GitHub Copilot  
**Status**: Design Specification - Ready for Implementation
