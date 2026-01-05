# Contributing to International Bench Press Day

Thank you for your interest in contributing to the International Bench Press Day fitness tracking application! This document provides guidelines for contributing to the project.

## Getting Started

### Prerequisites

- Node.js 22.0.0 or higher
- npm 10.0.0 or higher
- Git

### Development Setup

1. **Fork and Clone**

   ```bash
   git clone https://github.com/YOUR_USERNAME/intl-bench-press-day.git
   cd intl-bench-press-day
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Start Development Server**

   ```bash
   npm run dev
   ```

4. **Run Tests**

   ```bash
   npm test
   ```

## Development Workflow

### Making Changes

1. **Create a Feature Branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Your Changes**
   - Follow the coding standards outlined below
   - Write tests for new functionality
   - Ensure accessibility compliance

3. **Test Your Changes**

   ```bash
   npm run test:run    # Run all tests
   npm run lint        # Check code style
   npm run build       # Verify production build
   ```

4. **Commit Your Changes**

   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

5. **Push and Create Pull Request**

   ```bash
   git push origin feature/your-feature-name
   ```

## Code Standards

### TypeScript

- Use strict TypeScript mode
- Define explicit types for function parameters and return values
- Use interfaces for object shapes
- Avoid `any` type - use proper typing
- Follow existing naming conventions

### React

- Use functional components with hooks
- Follow React hooks rules (no hooks in conditionals, loops, or nested functions)
- Use CSS Modules for component-scoped styling
- Keep components small and focused
- Implement proper error boundaries

### File Organization

- Components go in `src/components/`
- Hooks go in `src/hooks/`
- Services and storage utilities go in `src/services/`
- Type definitions go in `src/types/`
- Tests go in `src/test/` with `.test.ts` or `.test.tsx` extensions
- **Documentation goes in `docs/`** (see Documentation Guidelines below)

## Accessibility Requirements

This project is committed to **Section 508 compliance** and **WCAG 2.1 AA** standards:

### Required Accessibility Features

- ✅ All interactive elements must be keyboard accessible
- ✅ Use semantic HTML elements (headings, landmarks, lists)
- ✅ Provide ARIA labels for all interactive elements
- ✅ Ensure sufficient color contrast ratios (4.5:1 for normal text, 3:1 for large text)
- ✅ Include skip links for keyboard navigation
- ✅ Implement focus management for modals and dynamic content
- ✅ Provide alternative text for visual elements
- ✅ Test with screen readers (NVDA, JAWS, or VoiceOver)

### Accessibility Testing

Before submitting a pull request:

1. Test keyboard navigation (Tab, Shift+Tab, Enter, Space, Arrow keys)
2. Verify proper focus indicators
3. Check color contrast with browser dev tools
4. Test with a screen reader
5. Validate ARIA labels and roles

## Testing Guidelines

### Writing Tests

- Write tests for all new functionality
- Use React Testing Library with user-centric queries
- Test accessibility features (ARIA labels, keyboard navigation)
- Mock IndexedDB operations using the existing mock setup
- Aim for comprehensive test coverage

### Test Structure

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';

describe('ComponentName', () => {
  it('should render with correct accessibility attributes', () => {
    render(<ComponentName />);
    const button = screen.getByRole('button', { name: /submit/i });
    expect(button).toBeInTheDocument();
  });
});
```

### Running Tests

```bash
npm test              # Run tests in watch mode
npm run test:run      # Run all tests once
npm run test:ui       # Run tests with interactive UI
```

## Documentation Guidelines

### Documentation Structure

All project documentation must be organized in the `docs/` folder, except for:

- `README.md` - Main project overview and getting started guide
- `CONTRIBUTING.md` - This file (contribution guidelines)
- `LICENSE.md` or `LICENSE` - Project license (if it exists)

### Documentation Organization

Place documentation in the appropriate subdirectory:

- `docs/features/` - Feature-specific documentation and implementation guides
- `docs/architecture/` - Technical architecture and design decisions
- `docs/accessibility/` - Accessibility compliance reports and improvements
- `docs/planning/` - Product roadmaps, TODO lists, and audit reports
- `docs/guides/` - User guides and how-to documentation

### Writing Documentation

When adding or updating documentation:

1. **Use Clear Structure**
   - Start with an overview
   - Include a table of contents for longer documents
   - Use descriptive headings

2. **Provide Examples**
   - Include code examples where appropriate
   - Show both correct and incorrect usage
   - Demonstrate edge cases

3. **Keep It Current**
   - Update documentation when changing related code
   - Remove or update outdated information
   - Reflect the current state of the application

4. **Follow Markdown Best Practices**
   - Use proper heading hierarchy (h1 → h2 → h3)
   - Format code blocks with language identifiers
   - Include links to related documentation

5. **Update the Index**
   - Add new documentation files to `docs/README.md`
   - Categorize appropriately
   - Provide brief descriptions

## Pull Request Process

### Before Submitting

1. ✅ All tests pass (`npm run test:run`)
2. ✅ Linting passes (`npm run lint`)
3. ✅ Build succeeds (`npm run build`)
4. ✅ Accessibility features tested
5. ✅ Documentation updated (if applicable)
6. ✅ No console errors or warnings

### Pull Request Template

When creating a pull request, include:

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] All existing tests pass
- [ ] New tests added (if applicable)
- [ ] Accessibility tested

## Accessibility Checklist
- [ ] Keyboard navigation tested
- [ ] Screen reader compatible
- [ ] ARIA labels present
- [ ] Color contrast verified

## Documentation
- [ ] Documentation updated in `docs/` folder
- [ ] Code comments added where needed
- [ ] README updated (if needed)
```

### Review Process

1. **Automated Checks**: CI/CD pipeline runs tests and builds
2. **Code Review**: Maintainers review code quality and standards
3. **Accessibility Review**: Verify Section 508 compliance
4. **Testing**: Validate functionality across devices
5. **Merge**: Once approved, changes are merged

## Commit Message Guidelines

Follow conventional commit format:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

Examples:

```
feat: add voice navigation support
fix: resolve plate calculator rounding issue
docs: update PWA implementation guide
test: add tests for workout logger
```

## Code Review Guidelines

### For Contributors

- Respond to feedback promptly
- Be open to suggestions
- Ask questions if unclear
- Make requested changes in new commits (don't force push)

### For Reviewers

- Be respectful and constructive
- Explain the reasoning behind suggestions
- Acknowledge good solutions
- Focus on code quality and standards

## Getting Help

- **📋 Issues**: [Report bugs or request features](https://github.com/utdcometsoccer/intl-bench-press-day/issues)
- **📖 Documentation**: Check the `docs/` folder for guides
- **💬 Discussions**: Use GitHub Discussions for questions

## License

By contributing to this project, you agree that your contributions will be licensed under the same license as the project (MIT License).

---

Thank you for contributing to International Bench Press Day! 🏋️
