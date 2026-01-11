# API Documentation

Complete API reference for Nzila Gym Manager.

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Members API](#members-api)
4. [Classes API](#classes-api)
5. [Payments API](#payments-api)
6. [Training API](#training-api)
7. [Edge Functions](#edge-functions)

---

## Overview

### Base URL

```
Production: https://nzila-gym-manager.vercel.app
Development: http://localhost:8080
```

### Authentication

Most API endpoints require authentication. Include Supabase access token in request headers:

```
Authorization: Bearer <your-jwt-token>
apikey: <your-anon-key>
```

### Response Format

All API responses follow this structure:

```json
{
  "data": <response-data>,
  "error": <error-object-or-null>,
  "status": 200
}
```

### Error Handling

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 429 | Too Many Requests (rate limited) |
| 500 | Internal Server Error |

---

## Authentication

### Sign In

```http
POST /auth-with-rate-limit
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "action": "signin"
}
```

**Success Response (200):**
```json
{
  "data": {
    "session": {
      "access_token": "jwt-token",
      "refresh_token": "refresh-token",
      "user": {
        "id": "uuid",
        "email": "user@example.com"
      }
    }
  }
}
```

**Rate Limited Response (429):**
```json
{
  "error": {
    "message": "Too many login attempts. Please try again in 30 minutes.",
    "retry_after_seconds": 1800
  }
}
```

---

### Sign Up

```http
POST /auth-with-rate-limit
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "action": "signup",
  "fullName": "John Doe"
}
```

**Success Response (200):**
```json
{
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com"
    }
  }
}
```

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- Maximum 72 characters

---

### Magic Link Authentication

```http
POST /auth/v1/magic-link
```

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:** No content (email sent to user)

---

### Google OAuth

```http
POST /auth/v1/oauth/google
```

**Redirect:** User is redirected to Google authentication

---

## Members API

### Get All Members

```http
GET /rest/v1/members
Authorization: Bearer <jwt-token>
apikey: <anon-key>
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|--------|-------------|
| `gym_id` | string | Filter by gym (required for non-super-admins) |
| `status` | string | Filter by status (active, inactive, suspended, pending) |
| `limit` | integer | Max results per page |
| `offset` | integer | Pagination offset |

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "gym_id": "uuid",
      "full_name": "John Doe",
      "email": "john@example.com",
      "phone": "+244 123 456 789",
      "status": "active",
      "photo_url": "https://...",
      "created_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```

---

### Get Member by ID

```http
GET /rest/v1/members?id=eq.<member-id>
Authorization: Bearer <jwt-token>
```

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "full_name": "John Doe",
      "email": "john@example.com",
      "phone": "+244 123 456 789",
      "date_of_birth": "1990-01-01",
      "status": "active",
      "membership_plan_id": "uuid",
      "photo_url": "https://...",
      "created_at": "2025-01-01T00:00:00Z",
      "updated_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```

---

### Create Member

```http
POST /rest/v1/members
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "gym_id": "uuid",
  "full_name": "John Doe",
  "email": "john@example.com",
  "phone": "+244 123 456 789",
  "date_of_birth": "1990-01-01",
  "status": "active",
  "membership_plan_id": "uuid"
}
```

**Validation Rules:**
- `full_name`: Required, 1-100 characters
- `email`: Valid email format (optional for existing users)
- `phone`: Valid phone format (optional)
- `status`: One of: active, inactive, suspended, pending

**Response (201):**
```json
{
  "data": [
    {
      "id": "uuid",
      "full_name": "John Doe",
      "email": "john@example.com",
      "created_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```

---

### Update Member

```http
PATCH /rest/v1/members?id=eq.<member-id>
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

**Request Body:** (partial update supported)
```json
{
  "full_name": "John Updated",
  "phone": "+244 987 654 321"
}
```

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "full_name": "John Updated",
      "updated_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```

---

### Delete Member

```http
DELETE /rest/v1/members?id=eq.<member-id>
Authorization: Bearer <jwt-token>
```

**Response (204):** No content

**Permissions Required:**
- `gym_owner` or `admin` role for gym
- `super_admin` role for any gym

---

### Get Sensitive Member Data

```http
GET /rest/v1/member_sensitive_data?member_id=eq.<member-id>
Authorization: Bearer <jwt-token>
```

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "member_id": "uuid",
      "health_conditions": "Allergies to peanuts",
      "emergency_contact": "Jane Doe",
      "emergency_phone": "+244 123 456 789",
      "medical_notes": "Asthma, use inhaler if needed",
      "allergies": "Peanuts, shellfish",
      "blood_type": "O+",
      "last_accessed_by": "uuid",
      "last_accessed_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```

**Permissions Required:**
- `gym_owner`, `admin`, `manager`, `physiotherapist`, or `nutritionist` role for gym
- `super_admin` role for any gym

**Audit Logged:** ✅ Every access is logged to `sensitive_data_access_log` table.

---

## Classes API

### Get Classes

```http
GET /rest/v1/classes
Authorization: Bearer <jwt-token>
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|--------|-------------|
| `gym_id` | string | Filter by gym (required) |
| `start_date` | date | Filter classes from date |
| `end_date` | date | Filter classes until date |
| `discipline_id` | string | Filter by discipline |
| `location_id` | string | Filter by location |
| `coach_id` | string | Filter by coach |
| `is_active` | boolean | Filter active classes only |

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "gym_id": "uuid",
      "title": "BJJ Fundamentals",
      "description": "Introduction to Brazilian Jiu-Jitsu techniques",
      "start_time": "2025-01-01T10:00:00Z",
      "end_time": "2025-01-01T11:00:00Z",
      "capacity": 20,
      "current_bookings": 15,
      "coach_id": "uuid",
      "location_id": "uuid",
      "discipline_id": "uuid",
      "is_mandatory": false,
      "is_active": true
    }
  ]
}
```

---

### Create Class

```http
POST /rest/v1/classes
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "gym_id": "uuid",
  "title": "BJJ Fundamentals",
  "description": "Introduction to Brazilian Jiu-Jitsu techniques",
  "start_time": "2025-01-01T10:00:00Z",
  "end_time": "2025-01-01T11:00:00Z",
  "capacity": 20,
  "coach_id": "uuid",
  "location_id": "uuid",
  "discipline_id": "uuid",
  "is_mandatory": false,
  "is_active": true
}
```

**Validation Rules:**
- `title`: Required, 1-100 characters
- `start_time`: Required, ISO 8601 format
- `end_time`: Required, after start_time
- `capacity`: Positive integer, max 1000
- `is_mandatory`: Boolean
- `is_active`: Boolean

**Permissions Required:**
- `gym_owner`, `manager`, `admin`, or `coach` role

**Response (201):** Class object

---

### Book Class

```http
POST /rest/v1/class_bookings
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "member_id": "uuid",
  "class_id": "uuid",
  "booking_date": "2025-01-01T00:00:00Z"
}
```

**Response (201):**
```json
{
  "data": [
    {
      "id": "uuid",
      "member_id": "uuid",
      "class_id": "uuid",
      "status": "booked",
      "created_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```

**Waitlist Behavior:**
- If class is full, member is added to waitlist
- When spot opens, first waitlisted member is automatically booked
- Member receives notification of booking confirmation

---

## Payments API

### Get Payments

```http
GET /rest/v1/payments
Authorization: Bearer <jwt-token>
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|--------|-------------|
| `gym_id` | string | Filter by gym (required) |
| `member_id` | string | Filter by member |
| `payment_method` | string | Filter by method (multicaixa, cash, bank_transfer, other) |
| `from_date` | date | From date |
| `to_date` | date | To date |

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "gym_id": "uuid",
      "member_id": "uuid",
      "amount": 35000.00,
      "payment_method": "multicaixa",
      "reference": "REF123456",
      "multicaixa_reference": "MCA987654",
      "description": "Monthly membership",
      "created_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```

---

### Create Payment

```http
POST /rest/v1/payments
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "gym_id": "uuid",
  "member_id": "uuid",
  "amount": 35000.00,
  "payment_method": "multicaixa",
  "reference": "REF123456",
  "multicaixa_reference": "MCA987654",
  "description": "Monthly membership"
}
```

**Validation Rules:**
- `amount`: Positive, max 999,999,999
- `payment_method`: One of: multicaixa, cash, bank_transfer, other
- `reference`: Max 100 characters (optional)
- `multicaixa_reference`: Max 50 characters (required for multicaixa payments)

**Permissions Required:**
- `gym_owner`, `manager`, `admin`, or `receptionist` role

**Response (201):** Payment object

---

## Training API

### Get Exercises

```http
GET /rest/v1/exercises
Authorization: Bearer <jwt-token>
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|--------|-------------|
| `gym_id` | string | Filter by gym (for gym-specific exercises) |
| `discipline_id` | string | Filter by discipline |
| `category` | string | Filter by category |
| `difficulty` | string | Filter by difficulty (beginner, intermediate, advanced, expert) |
| `is_active` | boolean | Filter active exercises only |

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Push Up",
      "description": "Classic push up exercise",
      "category": "Strength",
      "difficulty": "beginner",
      "equipment": "Bodyweight",
      "muscle_groups": ["Chest", "Triceps"],
      "instructions": "Start in plank position, lower body, push up",
      "video_url": "https://youtube.com/watch?v=...",
      "is_active": true
    }
  ]
}
```

---

### Create Exercise

```http
POST /rest/v1/exercises
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "gym_id": "uuid",
  "name": "Push Up",
  "description": "Classic push up exercise",
  "category": "Strength",
  "difficulty": "beginner",
  "equipment": "Bodyweight",
  "muscle_groups": ["Chest", "Triceps"],
  "instructions": "Start in plank position, lower body, push up",
  "video_url": "https://youtube.com/watch?v=...",
  "is_active": true
}
```

**Permissions Required:**
- `gym_owner`, `manager`, `admin`, or `coach` role

---

### Get Workout Templates

```http
GET /rest/v1/workout_templates
Authorization: Bearer <jwt-token>
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|--------|-------------|
| `gym_id` | string | Filter by gym (for gym-specific templates) |
| `discipline_id` | string | Filter by discipline |
| `difficulty` | string | Filter by difficulty |
| `is_public` | boolean | Filter public templates |
| `is_active` | boolean | Filter active templates only |

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "gym_id": "uuid",
      "name": "Full Body WOD",
      "description": "Complete body workout",
      "category": "WOD",
      "difficulty": "intermediate",
      "discipline_id": "uuid",
      "estimated_duration": 60,
      "is_public": true,
      "is_active": true,
      "exercises": [
        {
          "exercise_id": "uuid",
          "sets": 3,
          "reps": 10,
          "duration_seconds": 60,
          "rest_seconds": 30,
          "notes": "Maintain proper form"
        }
      ]
    }
  ]
}
```

---

### Assign Workout to Member

```http
POST /rest/v1/assigned_workouts
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "member_id": "uuid",
  "workout_template_id": "uuid",
  "assigned_by": "uuid",
  "due_date": "2025-01-10T00:00:00Z"
}
```

**Permissions Required:**
- `gym_owner`, `manager`, `admin`, `coach`, or `trainer` role

**Response (201):** Assignment object

---

## Edge Functions

### auth-with-rate-limit

Server-side rate limiting for authentication.

**Endpoint:** `POST /functions/v1/auth-with-rate-limit`

**Rate Limits:**
- IP-based: 5 attempts per 15 minutes
- Email-based: 3 attempts per 15 minutes
- Temporary block: 30 minutes after limit exceeded

**Request/Response:** See [Authentication](#authentication) section.

---

### send-email

Sends transactional emails via Resend API.

**Endpoint:** `POST /functions/v1/send-email`

**Request Body:**
```json
{
  "to": "user@example.com",
  "subject": "Welcome to Nzila Gym",
  "template": "welcome",
  "data": {
    "name": "John",
    "gym_name": "Elite Fit Luanda"
  }
}
```

**Response (200):**
```json
{
  "message": "Email sent successfully",
  "email_id": "resend-email-id"
}
```

**Audit Logged:** ✅ All emails logged to `email_audit_log` table.

---

### send-welcome-email

Sends welcome emails for new user registrations.

**Endpoint:** `POST /functions/v1/send-welcome-email`

**Request Body:**
```json
{
  "email": "user@example.com",
  "full_name": "John Doe"
}
```

**Triggered:** Automatically when new user registers via Supabase Auth.

---

### create-user-account

Creates user account with temporary password and sends welcome email.

**Endpoint:** `POST /functions/v1/create-user-account`

**Request Body:**
```json
{
  "email": "user@example.com",
  "full_name": "John Doe",
  "gym_id": "uuid",
  "role": "member",
  "gym_name": "Elite Fit Luanda"
}
```

**Permissions Required:** `gym_owner` or `admin` role

**Response (200):**
```json
{
  "message": "Account created and welcome email sent",
  "user_id": "uuid"
}
```

---

### seed-super-admin

Initializes super admin account for platform setup.

**Endpoint:** `POST /functions/v1/seed-super-admin`

**Request Body:**
```json
{
  "email": "superadmin@nzila.ao",
  "password": "SecureAdmin123"
}
```

**Usage:** One-time setup function for initial platform deployment.

**Permissions Required:** None (setup function, no JWT verification).

---

## Error Handling

### Standard Error Response

```json
{
  "error": {
    "message": "Human-readable error message",
    "code": "ERROR_CODE",
    "details": {
      "field": "email",
      "constraint": "unique"
    }
  }
}
```

### Common Error Codes

| Code | Description |
|-------|-------------|
| `PGRST116` | RLS policy violation |
| `PGRST301` | Not found |
| `23505` | Unique constraint violation |
| `23503` | Foreign key constraint violation |
| `42901` | Rate limit exceeded |

---

## Rate Limiting

### Endpoints with Rate Limiting

| Endpoint | Limit | Duration |
|----------|--------|----------|
| `/auth-with-rate-limit` | 5 per IP, 3 per email | 15 minutes |
| `/create-user-account` | 5 per user | 15 minutes |

### Response Headers

```http
HTTP/1.1 429 Too Many Requests
Content-Type: application/json
Retry-After: 1800
```

---

## Webhooks

**Coming Soon:** Webhook support planned for v2.0.

---

## SDK

### JavaScript/TypeScript Client

The Supabase client is used for all API calls:

```typescript
import { supabase } from '@/integrations/supabase/client';

// Query
const { data, error } = await supabase
  .from('members')
  .select('*')
  .eq('gym_id', gymId);

// Insert
const { data, error } = await supabase
  .from('payments')
  .insert([{ amount, payment_method }]);

// Update
const { data, error } = await supabase
  .from('members')
  .update({ status: 'suspended' })
  .eq('id', memberId);
```

---

## Changelog

### Version 1.0.2 (January 2025)

- Added email notification endpoints
- Added member audit logging
- Enhanced security policies

### Version 1.0.1 (January 2025)

- Added rate limiting endpoint
- Security hardening
- Sensitive data isolation

---

**Last Updated:** January 11, 2026
