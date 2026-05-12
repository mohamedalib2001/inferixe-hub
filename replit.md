# Inferixe - Enterprise Management Platform

## Overview
Inferixe is a comprehensive enterprise digital platform designed for unified business management. It integrates HR, Fleet, Finance, and Operations management into a single, powerful system. The platform aims to streamline business processes, enhance efficiency, and provide a centralized solution for enterprise needs, offering full bilingual support (English/Arabic) and accommodating both RTL and LTR layouts. Key capabilities include a robust Request Management System, sophisticated Recruitment and Hiring functionalities, detailed Commercial Contracts Management with AI-powered analysis, and an advanced Location-Based Face Attendance system.

## User Preferences
- Professional, corporate design aesthetic
- Bilingual support (Arabic RTL + English LTR)
- Dark/Light theme support
- Material Design 3 inspiration

## System Architecture

### UI/UX Decisions
The platform prioritizes a professional, corporate design aesthetic, drawing inspiration from Material Design 3. It features full bilingual support with dynamic RTL/LTR layouts and a dark/light theme toggle. Key UI components include a categorized dropdown for request types with icons, specialized forms for various request inputs, and a professional digital employee card with a gradient design and shareable link. The public-facing landing page follows a corporate SaaS design with responsive layouts for desktop, tablet, and mobile.

### Technical Implementations
Inferixe is built with a modern web stack:
- **Frontend**: React, TypeScript, and Vite for a fast and reactive user interface.
- **Backend**: Express.js with TypeScript for a robust API layer.
- **Database**: PostgreSQL, managed with Drizzle ORM for type-safe database interactions.
- **Styling**: Tailwind CSS for utility-first styling, augmented by shadcn/ui components for pre-built, accessible UI elements.
- **State Management**: TanStack Query for efficient data fetching, caching, and state synchronization.

### Feature Specifications
The system encompasses several core features:
- **Comprehensive Request Management**: Supports over 30 request types across 6 categories (Attendance & Leave, Work Status, Payroll, HR & Compliance, Operations, General) with conditional form fields and full bilingual support.
- **Manager-Scope Data Visibility**: Implements a system where managers can only access data (employees, branches, attendance) relevant to their assigned scope (branch or specific employees). Super admins, admins, HR, and finance roles have unrestricted access.
- **Security & API Improvements**: Enhanced security with various HTTP headers (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, HSTS, CSP, COOP, CORP), secure session management (custom cookie name, SameSite=lax, HttpOnly, Secure), IP-based rate limiting, sensitive data exclusion from API responses, and request body size limits.
- **Role-Based Access Control (RBAC)**: Enforces strict data isolation using roles like super_admin, admin, hr, finance, operations, fleet_manager, and employee. It includes dedicated employee self-service pages (`/my-dashboard`, `/my-requests`, `/my-attendance`, `/my-profile`, `/my-card`) and secures management endpoints.
- **Recruitment/Hiring System**: Features a comprehensive database schema for job postings, applications, interviews, and feedback. Includes a public careers page, multi-step application forms, and an HR recruitment dashboard with statistics, pipeline visualization, and status filtering.
- **Commercial Contracts Management**: Manages contracts, parties, properties, units, and payments. A key feature is AI-powered contract analysis using GPT-4o to extract data from uploaded images or text, supporting bilingual contracts and providing confidence scores.
- **Digital Employee Card**: Generates a professional, shareable digital employee card with a verified badge and bilingual theme toggle.
- **Location-Based Face Attendance**: Enables attendance tracking with GPS geofencing, Haversine distance calculation, and face recognition. It supports branch management with configurable geofence radii and a dedicated Kiosk mode.
- **Payroll Management**: Provides functionalities for monthly payroll processing, including running payroll, managing employee payroll items (base salary, additions, deductions), and recurring adjustment templates.

### System Design Choices
The project utilizes a clear separation of concerns with a well-defined project structure (`client/`, `server/`, `shared/`). It employs a robust PostgreSQL database schema with numerous tables to support detailed records for employees, attendance, requests, fleet, contracts, recruitment, and payroll. API endpoints are RESTful, securing sensitive operations with middleware for role-based access control and scope-based data filtering.

## External Dependencies
- **OpenAI GPT-4o**: Used for AI-powered contract analysis, extracting data from contract images or text.