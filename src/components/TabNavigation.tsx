import { type FC } from 'react';

type TabKey = 'create' | 'manage' | 'view';

interface Tab {
  key: TabKey;
  label: string;
}

interface TabNavigationProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  tabs?: Tab[];
}

const TabNavigation: FC<TabNavigationProps> = ({ 
  activeTab, 
  onTabChange, 
  tabs = [
    { key: 'create', label: 'Create Cycle' },
    { key: 'manage', label: 'Manage Cycles' },
    { key: 'view', label: 'View Workouts' }
  ]
}) => {
  return (
    <div className="planner-tab-navigation">
      {tabs.map(tab => (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          className={`planner-tab-button ${activeTab === tab.key ? 'active' : ''}`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default TabNavigation;