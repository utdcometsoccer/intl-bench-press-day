import { type FC } from 'react';
import { useFiveThreeOnePlanner } from '../../hooks/useFiveThreeOnePlanner';
import ErrorMessage from '../ErrorMessage';
import SuccessMessage from '../SuccessMessage';
import TabNavigation from '../TabNavigation';
import CreateCycleForm from '../CreateCycleForm';
import LoadingState from '../LoadingState';
import ManageCyclesTab from '../ManageCyclesTab';
import ViewWorkoutsTab from '../ViewWorkoutsTab';

const FiveThreeOnePlanner: FC = () => {
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
