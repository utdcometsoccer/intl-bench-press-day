import { type FC } from 'react';
import InfoMessage from './InfoMessage';

interface LoadingStateProps {
  title: string;
  message?: string;
}

const LoadingState: FC<LoadingStateProps> = ({ title, message = "Loading..." }) => {
  return (
    <div className="five-three-one-planner">
      <h2>{title}</h2>
      <InfoMessage message={message} announce={true} />
    </div>
  );
};

export default LoadingState;