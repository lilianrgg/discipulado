# Project Backlog — Discipleship MVP

Source: [`plan.md`](../plan.md)

---

## 1. Monorepo Setup and Passing Test Suite
Goal: Initialize the workspace monorepo structure with SvelteKit frontend and FastAPI backend with passing test commands.
Description: Create the project directory layout with separate `frontend/` (SvelteKit) and `backend/` (FastAPI) packages. Configure pytest for FastAPI and Vitest for SvelteKit so that running both test suites passes out of the box.

## 2. Supabase Integration and Initial Database Schema
Goal: Connect FastAPI backend and SvelteKit frontend to Supabase and establish core database migration scripts.
Description: Configure Supabase credentials and client initialization for Postgres DB and Auth. Write initial migration scripts defining core tables for user profiles, reading progress, prayer logs, community posts, and small groups.

## 3. Bible API Client Module (`bible-api.deno.dev`)
Goal: Build a dedicated HTTP client module for fetching Bible books, chapters, and verses from `bible-api.deno.dev`.
Description: Implement API client methods in FastAPI and TypeScript for querying `https://bible-api.deno.dev/api/books` and `https://bible-api.deno.dev/api/read/rv1960/{book}/{chapter}/{verse}`. Include input validation for book slugs, chapter numbers, and fallback error handling for network failures.

## 4. Mobile-First Bible Reader Shell with Guest Mode
Goal: Build the primary SvelteKit UI layout for browsing books, chapters, and verses with guest user support.
Description: Implement a responsive PWA reading interface allowing users to select books and chapters from RV1960. Ensure guest users can read Scripture immediately without needing to log in or create an account.

## 5. Service Worker and IndexedDB Offline Bible Cache
Goal: Enable complete offline Scripture reading by caching fetched Bible chapters in browser IndexedDB storage.
Description: Configure a Service Worker in SvelteKit to intercept network requests to `bible-api.deno.dev` and save chapter payloads into IndexedDB. Ensure offline readers load cached chapters instantly without active internet connectivity.

## 6. Client-Side Keyword Search Index
Goal: Provide offline-capable keyword and passage search across Spanish Scripture text.
Description: Develop a lightweight client-side search index built from cached Bible text or a thin FastAPI search proxy. Allow users to search for keywords or references with instant result highlighting.

## 7. User Authentication & Profile Management
Goal: Enable user registration, login, session persistence, and profile configuration via Supabase Auth.
Description: Build sign-up, sign-in, and password reset flows using Supabase Auth email/password credentials. Support guest-to-registered user account upgrade while preserving reading history.

## 8. Reading Plan Engine and Progress Tracker
Goal: Implement structured daily Bible reading plans with completion tracking.
Description: Create database schemas and endpoints for managing reading plans, daily chapter assignments, and user progress. Build SvelteKit UI components for joining plans, marking daily readings complete, and viewing progress streaks.

## 9. Private and Guided Prayer Tracker
Goal: Enable private prayer logging, prayer categories, and guided prayer prompt flows.
Description: Build backend models and frontend screens for managing private prayer requests and guided sessions. Enforce Row-Level Security (RLS) so private prayer records remain strictly confidential to the user.

## 10. Vector Ingestion Pipeline for Scripture and Sources
Goal: Build a RAG ingestion script that chunks and embeds RV1960 Scripture and approved sources into Supabase `pgvector`.
Description: Create a FastAPI ingestion pipeline that fetches RV1960 text from `bible-api.deno.dev` and approved commentary files. Generate vector embeddings using `sentence-transformers` / HuggingFace API and store chunk metadata in `pgvector`.

## 11. Open-Source LLM RAG Chat Service (Groq / Mistral AI / GitHub Models)
Goal: Build a Python RAG service that answers user questions using retrieved Scripture context and open-source LLMs.
Description: Implement similarity retrieval over `pgvector` and construct strict prompts for Groq Cloud, GitHub Models, or Mistral AI APIs. Enforce citation rules and fallback responses ("No sé") when context relevance falls below threshold.

## 12. Community Feed with Moderation Auto-Hide Queue
Goal: Create a community prayer request feed with comments, reactions, and automated content moderation.
Description: Implement community post creation, comments, and reaction counters backed by Supabase. Add moderation rules that flag inappropriate content to `hidden_pending_review` status for moderator audit.

## 13. Small Groups Management & Join Approvals
Goal: Implement group discovery, member join requests, and leader approval dashboards.
Description: Create endpoints and UI views for creating small groups, searching public groups, and sending join requests. Provide group leaders with an admin view to approve or reject pending member requests.

## 14. Daily Bible Reading Web Push Reminders
Goal: Deliver opt-in Web Push notifications for scheduled daily Bible reading reminders.
Description: Implement VAPID Web Push notification registration in the Service Worker and background scheduling in FastAPI. Allow users to set custom daily reminder times and receive browser push alerts.

## 15. Transactional Account & Data Deletion ("Right to be Forgotten")
Goal: Provide a secure account deletion flow that permanently removes all user data across all tables.
Description: Build a single transactional backend endpoint that cascades deletion of user profiles, prayer logs, community posts, comments, and auth records. Validate with automated tests that no orphaned records remain in Supabase after deletion.
