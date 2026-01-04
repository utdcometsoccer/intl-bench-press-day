# Documentation Index

Welcome to the International Bench Press Day documentation. This index provides a comprehensive guide to all project documentation.

## 📋 Quick Links

- [Main README](../README.md) - Project overview and getting started
- [Contributing Guidelines](../CONTRIBUTING.md) - How to contribute to the project
- [Copilot Instructions](../.github/copilot-instructions.md) - Guidelines for GitHub Copilot

## 📚 Documentation Structure

### 🎯 Features

Feature-specific documentation and implementation guides:

- **[Plate Calculator](features/PLATE-CALCULATOR.md)** - Comprehensive guide to the smart plate calculation system with GPS location awareness
- **[PWA Implementation](features/PWA-IMPLEMENTATION.md)** - Progressive Web Application setup, service workers, and offline functionality
- **[AMRAP 1RM Recording](features/AMRAP-1RM-FEATURE.md)** - Automatic one-rep-max recording from AMRAP sets in workout logger
- **[Workout Logger Generalization](features/WORKOUT-LOGGER-GENERALIZATION.md)** - Implementation of unified workout system supporting multiple programs
- **[Calendar Synchronization](features/CALENDAR-SYNC.md)** - Export workout schedules to Google Calendar, Outlook, Apple Calendar, and ICS files

### ♿ Accessibility

Accessibility compliance reports and improvements:

- **[Section 508 Audit Report](accessibility/accessibility-audit-report.md)** - Comprehensive Section 508 compliance analysis with 90/100 score
- **[Accessibility Improvements Summary](accessibility/ACCESSIBILITY-IMPROVEMENTS-SUMMARY.md)** - Summary of accessibility improvements achieving Section 508 compliance

### 📊 Planning & Roadmaps

Product planning, roadmaps, and audit reports:

- **[Product Roadmap](planning/PRODUCT-ROADMAP.md)** - Quarterly development roadmap with feature priorities and testing strategy
- **[TODO List](planning/TODO.md)** - Active development tasks organized by priority and quarter
- **[UI/UX Audit Report](planning/UI-UX-AUDIT-REPORT.md)** - Comprehensive UI/UX audit with identified issues and resolutions
- **[UI/UX Analysis and Product Roadmap](planning/UI-UX-ANALYSIS-AND-PRODUCT-ROADMAP.md)** - Detailed UI/UX analysis with strategic planning for future features

### 📖 Guides

User guides and how-to documentation:

- **[Auto-Save Guide](guides/AUTO_SAVE_GUIDE.md)** - Implementation guide for auto-save workout sessions with configurable intervals

### 🏗️ Architecture

Technical architecture and design decisions:

*Currently no architecture documentation - future home for system design docs*

## 📝 Documentation Guidelines

### For Contributors

All project documentation must be organized in the `docs/` folder, except for:
- `README.md` - Main project overview
- `CONTRIBUTING.md` - Contribution guidelines
- `LICENSE` or `LICENSE.md` - Project license

### Organization Rules

Place new documentation in the appropriate subdirectory:

- `docs/features/` - Feature implementation guides and specifications
- `docs/architecture/` - System design, architecture decisions, and technical specs
- `docs/accessibility/` - Accessibility audits, compliance reports, and improvements
- `docs/planning/` - Product roadmaps, TODO lists, and strategic planning
- `docs/guides/` - User guides, tutorials, and how-to documentation

### When Adding Documentation

1. Create your document in the appropriate folder
2. Use clear, descriptive filenames (e.g., `FEATURE-NAME.md`)
3. Follow existing documentation format and style
4. Update this index (`docs/README.md`) with:
   - Link to your new document
   - Brief description of the content
   - Proper categorization
5. Ensure your documentation includes:
   - Overview/introduction section
   - Table of contents (for longer docs)
   - Code examples where appropriate
   - Links to related documentation

## 🔄 Keeping Documentation Updated

Documentation should be updated when:

- New features are added
- Existing features are modified
- Architecture changes are made
- Dependencies are updated
- Tests are added or modified
- Accessibility improvements are made

## 📊 Documentation Status

### Current Statistics

- **Total Documentation Files**: 12
- **Feature Guides**: 5
- **Accessibility Reports**: 2
- **Planning Documents**: 4
- **User Guides**: 1
- **Architecture Docs**: 0

### Coverage Areas

| Area | Documentation Status |
|------|---------------------|
| Core Features | ✅ Well Documented |
| Accessibility | ✅ Well Documented |
| Planning | ✅ Well Documented |
| User Guides | 🟡 Basic Coverage |
| Architecture | 🔴 Needs Documentation |
| API Reference | 🔴 Needs Documentation |
| Testing Guide | 🔴 Needs Documentation |

## 🎯 Documentation Priorities

### Immediate Needs

1. **Architecture Documentation**
   - System architecture overview
   - Component relationships
   - Data flow diagrams
   - Storage layer architecture

2. **Testing Documentation**
   - Testing strategy and philosophy
   - Writing tests guide
   - Test organization standards
   - Mocking strategies

3. **API Documentation**
   - Service layer API reference
   - Storage API reference
   - Component API documentation
   - Hook usage documentation

### Future Enhancements

1. **User Guides**
   - Complete user manual
   - Feature tutorials
   - Best practices guide
   - Troubleshooting guide

2. **Developer Guides**
   - Local development setup
   - Debugging guide
   - Performance optimization
   - Build and deployment

3. **Integration Guides**
   - Google Fit integration setup
   - Apple Health export guide
   - Voice navigation setup
   - GPS services configuration

## 🔍 Finding Information

### By Topic

- **Getting Started**: See main [README](../README.md)
- **Contributing**: See [CONTRIBUTING.md](../CONTRIBUTING.md)
- **Features**: Browse `features/` folder
- **Accessibility**: Check `accessibility/` folder
- **Planning**: Review `planning/` folder
- **How-To Guides**: Explore `guides/` folder

### By File Type

- `.md` files - Markdown documentation
- Code examples are embedded in documentation
- Screenshots and diagrams (if any) are referenced inline

## 📞 Questions or Issues?

If you can't find what you're looking for:

1. Check the [main README](../README.md) for overview information
2. Review the [CONTRIBUTING.md](../CONTRIBUTING.md) for contribution guidelines
3. Search existing documentation using your editor's search
4. [Open an issue](https://github.com/utdcometsoccer/intl-bench-press-day/issues) if documentation is missing or unclear

---

**Last Updated**: January 2026  
**Maintained By**: Project Contributors
