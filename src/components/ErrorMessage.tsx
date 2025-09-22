import { type FC } from 'react';

interface ErrorMessageProps {
  /** The error message to display. If empty or null, nothing will be rendered. */
  message: string;
  /** Optional CSS class name to apply to the error container */
  className?: string;
  /** Whether to show the "Error:" prefix. Defaults to true. */
  showPrefix?: boolean;
}

/**
 * ErrorMessage component for displaying error messages with consistent styling.
 * 
 * @param message - The error message to display
 * @param className - Optional additional CSS class
 * @param showPrefix - Whether to show "Error:" prefix (default: true)
 */
const ErrorMessage: FC<ErrorMessageProps> = ({ 
  message, 
  className = '', 
  showPrefix = true 
}) => {
  // Don't render anything if there's no message
  if (!message?.trim()) {
    return null;
  }

  return (
    <div className={`error-message ${className}`.trim()}>
      {showPrefix && <strong>Error:</strong>} {message}
    </div>
  );
};

export default ErrorMessage;