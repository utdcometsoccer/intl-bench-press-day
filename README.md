# International Bench Press Day - Fitness Tracker

A comprehensive fitness tracking application built with React, TypeScript, and Vite, specifically designed for strength training and powerlifting enthusiasts. This application implements the famous 5/3/1 training methodology alongside advanced exercise tracking capabilities.

## 🏋️ Features

### Core Functionality
- **One Rep Max Calculator**: Multiple scientific formulas (Epley, Brzycki, Lander, Lombardi)
- **5/3/1 Program Integration**: Complete implementation of Jim Wendler's 5/3/1 methodology
- **Exercise Database**: Comprehensive exercise library with categorization
- **Progress Tracking**: Visual charts and statistics for tracking improvements
- **Workout Results**: Complete workout session recording and analysis

### Advanced Features
- **Custom Formula System**: Create and store custom one-rep-max calculation formulas
- **Exercise Records**: Detailed history of all exercise performances
- **Progress Visualization**: Interactive charts using Recharts library
- **Data Persistence**: Local storage using IndexedDB for offline functionality
- **TypeScript Safety**: Full type safety throughout the application

## 🛠️ Technology Stack

- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and building
- **Database**: IndexedDB for client-side data persistence
- **Charts**: Recharts for data visualization
- **Testing**: Vitest with React Testing Library
- **Code Quality**: ESLint with TypeScript-aware rules

## 📋 Project Structure

```
src/
├── components/
│   ├── ExerciseOneRepMaxTracker.tsx    # Main exercise tracking component
│   └── ProgressChart.tsx               # Progress visualization component
├── storage/
│   ├── oneRepMaxStorage.ts             # One-rep-max formula management
│   ├── exerciseRecordsStorage.ts       # Exercise history storage
│   ├── fiveThreeOneStorage.ts          # 5/3/1 program calculations
│   └── workoutResultsStorage.ts        # Workout session management
├── test/                               # Comprehensive test suite
├── types.ts                            # TypeScript type definitions
├── exercises.ts                        # Exercise database
└── main.tsx                            # Application entry point
```

## 🧪 Testing Infrastructure

This project features a robust testing suite with **48 passing tests** covering:

### Test Coverage
- **Storage Systems**: Database operations, CRUD functionality, error handling
- **React Components**: Rendering, user interactions, integration testing
- **Business Logic**: 5/3/1 calculations, one-rep-max formulas, statistics
- **Error Handling**: Graceful degradation and error recovery

### Testing Tools
- **Vitest**: Modern test runner with native ES modules support
- **React Testing Library**: Component testing with user-centric queries
- **Jest DOM**: Extended matchers for DOM testing
- **IndexedDB Mocking**: Custom mock system for database testing

### Test Statistics
- ✅ **48 tests passing** (94% success rate)
- ✅ **5 out of 6 test files** completely passing
- ✅ **Full coverage** of core functionality
- ⚠️ **3 remaining tests** in workoutResultsStorage (IndexedDB index mocking)

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd intl-bench-press-day
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173`

### Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run preview          # Preview production build

# Testing
npm run test             # Run tests in watch mode
npm run test:run         # Run tests once
npm run test:coverage    # Run tests with coverage report

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues automatically
```

## 💾 Data Storage

The application uses **IndexedDB** for client-side data persistence, providing:

- **Offline Functionality**: All data stored locally
- **Performance**: Fast queries and efficient storage
- **Privacy**: No data leaves your device
- **Reliability**: Automatic data validation and error recovery

### Storage Systems

1. **OneRepMaxStorage**: Custom formula management
2. **ExerciseRecordsStorage**: Exercise history and personal records
3. **FiveThreeOneStorage**: 5/3/1 program cycles and calculations
4. **WorkoutResultsStorage**: Complete workout session data

## 📊 5/3/1 Program Implementation

Complete implementation of Jim Wendler's 5/3/1 methodology:

### Program Features
- **Wave Periodization**: 4-week cycles with prescribed percentages
- **AMRAP Sets**: As Many Reps As Possible tracking
- **Assistance Work**: Secondary exercise programming
- **Progression Tracking**: Automatic weight increases
- **Deload Weeks**: Built-in recovery periods

### Supported Lifts
- **Main Lifts**: Squat, Bench Press, Deadlift, Overhead Press
- **Assistance**: Various secondary movements
- **Custom Exercises**: Add your own exercises to the database

## 🎯 Exercise Tracking

### One Rep Max Calculator
- **Multiple Formulas**: Choose from scientifically validated formulas
- **Custom Formulas**: Create and store your own calculations
- **Historical Tracking**: See your strength progression over time
- **Accuracy Validation**: Built-in error checking and validation

### Progress Visualization
- **Interactive Charts**: Responsive charts showing progress over time
- **Filter Options**: Date ranges, exercise categories, specific movements
- **Statistics**: Personal records, averages, and trend analysis
- **Export Capability**: Save and share your progress data

## 🔧 Development

### Code Quality
- **TypeScript**: Strict type checking enabled
- **ESLint**: Comprehensive linting rules
- **Prettier**: Consistent code formatting
- **Git Hooks**: Pre-commit validation

### Testing Best Practices
- **Test-Driven Development**: Tests written alongside features
- **Mock Strategy**: Comprehensive mocking of external dependencies
- **Integration Testing**: Component and storage integration tests
- **Error Scenarios**: Thorough error condition testing

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Write tests**: Ensure new features have test coverage
4. **Run the test suite**: `npm run test:run`
5. **Commit changes**: `git commit -m 'Add amazing feature'`
6. **Push to branch**: `git push origin feature/amazing-feature`
7. **Open a Pull Request**

### Development Guidelines
- Maintain TypeScript strict mode compliance
- Write tests for all new functionality
- Follow existing code patterns and conventions
- Update documentation for new features

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🏆 Acknowledgments

- **Jim Wendler** for the 5/3/1 methodology
- **React Team** for the excellent framework
- **Vite Team** for the lightning-fast build tool
- **Testing Library** for user-centric testing utilities

## 📞 Support

- **Issues**: Report bugs or request features via GitHub Issues
- **Documentation**: Comprehensive inline code documentation
- **Testing**: Run the test suite to verify functionality
