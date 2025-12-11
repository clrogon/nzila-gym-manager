# Contributing to Gym Manager

Thank you for your interest in contributing to Gym Manager! This document outlines the standards and processes for contributing to this project.

## Development Workflow

1.  **Fork & Clone**: Fork the repository and clone it locally.
2.  **Branching**: Create a feature branch (`git checkout -b feature/amazing-feature`).
3.  **Coding Standards**:
    *   **Strict TypeScript**: No `any` types unless absolutely necessary.
    *   **Validation**: All DTOs must have a corresponding Zod schema.
    *   **Security**: All API calls must utilize the `checkPermission` middleware simulation.
4.  **Commit Messages**: Use conventional commits (e.g., `feat: add workout module`, `fix: resolve calendar overlap`).

## Mock-First Strategy (CRITICAL)

**All new features must be implemented in the Development Environment first.**

1.  **Simulate**: Implement business logic in `services/*.ts` using local memory arrays (e.g., `MEMBERS_DB`).
2.  **Validate**: Ensure the feature is fully functional (UI + Logic) in "Mock Mode" before writing any backend code.
3.  **Compatibility**: Design data types (`types.ts`) to match the future SQL schema, ensuring a smooth transition to Test/Production.

*Do not rely on the backend API being available during the initial feature development phase.*

## Modular Architecture

When adding a new feature, please adhere to the modular structure:
*   **Types**: Define interfaces in `types.ts` (or `modules/X/types.ts` in refactor).
*   **Service**: Create a dedicated service (e.g., `services/workoutService.ts`) to handle business logic.
*   **UI**: Create a dedicated folder in `pages/` (e.g., `pages/Coaching/`).

## Security Checklist

Before submitting a PR, ensure:
- [ ] You are not exposing PII in logs.
- [ ] New inputs are validated with Zod.
- [ ] New database queries use parameterized inputs (in backend reference).

## Testing

Run the test suite before pushing:
```bash
npm test
```
*(Note: Test suite implementation is pending in v1.1)*