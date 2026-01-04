import { useState, useEffect, useCallback, lazy, Suspense } from 'react'
import type { TabType } from './types'
import logo from './assets/IBPD-FINAL.png'
import './App.css'
import PWAInstallPrompt from './PWAInstallPrompt'
import VoiceNavigationButton from './components/VoiceNavigationButton'
import { useTheme } from './hooks/useTheme'
import { userPreferencesStorage } from './services/userPreferencesStorage'
import { AppInsightsErrorBoundary, ReactPlugin } from '@microsoft/applicationinsights-react-js';
import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import { createBrowserHistory } from "history";

// Lazy load components for code splitting
const ExerciseOneRepMaxTracker = lazy(() => import('./components/ExerciseOneRepMaxTracker'))
const ProgressChart = lazy(() => import('./components/ProgressChart'))
const FiveThreeOnePlanner = lazy(() => import('./components/FiveThreeOnePlanner/index'))
const WorkoutLogger = lazy(() => import('./components/WorkoutLogger'))
const DataExport = lazy(() => import('./components/DataExport'))
const PlateCalculator = lazy(() => import('./components/PlateCalculator'))
const ExerciseManager = lazy(() => import('./components/ExerciseManager'))
const FirstTimeUserWizard = lazy(() => import('./components/FirstTimeUserWizard'))
const Dashboard = lazy(() => import('./components/Dashboard'))
const CustomWorkoutBuilder = lazy(() => import('./components/CustomWorkoutBuilder'))
const ProgressPhotos = lazy(() => import('./components/ProgressPhotos'))


// Tab configuration for navigation items
const tabConfig: { id: TabType; label: string; icon: string; shortcut: string }[] = [
  { id: 'tracker', label: 'Tracker', icon: '💪', shortcut: '1' },
  { id: 'progress', label: 'Progress', icon: '📊', shortcut: '2' },
  { id: 'planner', label: 'Planner', icon: '📋', shortcut: '3' },
  { id: 'logger', label: 'Logger', icon: '📝', shortcut: '4' },
  { id: 'custom', label: 'Custom', icon: '✏️', shortcut: '5' },
  { id: 'photos', label: 'Photos', icon: '📸', shortcut: '6' },
  { id: 'exercises', label: 'Exercises', icon: '📚', shortcut: '7' },
  { id: 'plates', label: 'Plates', icon: '🏋️', shortcut: '8' },
  { id: 'export', label: 'Export', icon: '💾', shortcut: '9' },
]

// Loading component for lazy-loaded components
const LoadingFallback = () => (
  <div className="app-loading" role="status" aria-live="polite">
    <p>Loading...</p>
  </div>
)

// Initialize Application Insights outside component to prevent re-instantiation
const browserHistory = createBrowserHistory();
const reactPlugin = new ReactPlugin();
const appInsights = new ApplicationInsights({
  config: {
    connectionString: import.meta.env.VITE_APPINSIGHTS_CONNECTION_STRING || '',
    extensions: [reactPlugin],
    extensionConfig: {
      [reactPlugin.identifier]: { history: browserHistory }
    },
    disableTelemetry: !import.meta.env.VITE_APPINSIGHTS_CONNECTION_STRING
  }
});
// Only load Application Insights when a connection string is provided.
// The disableTelemetry flag above is set to mirror this condition.
if (import.meta.env.VITE_APPINSIGHTS_CONNECTION_STRING) {
  try {
    appInsights.loadAppInsights();
  } catch (error) {
    console.warn('Failed to initialize Application Insights:', error);
  }
}
function App() {
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    // Get default view from user preferences, fallback to 'dashboard'
    return userPreferencesStorage.getDefaultView();
  })
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showFirstTimeWizard, setShowFirstTimeWizard] = useState(false)
  const [isCheckingUserStatus, setIsCheckingUserStatus] = useState(true)
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false)
  const { theme, toggleTheme, colorBlindMode, toggleColorBlindMode } = useTheme()

  // Voice navigation handler - must be defined before any conditional returns
  const handleVoiceNavigate = useCallback((tab: string) => {
    const validTabs: TabType[] = ['dashboard', 'tracker', 'progress', 'planner', 'logger', 'exercises', 'custom', 'plates', 'export'];
    if (validTabs.includes(tab as TabType)) {
      setActiveTab(tab as TabType);
      setIsMobileMenuOpen(false);
    }
  }, []);

  // Check if user is first-time or returning
  useEffect(() => {
    const checkUserStatus = () => {
      const isFirstTime = userPreferencesStorage.isFirstTimeUser();
      setShowFirstTimeWizard(isFirstTime);
      setIsCheckingUserStatus(false);
    };
    checkUserStatus();
  }, []);

  // Keyboard shortcuts handler
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Ignore if user is typing in an input field
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement ||
      event.target instanceof HTMLSelectElement
    ) {
      return
    }

    // Number keys 1-6 for tab navigation
    const tabIndex = parseInt(event.key) - 1
    if (tabIndex >= 0 && tabIndex < tabConfig.length && !event.ctrlKey && !event.metaKey && !event.altKey) {
      setActiveTab(tabConfig[tabIndex].id)
      return
    }

    // ? key shows keyboard shortcuts
    if (event.key === '?' && event.shiftKey) {
      setShowKeyboardShortcuts(prev => !prev)
      return
    }

    // Escape closes modals
    if (event.key === 'Escape') {
      setShowKeyboardShortcuts(false)
      setIsMobileMenuOpen(false)
      return
    }

    // T for theme toggle
    if (event.key.toLowerCase() === 't' && !event.ctrlKey && !event.metaKey && !event.altKey) {
      toggleTheme()
    }
  }, [toggleTheme])

  // Set up keyboard shortcuts
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const handleTabClick = (tab: TabType) => {
    setActiveTab(tab)
    setIsMobileMenuOpen(false) // Close mobile menu when tab is selected
  }

  const handleFirstTimeWizardComplete = () => {
    setShowFirstTimeWizard(false);
    setActiveTab('dashboard');
  };

  // Show loading while checking user status
  if (isCheckingUserStatus) {
    return (
      <div className="app-loading">
        <img src={logo} alt="International Bench Press Day Logo" className="app-logo" />
        <p>Loading...</p>
      </div>
    );
  }

  // Show first-time wizard for new users
  if (showFirstTimeWizard) {
    return (
      <>
        <Suspense fallback={<LoadingFallback />}>
          <FirstTimeUserWizard onComplete={handleFirstTimeWizardComplete} />
        </Suspense>
        <PWAInstallPrompt />
      </>
    );
  }

  return (
    <AppInsightsErrorBoundary onError={() => <><h1>Error occurred</h1></>} appInsights={reactPlugin}>
      <>
        {/* Skip Links for Keyboard Navigation */}
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <a href="#main-navigation" className="skip-link">
          Skip to navigation
        </a>

        {/* Header Section */}
        <header role="banner">
          <div>
            <img src={logo} alt="International Bench Press Day Logo" className="app-logo" />
          </div>
          <h1>International Bench Press Day</h1>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="theme-toggle-button"
            aria-label={`Switch to ${theme === 'light' ? 'dark' : theme === 'dark' ? 'high contrast' : 'light'} mode`}
            title={`Switch to ${theme === 'light' ? 'dark' : theme === 'dark' ? 'high contrast' : 'light'} mode (Current: ${theme})`}
          >
            {theme === 'light' ? '🌙' : theme === 'dark' ? '◐' : '☀️'}
          </button>

          {/* Color-Blind Mode Toggle Button */}
          <button
            onClick={toggleColorBlindMode}
            className="color-blind-toggle-button"
            aria-label={`${colorBlindMode ? 'Disable' : 'Enable'} color-blind friendly mode`}
            title={`${colorBlindMode ? 'Disable' : 'Enable'} color-blind friendly mode`}
            aria-pressed={colorBlindMode}
          >
            <span aria-hidden="true">{colorBlindMode ? '👁️' : '👁️‍🗨️'}</span>
            <span className="sr-only">{colorBlindMode ? 'Color-blind mode on' : 'Color-blind mode off'}</span>
          </button>
        </header>

        {/* Mobile Hamburger Menu Button */}
        <button
          className="hamburger-menu"
          type='button'
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle navigation menu"
          aria-expanded={isMobileMenuOpen}
          aria-controls="main-navigation"
        >
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
        </button>

        {/* Main Navigation */}
        <nav
          role="navigation"
          aria-label="Main navigation"
          id="main-navigation"
          className={`tab-navigation ${isMobileMenuOpen ? 'mobile-open' : ''}`}
        >
          <button
            onClick={() => handleTabClick('dashboard')}
            className={`tab-button ${activeTab === 'dashboard' ? 'active' : ''}`}
            aria-current={activeTab === 'dashboard' ? 'page' : undefined}
          >
            Dashboard
          </button>
          <button
            onClick={() => handleTabClick('tracker')}
            className={`tab-button ${activeTab === 'tracker' ? 'active' : ''}`}
            aria-current={activeTab === 'tracker' ? 'page' : undefined}
          >
            Exercise Tracker
          </button>
          <button
            onClick={() => handleTabClick('progress')}
            className={`tab-button ${activeTab === 'progress' ? 'active' : ''}`}
            aria-current={activeTab === 'progress' ? 'page' : undefined}
          >
            Progress Chart
          </button>
          <button
            onClick={() => handleTabClick('planner')}
            className={`tab-button ${activeTab === 'planner' ? 'active' : ''}`}
            aria-current={activeTab === 'planner' ? 'page' : undefined}
          >
            5-3-1 Planner
          </button>
          <button
            onClick={() => handleTabClick('logger')}
            className={`tab-button ${activeTab === 'logger' ? 'active' : ''}`}
            aria-current={activeTab === 'logger' ? 'page' : undefined}
          >
            Workout Logger
          </button>
          <button
            onClick={() => handleTabClick('exercises')}
            className={`tab-button ${activeTab === 'exercises' ? 'active' : ''}`}
            aria-current={activeTab === 'exercises' ? 'page' : undefined}
          >
            Exercises
          </button>
          <button
            onClick={() => handleTabClick('plates')}
            className={`tab-button ${activeTab === 'plates' ? 'active' : ''}`}
            aria-current={activeTab === 'plates' ? 'page' : undefined}
          >
            Plate Calculator
          </button>
          <button
            onClick={() => handleTabClick('export')}
            className={`tab-button ${activeTab === 'export' ? 'active' : ''}`}
            aria-current={activeTab === 'export' ? 'page' : undefined}
          >
            Data Export
          </button>
        </nav>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div
            className="mobile-menu-overlay"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Main Content Area */}
        <main role="main" id="main-content" className="main-content">
          <Suspense fallback={<LoadingFallback />}>
            {activeTab === 'dashboard' && (
              <Dashboard
                onNavigateToPlanner={() => handleTabClick('planner')}
                onNavigateToLogger={() => handleTabClick('logger')}
                onNavigateToProgress={() => handleTabClick('progress')}
              />
            )}
            {activeTab === 'tracker' && <ExerciseOneRepMaxTracker />}
            {activeTab === 'progress' && <ProgressChart />}
            {activeTab === 'planner' && <FiveThreeOnePlanner />}
            {activeTab === 'logger' && <WorkoutLogger />}
            {activeTab === 'custom' && <CustomWorkoutBuilder />}
            {activeTab === 'photos' && <ProgressPhotos />}
            {activeTab === 'exercises' && <ExerciseManager />}
            {activeTab === 'plates' && <PlateCalculator />}
            {activeTab === 'export' && <DataExport />}
          </Suspense>
        </main>

        {/* Mobile Bottom Navigation */}
        <nav
          className="mobile-bottom-nav"
          role="navigation"
          aria-label="Mobile navigation"
        >
          {tabConfig.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`mobile-bottom-nav-item ${activeTab === tab.id ? 'active' : ''}`}
              aria-current={activeTab === tab.id ? 'page' : undefined}
              aria-label={`Navigate to ${tab.label}`}
            >
              <span className="mobile-bottom-nav-icon" aria-hidden="true">{tab.icon}</span>
              <span className="mobile-bottom-nav-label">{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* Keyboard Shortcuts Modal */}
        {showKeyboardShortcuts && (
          <>
            <div
              className="keyboard-shortcuts-overlay visible"
              onClick={() => setShowKeyboardShortcuts(false)}
              aria-hidden="true"
            />
            <div
              className="keyboard-shortcuts-modal visible"
              role="dialog"
              aria-modal="true"
              aria-labelledby="keyboard-shortcuts-title"
            >
              <h3 id="keyboard-shortcuts-title">Keyboard Shortcuts</h3>
              <ul className="keyboard-shortcuts-list">
                {tabConfig.map((tab) => (
                  <li key={tab.id}>
                    <span>{tab.label}</span>
                    <span className="shortcut-key">{tab.shortcut}</span>
                  </li>
                ))}
                <li>
                  <span>Toggle Theme</span>
                  <span className="shortcut-key">T</span>
                </li>
                <li>
                  <span>Show/Hide Shortcuts</span>
                  <span className="shortcut-key">?</span>
                </li>
                <li>
                  <span>Close Modals</span>
                  <span className="shortcut-key">Esc</span>
                </li>
              </ul>
              <button
                onClick={() => setShowKeyboardShortcuts(false)}
                className="primary-button keyboard-shortcuts-close"
              >
                Close
              </button>
            </div>
          </>
        )}

        {/* PWA Install Prompt */}
        <PWAInstallPrompt />

        {/* Voice Navigation Button */}
        <VoiceNavigationButton onNavigate={handleVoiceNavigate} />
      </>
    </AppInsightsErrorBoundary >
  )
}

export default App
