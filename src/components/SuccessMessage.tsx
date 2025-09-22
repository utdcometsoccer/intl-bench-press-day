import { type FC } from 'react';

interface SuccessMessageProps {
  /** The success message to display. If empty or null, nothing will be rendered. */
  message: string;
  /** Optional CSS class name to apply to the success container */
  className?: string;
  /** Whether to show the checkmark emoji prefix. Defaults to true. */
  showIcon?: boolean;
}

/**
 * SuccessMessage component for displaying success messages with consistent styling.
 * 
 * @param message - The success message to display
 * @param className - Optional additional CSS class
 * @param showIcon - Whether to show checkmark icon (default: true)
 */
const SuccessMessage: FC<SuccessMessageProps> = ({ 
  message, 
  className = '', 
  showIcon = true 
}) => {
  // Don't render anything if there's no message
  if (!message?.trim()) {
    return null;
  }

  return (
    <div className={`success-message ${className}`.trim()}>
      {showIcon && '✅ '}{message}
    </div>
  );
};

export default SuccessMessage;