# Copilot Instructions for International Bench Press Day

This document provides guidance for GitHub Copilot when working on this repository.

## Project Overview

This is a Progressive Web Application (PWA) for fitness tracking built with
React, TypeScript, and Vite. It implements the 5/3/1 training methodology and
provides exercise tracking capabilities with full Section 508 accessibility
compliance.

## Technology Stack

- **Frontend**: React 19 with TypeScript
- **Build Tool**: Vite 7
- **Testing**: Vitest 3 with React Testing Library
- **Linting**: ESLint 9 with TypeScript and React plugins
- **Data Storage**: IndexedDB for client-side persistence
- **PWA**: Vite PWA plugin with Workbox

## Prerequisites

- Node.js 22.0.0 or higher
- npm 10.0.0 or higher

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run linting
npm run lint

# Run tests in watch mode
npm test

# Run tests once
npm run test:run
```

## Code Style and Conventions

### TypeScript

- Use strict TypeScript mode
- Define explicit types for function parameters and return values
- Use interfaces for object shapes
- Avoid `any` type - use proper typing

### React

- Use functional components with hooks
- Follow React hooks rules (no hooks in conditionals, loops, or nested functions)
- Use CSS Modules for component-scoped styling
- **Never use inline styles** - always use CSS Modules or external stylesheets
- Keep components small and focused

### File Organization

- Components go in `src/components/`
- Hooks go in `src/hooks/`
- Services and storage utilities go in `src/services/`
- Type definitions go in `src/types/`
- Tests go in `src/test/` with `.test.ts` or `.test.tsx` extensions

## Accessibility Requirements

This project requires **Section 508 compliance** and **WCAG 2.1 AA** standards:

- All interactive elements must be keyboard accessible
- Use semantic HTML elements (headings, landmarks, lists)
- Provide ARIA labels for all interactive elements
- Ensure sufficient color contrast ratios
- Include skip links for keyboard navigation
- Implement focus management for modals and dynamic content
- Provide alternative text for visual elements
- Test with screen readers

## Testing Guidelines

- Write tests for all new functionality
- Use React Testing Library with user-centric queries
- Test accessibility features (ARIA labels, keyboard navigation)
- Mock IndexedDB operations using the existing mock setup
- Target the existing pattern of comprehensive test coverage

## Documentation Guidelines

### Documentation Structure

All project documentation must be organized in the `docs/` folder, except for:

- `README.md` - Main project overview and getting started guide
- `CONTRIBUTING.md` - Contribution guidelines (if it exists)
- `LICENSE.md` or `LICENSE` - Project license (if it exists)

### Documentation Organization

Documentation in the `docs/` folder should be organized into logical subdirectories:

- `docs/features/` - Feature-specific documentation and implementation guides
- `docs/architecture/` - Technical architecture and design decisions
- `docs/accessibility/` - Accessibility compliance reports and improvements
- `docs/planning/` - Product roadmaps, TODO lists, and audit reports
- `docs/guides/` - User guides and how-to documentation

### When Contributing Documentation

- Place all new documentation in the appropriate `docs/` subdirectory
- Update the `docs/README.md` index when adding new documentation files
- Keep documentation up-to-date with code changes
- Follow the existing documentation format and style
- Include code examples and usage instructions where appropriate

## Pull Request Guidelines

Before committing any changes:

- **Lint all code** - Run `npm run lint` and fix all errors before committing
- **Run all unit tests** - Run `npm run test:run` and ensure all tests pass before committing
- **Lint Markdown documentation** - Ensure all documentation follows proper formatting standards

Before submitting a pull request:

- Ensure build succeeds (`npm run build`)
- Include accessibility testing for UI changes
- Add tests for new features
- Update documentation if needed (in the `docs/` folder)
