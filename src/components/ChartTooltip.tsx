import React from 'react';

interface ChartTooltipData {
  exercise: string;
  date: string;
  oneRepMax: number;
  reps: number;
  weight: number;
  formulaUsed: string;
  notes?: string;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: ChartTooltipData;
  }>;
}

const ChartTooltip: React.FC<ChartTooltipProps> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="chart-tooltip">
        <p className="tooltip-exercise">{data.exercise}</p>
        <p className="tooltip-info">Date: {data.date}</p>
        <p className="tooltip-info">1RM: {data.oneRepMax} lbs</p>
        <p className="tooltip-info">Set: {data.reps} reps @ {data.weight} lbs</p>
        <p className="tooltip-info">Formula: {data.formulaUsed}</p>
        {data.notes && <p className="tooltip-notes">"{data.notes}"</p>}
      </div>
    );
  }
  return null;
};

export default ChartTooltip;
