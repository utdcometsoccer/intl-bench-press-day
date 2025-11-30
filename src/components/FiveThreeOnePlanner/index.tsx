import { type FC, useEffect, useRef } from 'react';
import { useFiveThreeOnePlanner } from '../../hooks/useFiveThreeOnePlanner';
import ErrorMessage from '../ErrorMessage';
import SuccessMessage from '../SuccessMessage';
import TabNavigation from '../TabNavigation';
import CreateCycleForm from '../CreateCycleForm';
import LoadingState from '../LoadingState';
import ManageCyclesTab from '../ManageCyclesTab';
import ViewWorkoutsTab from '../ViewWorkoutsTab';

interface FiveThreeOnePlannerProps {
  onCycleCreated?: () => void;
}

const FiveThreeOnePlanner: FC<FiveThreeOnePlannerProps> = ({ onCycleCreated }) => {
  // Use the custom hook for all state and logic
  const {
    state,
    setCycleName,
    setStartDate,
    setNotes,
    setUsePersonalRecords,
    setSelectedCycle,
    setActiveTab,
    handleCustomMaxChange,
    createCycle,
    setActiveCycleHandler,
    deleteCycle
  } = useFiveThreeOnePlanner();

  // Track if we've called onCycleCreated to prevent duplicate calls
  const hasCalledOnCycleCreated = useRef(false);

  // Call onCycleCreated when a cycle is successfully created
  useEffect(() => {
    if (state.success.includes('created successfully') && onCycleCreated && !hasCalledOnCycleCreated.current) {
      hasCalledOnCycleCreated.current = true;
      onCycleCreated();
    }
    // Reset the flag when success message clears
    if (!state.success) {
      hasCalledOnCycleCreated.current = false;
    }
  }, [state.success, onCycleCreated]);

  if (state.isLoading) {
    return <LoadingState title="5-3-1 Workout Planner" />;
  }

  return (
    <div className="five-three-one-planner">
      <h2>5-3-1 Workout Planner</h2>

      {/* Tab Navigation */}
      <TabNavigation 
        activeTab={state.activeTab}
        onTabChange={setActiveTab}
        ariaLabel="5-3-1 Workout Planner Navigation"
      />

      {/* Create Cycle Tab */}
      {state.activeTab === 'create' && (
        <div 
          role="tabpanel"
          id="panel-create"
          aria-labelledby="tab-create"
          tabIndex={0}
        >
          <CreateCycleForm
            cycleName={state.cycleName}
            startDate={state.startDate}
            notes={state.notes}
            usePersonalRecords={state.usePersonalRecords}
            customMaxes={state.customMaxes}
            personalRecords={state.personalRecords}
            isCreating={state.isCreating}
            onCycleNameChange={setCycleName}
            onStartDateChange={setStartDate}
            onNotesChange={setNotes}
            onUsePersonalRecordsChange={setUsePersonalRecords}
            onCustomMaxChange={handleCustomMaxChange}
            onCreateCycle={createCycle}
          />
        </div>
      )}

      {/* Manage Cycles Tab */}
      {state.activeTab === 'manage' && (
        <div 
          role="tabpanel"
          id="panel-manage"
          aria-labelledby="tab-manage"
          tabIndex={0}
        >
          <ManageCyclesTab
            cycles={state.cycles}
            onViewCycle={setSelectedCycle}
            onSetActiveCycle={setActiveCycleHandler}
            onDeleteCycle={deleteCycle}
          />
        </div>
      )}

      {/* View Workouts Tab */}
      {state.activeTab === 'view' && (
        <div 
          role="tabpanel"
          id="panel-view"
          aria-labelledby="tab-view"
          tabIndex={0}
        >
          <ViewWorkoutsTab
            activeCycle={state.activeCycle}
            selectedCycle={state.selectedCycle}
            onBackToActiveCycle={() => setSelectedCycle(null)}
          />
        </div>
      )}

      {/* Success Message */}
      <SuccessMessage message={state.success} />

      {/* Error Display */}
      <ErrorMessage message={state.error} />
    </div>
  );
};

export default FiveThreeOnePlanner;
