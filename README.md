# Nzila Gym Manager: The Open-Source Solution for Modern Fitness Centers

## 🚀 Overview

**Nzila Gym Manager** is a comprehensive, open-source application designed to streamline the operations of modern fitness centers, martial arts studios, and cross-training facilities. Built with a focus on modularity, performance, and security, Nzila provides a single pane of glass for managing members, scheduling classes, tracking payments, and optimizing training programs.

## ✨ Key Features

Nzila is built around a powerful set of modules to cover every aspect of gym management:

| Module | Description | Key Functionality |
| :--- | :--- | :--- |
| **Member Management** | Comprehensive member profiles, status tracking, and communication tools. | Member directory, profile editing, status updates. |
| **Check-ins & Kiosk** | Fast, reliable member check-in system with a dedicated Kiosk interface. | Attendance logging, real-time status display. |
| **Calendar & Scheduling** | Manage class schedules, recurring events, and staff assignments. | Class creation, recurring schedule management, staff calendar. |
| **Training & Progress** | Tools for creating, assigning, and tracking member workouts and progress. | Workout builder, member progress dashboards, rank promotion tracking. |
| **Financials** | Handle payments, generate invoices, and track financial health. | Payment processing, invoice generation, financial reporting. |
| **Leads & Sales** | Manage prospective members through a dedicated Kanban-style lead pipeline. | Lead tracking, sales pipeline management. |
| **Inventory & POS** | Point of Sale system for selling merchandise, supplements, and services. | Inventory management, transaction processing. |
| **Super Admin** | Tools for gym owners to manage multi-location setups and initial onboarding. | Gym setup wizard, owner pre-registration. |

## 🛠️ Technology Stack

Nzila is built on a modern, robust, and scalable technology stack:

| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | **React** (with Vite) & **TypeScript** | Fast, type-safe, and component-based user interface. |
| **Styling** | **Tailwind CSS** & **shadcn/ui** | Utility-first CSS framework for rapid, responsive design and accessible components. |
| **Backend/Database** | **Supabase** (`@supabase/supabase-js`) | Open-source Firebase alternative providing PostgreSQL database, Authentication, and Serverless Functions. |
| **State Management** | **React Query** (TanStack Query) | Efficient data fetching, caching, and synchronization. |
| **Routing** | **React Router DOM** | Declarative routing for a seamless single-page application experience. |
| **Validation** | **Zod** | Schema declaration and validation for ensuring data integrity and security. |

## 🔒 Security & Architecture Highlights

The project is architected with security and maintainability as core principles:

1.  **Role-Based Access Control (RBAC):** Protected routes and a dedicated `useRBAC` hook ensure that users only access modules and data relevant to their assigned roles (e.g., Member, Staff, Owner).
2.  **Strict Input Validation:** All data transfer objects (DTOs) and user inputs are strictly validated using **Zod** schemas, mitigating common injection and data integrity risks.
3.  **Parameterized Queries:** The backend architecture (Supabase) encourages the use of parameterized queries, preventing SQL injection vulnerabilities.
4.  **PII Protection:** Explicit development guidelines require contributors to avoid exposing Personally Identifiable Information (PII) in logs.

## 💻 Getting Started

This project was initialized using the Lovable platform.

### Prerequisites

You will need:
*   Node.js (LTS recommended)
*   npm or pnpm

### Local Development

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/clrogon/nzila-gym-manager.git
    cd nzila-gym-manager
    ```
2.  **Install dependencies:**
    ```sh
    npm install
    # or pnpm install
    ```
3.  **Start the development server:**
    ```sh
    npm run dev
    ```
    The application will be available at `http://localhost:5173` (or similar).
## ⚠️ Security Setup

1. **Never commit `.env` files**. Use `.env.example` as a template.
2. Copy `.env.example` to `.env` and fill in your Supabase credentials:
```bash
   cp .env.example .env
   # Edit .env with your actual values
```
3. Supabase RLS policies must be configured in your Supabase dashboard.
---
*This document was generated and enhanced by Manus AI.*
