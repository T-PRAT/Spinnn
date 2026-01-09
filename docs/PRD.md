# Product Requirements Document

## Product Name

Spinnn

---

## 1. Product Goal

Build a minimal web application to use with a bike home trainer.

---

## 2. Target User

Individual indoor cycling users doing a home trainer session.

---

## 3. Core Use Case

User selects a workout from a list of workouts or from a file upload.
User connects home trainer and heart rate monitor.
User sees data (power, heart rate, speed, etc.) evolving over time on a single chart.

---

## 4. Core Features (V1)

### In Scope

- Workout selection
- Home trainer connection
- Heart rate monitor connection
- Data visualization

### Out of Scope

- Upload workout to Strava
- Upload workout to Intervals.icu

---

## 5. Data Model

---

## 6. UI Principles

- Single screen
- Single main chart
- No unnecessary UI elements
- Focus on readability

---

## 7. Technical Constraints

- Frontend only
- Vue 3
- D3.js for chart rendering
- JavaScript (no TypeScript)
- Bun as package manager
- No external APIs

---

## 8. Success Criteria

- Chart updates smoothly in real time
- Data is readable at a glance
- Application loads quickly
- No crashes or errors
- Codebase remains small and maintainable

---

## 10. Guiding Principle

Implement one chart correctly before adding features.
