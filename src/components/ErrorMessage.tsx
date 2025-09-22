import { type FC } from 'react';

interface ErrorMessageProps {
  /** The error message to display. If empty or null, nothing will be rendered. */
  message: string;
  /** Optional CSS class name to apply to the error container */
  className?: string;
  /** Whether to show the "Error:" prefix. Defaults to true. */
  showPrefix?: boolean;
  /** Whether this error should be announced immediately (aria-live="assertive"). Defaults to true. */
  assertive?: boolean;
  /** Unique ID for the error message element, useful for aria-describedby */
  id?: string;
}

/**
 * ErrorMessage component for displaying error messages with consistent styling and accessibility.
 * Uses ARIA live regions to announce errors to screen readers when they appear.
 * 
 * @param message - The error message to display
 * @param className - Optional additional CSS class
 * @param showPrefix - Whether to show "Error:" prefix (default: true)
 * @param assertive - Whether to use assertive live region (default: true)
 * @param id - Optional ID for aria-describedby associations
 */
const ErrorMessage: FC<ErrorMessageProps> = ({ 
  message, 
  className = '', 
  showPrefix = true,
  assertive = true,
  id
}) => {
  // Don't render anything if there's no message
  if (!message?.trim()) {
    return null;
  }

  return (
    <div 
      className={`error-message ${className}`.trim()}
      role="alert"
      aria-live={assertive ? "assertive" : "polite"}
      aria-atomic={true}
      id={id}
    >
      {showPrefix && <strong>Error:</strong>} {message}
    </div>
  );
};

export default ErrorMessage;