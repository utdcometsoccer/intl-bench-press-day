import { type FC } from 'react';

interface InfoMessageProps {
  message?: string | null;
  className?: string;
}

const InfoMessage: FC<InfoMessageProps> = ({ message, className = '' }) => {
  if (!message) return null;

  return (
    <p className={`info-message ${className}`.trim()}>
      {message}
    </p>
  );
};

export default InfoMessage;