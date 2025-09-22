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
      />

      {/* Create Cycle Tab */}
      {state.activeTab === 'create' && (
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
      )}

      {/* Manage Cycles Tab */}
      {state.activeTab === 'manage' && (
        <ManageCyclesTab
          cycles={state.cycles}
          onViewCycle={setSelectedCycle}
          onSetActiveCycle={setActiveCycleHandler}
          onDeleteCycle={deleteCycle}
        />
      )}

      {/* View Workouts Tab */}
      {state.activeTab === 'view' && (
        <ViewWorkoutsTab
          activeCycle={state.activeCycle}
          selectedCycle={state.selectedCycle}
          onBackToActiveCycle={() => setSelectedCycle(null)}
        />
      )}

      {/* Success Message */}
      <SuccessMessage message={state.success} />

      {/* Error Display */}
      <ErrorMessage message={state.error} />
    </div>
  );
};

export default FiveThreeOnePlanner;
