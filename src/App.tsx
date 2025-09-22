import { useState } from 'react'
import logo from './assets/IBPD-FINAL.png'
import './App.css'
import ExerciseOneRepMaxTracker from './ExerciseOneRepMaxTracker'
import ProgressChart from './ProgressChart'
import FiveThreeOnePlanner from './FiveThreeOnePlanner'
import WorkoutLogger from './WorkoutLogger'
import DataExport from './DataExport'

function App() {
  const [activeTab, setActiveTab] = useState<'tracker' | 'progress' | 'planner' | 'logger' | 'export'>('tracker')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleTabClick = (tab: 'tracker' | 'progress' | 'planner' | 'logger' | 'export') => {
    setActiveTab(tab)
    setIsMobileMenuOpen(false) // Close mobile menu when tab is selected
  }

  return (
    <>
      <div>
        <img src={logo} alt="International Bench Press Day Logo" className="app-logo" />
      </div>
      <h1>International Bench Press Day</h1>
      
      {/* Mobile Hamburger Menu Button */}
      <button 
        className="hamburger-menu"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-label="Toggle navigation menu"
        aria-expanded={isMobileMenuOpen ? 'true' : 'false'}
      >
        <span className="hamburger-line"></span>
        <span className="hamburger-line"></span>
        <span className="hamburger-line"></span>
      </button>

      {/* Tab Navigation */}
      <div className={`tab-navigation ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <button
          onClick={() => handleTabClick('tracker')}
          className={`tab-button ${activeTab === 'tracker' ? 'active' : ''}`}
        >
          Exercise Tracker
        </button>
        <button
          onClick={() => handleTabClick('progress')}
          className={`tab-button ${activeTab === 'progress' ? 'active' : ''}`}
        >
          Progress Chart
        </button>
        <button
          onClick={() => handleTabClick('planner')}
          className={`tab-button ${activeTab === 'planner' ? 'active' : ''}`}
        >
          5-3-1 Planner
        </button>
        <button
          onClick={() => handleTabClick('logger')}
          className={`tab-button ${activeTab === 'logger' ? 'active' : ''}`}
        >
          Workout Logger
        </button>
        <button
          onClick={() => handleTabClick('export')}
          className={`tab-button ${activeTab === 'export' ? 'active' : ''}`}
        >
          Data Export
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="mobile-menu-overlay"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Tab Content */}
      {activeTab === 'tracker' && <ExerciseOneRepMaxTracker />}
      {activeTab === 'progress' && <ProgressChart />}
      {activeTab === 'planner' && <FiveThreeOnePlanner />}
      {activeTab === 'logger' && <WorkoutLogger />}
      {activeTab === 'export' && <DataExport />}
      

    </>
  )
}

export default App
