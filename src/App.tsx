import { useState } from 'react'
import logo from './assets/IBPD-FINAL.png'
import './App.css'
import ExerciseOneRepMaxTracker from './components/ExerciseOneRepMaxTracker'
import ProgressChart from './components/ProgressChart'
import FiveThreeOnePlanner from './components/FiveThreeOnePlanner/index'
import WorkoutLogger from './components/WorkoutLogger'
import DataExport from './components/DataExport'

function App() {
  const [activeTab, setActiveTab] = useState<'tracker' | 'progress' | 'planner' | 'logger' | 'export'>('tracker')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleTabClick = (tab: 'tracker' | 'progress' | 'planner' | 'logger' | 'export') => {
    setActiveTab(tab)
    setIsMobileMenuOpen(false) // Close mobile menu when tab is selected
  }

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
        {activeTab === 'export' && <DataExport />}
      </main>
    </>
  )
}

export default App
