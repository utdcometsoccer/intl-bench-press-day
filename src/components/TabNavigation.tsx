import { type FC, type KeyboardEvent } from 'react';

type TabKey = 'create' | 'manage' | 'view' | 'schedule';

interface Tab {
  key: TabKey;
  label: string;
}

interface TabNavigationProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  tabs?: Tab[];
  ariaLabel?: string;
}

const TabNavigation: FC<TabNavigationProps> = ({ 
  activeTab, 
  onTabChange, 
  tabs = [
    { key: 'create', label: 'Create Cycle' },
    { key: 'manage', label: 'Manage Cycles' },
    { key: 'view', label: 'View Workouts' },
    { key: 'schedule', label: 'Schedule' }
  ],
  ariaLabel = "5-3-1 Planner Navigation"
}) => {
  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, tabKey: TabKey) => {
    const currentIndex = tabs.findIndex(tab => tab.key === tabKey);
    let newIndex = currentIndex;

    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        newIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
        break;
      case 'ArrowRight':
        event.preventDefault();
        newIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
        break;
      case 'Home':
        event.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        newIndex = tabs.length - 1;
        break;
      default:
        return;
    }

    if (newIndex !== currentIndex) {
      onTabChange(tabs[newIndex].key);
      // Focus will be handled by the re-render with updated tabIndex
    }
  };

  return (
    <div 
      className="planner-tab-navigation" 
      role="tablist" 
      aria-label={ariaLabel}
    >
      {tabs.map(tab => (
        <button
          key={tab.key}
          role="tab"
          id={`tab-${tab.key}`}
          aria-selected={activeTab === tab.key}
          aria-controls={`panel-${tab.key}`}
          tabIndex={activeTab === tab.key ? 0 : -1}
          onClick={() => onTabChange(tab.key)}
          onKeyDown={(event) => handleKeyDown(event, tab.key)}
          className={`planner-tab-button ${activeTab === tab.key ? 'active' : ''}`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default TabNavigation;