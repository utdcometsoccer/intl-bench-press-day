import { useEffect, useRef, useCallback } from 'react';

const FOCUSABLE_ELEMENTS_SELECTOR = 
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Hook to trap focus within a container element.
 * Useful for modal dialogs to prevent keyboard navigation outside the modal.
 * 
 * @param isActive - Whether focus trapping is active
 * @returns A ref to attach to the container element
 */
export const useFocusTrap = <T extends HTMLElement>(isActive: boolean) => {
  const containerRef = useRef<T>(null);
  const previousActiveElement = useRef<Element | null>(null);

  const getFocusableElements = useCallback((): HTMLElement[] => {
    if (!containerRef.current) return [];
    
    const elements = containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_ELEMENTS_SELECTOR);
    return Array.from(elements).filter(el => {
      // Filter out elements that are not visible
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden';
    });
  }, []);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key !== 'Tab') return;

    const focusableElements = getFocusableElements();
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // If shift + tab and on first element, wrap to last
    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
      return;
    }

    // If tab (without shift) and on last element, wrap to first
    if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
      return;
    }
  }, [getFocusableElements]);

  useEffect(() => {
    if (!isActive) return;

    // Store the currently focused element to restore focus later
    previousActiveElement.current = document.activeElement;

    // Focus the first focusable element in the container
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      // Small delay to ensure the modal is fully rendered
      requestAnimationFrame(() => {
        focusableElements[0].focus();
      });
    }

    // Add keyboard event listener
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      
      // Restore focus to the previously focused element
      if (previousActiveElement.current && previousActiveElement.current instanceof HTMLElement) {
        previousActiveElement.current.focus();
      }
    };
  }, [isActive, handleKeyDown, getFocusableElements]);

  return containerRef;
};
