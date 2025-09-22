import { type FC } from 'react';

interface InfoMessageProps {
  /** The info message to display. If empty or null, nothing will be rendered. */
  message?: string | null;
  /** Optional CSS class name to apply to the info container */
  className?: string;
  /** Whether this info message should be announced to screen readers. Defaults to false for non-intrusive display. */
  announce?: boolean;
  /** Unique ID for the info message element, useful for aria-describedby */
  id?: string;
}

/**
 * InfoMessage component for displaying informational messages with consistent styling and accessibility.
 * Can optionally use ARIA live regions to announce information to screen readers.
 * 
 * @param message - The info message to display
 * @param className - Optional additional CSS class
 * @param announce - Whether to announce to screen readers (default: false)
 * @param id - Optional ID for aria-describedby associations
 */
const InfoMessage: FC<InfoMessageProps> = ({ 
  message, 
  className = '',
  announce = false,
  id
}) => {
  if (!message) return null;

  const ariaProps = announce ? {
    'role': 'status',
    'aria-live': 'polite' as const,
    'aria-atomic': true
  } : {};

  return (
    <p 
      className={`info-message ${className}`.trim()}
      id={id}
      {...ariaProps}
    >
      {message}
    </p>
  );
};

export default InfoMessage;