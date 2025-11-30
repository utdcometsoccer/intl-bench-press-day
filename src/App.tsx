import { useState, useCallback } from 'react'
import logo from './assets/IBPD-FINAL.png'
import './App.css'
import ExerciseOneRepMaxTracker from './components/ExerciseOneRepMaxTracker'
import ProgressChart from './components/ProgressChart'
import FiveThreeOnePlanner from './components/FiveThreeOnePlanner/index'
import WorkoutLogger from './components/WorkoutLogger'
import DataExport from './components/DataExport'
import PlateCalculator from './components/PlateCalculator'
import PWAInstallPrompt from './PWAInstallPrompt'
import VoiceNavigationButton from './components/VoiceNavigationButton'
import { useTheme } from './hooks/useTheme'

type TabType = 'tracker' | 'progress' | 'planner' | 'logger' | 'plates' | 'export';

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('tracker')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()

  const handleTabClick = (tab: TabType) => {
    setActiveTab(tab)
    setIsMobileMenuOpen(false) // Close mobile menu when tab is selected
  }

  // Voice navigation handler
  const handleVoiceNavigate = useCallback((tab: string) => {
    const validTabs: TabType[] = ['tracker', 'progress', 'planner', 'logger', 'plates', 'export'];
    if (validTabs.includes(tab as TabType)) {
      setActiveTab(tab as TabType);
      setIsMobileMenuOpen(false);
    }
  }, []);

  return (
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
        {activeTab === 'tracker' && <ExerciseOneRepMaxTracker />}
        {activeTab === 'progress' && <ProgressChart />}
        {activeTab === 'planner' && <FiveThreeOnePlanner />}
        {activeTab === 'logger' && <WorkoutLogger />}
        {activeTab === 'plates' && <PlateCalculator />}
        {activeTab === 'export' && <DataExport />}
      </main>

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />

      {/* Voice Navigation Button */}
      <VoiceNavigationButton onNavigate={handleVoiceNavigate} />
    </>
  )
}

export default App
