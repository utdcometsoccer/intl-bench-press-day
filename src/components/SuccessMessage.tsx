import { type FC } from 'react';

interface SuccessMessageProps {
  /** The success message to display. If empty or null, nothing will be rendered. */
  message: string;
  /** Optional CSS class name to apply to the success container */
  className?: string;
  /** Whether to show the checkmark emoji prefix. Defaults to true. */
  showIcon?: boolean;
  /** Whether this success message should be announced immediately (aria-live="assertive"). Defaults to false for less intrusive announcements. */
  assertive?: boolean;
  /** Unique ID for the success message element, useful for aria-describedby */
  id?: string;
}

/**
 * SuccessMessage component for displaying success messages with consistent styling and accessibility.
 * Uses ARIA live regions to announce successes to screen readers when they appear.
 * 
 * @param message - The success message to display
 * @param className - Optional additional CSS class
 * @param showIcon - Whether to show checkmark icon (default: true)
 * @param assertive - Whether to use assertive live region (default: false, uses polite)
 * @param id - Optional ID for aria-describedby associations
 */
const SuccessMessage: FC<SuccessMessageProps> = ({ 
  message, 
  className = '', 
  showIcon = true,
  assertive = false,
  id
}) => {
  // Don't render anything if there's no message
  if (!message?.trim()) {
    return null;
  }

  return (
    <div 
      className={`success-message ${className}`.trim()}
      role="status"
      aria-live={assertive ? "assertive" : "polite"}
      aria-atomic={true}
      id={id}
    >
      {showIcon && (
        <span aria-hidden="true">✅ </span>
      )}
      {message}
    </div>
  );
};

export default SuccessMessage;