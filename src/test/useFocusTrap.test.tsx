import { renderHook, act, render } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useFocusTrap } from '../hooks/useFocusTrap';

describe('useFocusTrap', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    // Create a container div with focusable elements
    container = document.createElement('div');
    container.innerHTML = `
      <button id="btn1">Button 1</button>
      <input id="input1" type="text" />
      <select id="select1"><option>Option</option></select>
      <button id="btn2">Button 2</button>
    `;
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    vi.restoreAllMocks();
  });

  it('should return a ref object', () => {
    const { result } = renderHook(() => useFocusTrap<HTMLDivElement>(false));
    expect(result.current).toBeDefined();
    expect(result.current.current).toBeNull();
  });

  it('should not trap focus when inactive', () => {
    const { result } = renderHook(() => useFocusTrap<HTMLDivElement>(false));
    
    // Assign the ref to the container
    Object.defineProperty(result.current, 'current', {
      value: container,
      writable: true
    });

    // Focus should not be trapped
    const btn1 = container.querySelector('#btn1') as HTMLButtonElement;
    btn1.focus();
    expect(document.activeElement).toBe(btn1);
  });

  it('should add keydown event listener when active', () => {
    const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
    
    const { result, rerender } = renderHook(
      ({ isActive }) => useFocusTrap<HTMLDivElement>(isActive),
      { initialProps: { isActive: false } }
    );

    // Assign the ref to the container
    Object.defineProperty(result.current, 'current', {
      value: container,
      writable: true
    });

    // Activate focus trap
    rerender({ isActive: true });
    
    expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
  });

  it('should remove keydown event listener when deactivated', () => {
    const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
    
    const { result, unmount } = renderHook(
      ({ isActive }) => useFocusTrap<HTMLDivElement>(isActive),
      { initialProps: { isActive: true } }
    );

    // Assign the ref to the container
    Object.defineProperty(result.current, 'current', {
      value: container,
      writable: true
    });

    // Deactivate or unmount
    unmount();
    
    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
  });

  it('should focus first focusable element when activated', async () => {
    // Create a wrapper component that properly uses the hook
    const TestComponent = ({ isActive }: { isActive: boolean }) => {
      const ref = useFocusTrap<HTMLDivElement>(isActive);
      return (
        <div ref={ref} data-testid="trap-container">
          <button id="test-btn1">Button 1</button>
          <input id="test-input1" type="text" />
          <button id="test-btn2">Button 2</button>
        </div>
      );
    };
    
    const { rerender, unmount } = render(<TestComponent isActive={false} />);

    // Activate focus trap
    rerender(<TestComponent isActive={true} />);
    
    // Wait for requestAnimationFrame and allow focus to be set
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    // First focusable element should be focused
    const btn1 = document.querySelector('#test-btn1') as HTMLButtonElement;
    expect(document.activeElement).toBe(btn1);
    
    unmount();
  });

  it('should wrap focus from last to first element on Tab', () => {
    const { result } = renderHook(
      ({ isActive }) => useFocusTrap<HTMLDivElement>(isActive),
      { initialProps: { isActive: true } }
    );

    // Assign the ref to the container
    Object.defineProperty(result.current, 'current', {
      value: container,
      writable: true
    });

    // Focus the last button
    const btn2 = container.querySelector('#btn2') as HTMLButtonElement;
    const btn1 = container.querySelector('#btn1') as HTMLButtonElement;
    btn2.focus();

    // Simulate Tab key press
    const tabEvent = new KeyboardEvent('keydown', {
      key: 'Tab',
      bubbles: true,
      cancelable: true
    });
    
    act(() => {
      document.dispatchEvent(tabEvent);
    });

    // Focus should wrap to first element
    expect(document.activeElement).toBe(btn1);
  });

  it('should wrap focus from first to last element on Shift+Tab', () => {
    const { result } = renderHook(
      ({ isActive }) => useFocusTrap<HTMLDivElement>(isActive),
      { initialProps: { isActive: true } }
    );

    // Assign the ref to the container
    Object.defineProperty(result.current, 'current', {
      value: container,
      writable: true
    });

    // Focus the first button
    const btn1 = container.querySelector('#btn1') as HTMLButtonElement;
    const btn2 = container.querySelector('#btn2') as HTMLButtonElement;
    btn1.focus();

    // Simulate Shift+Tab key press
    const shiftTabEvent = new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey: true,
      bubbles: true,
      cancelable: true
    });
    
    act(() => {
      document.dispatchEvent(shiftTabEvent);
    });

    // Focus should wrap to last element
    expect(document.activeElement).toBe(btn2);
  });

  it('should not handle non-Tab key presses', () => {
    const { result } = renderHook(
      ({ isActive }) => useFocusTrap<HTMLDivElement>(isActive),
      { initialProps: { isActive: true } }
    );

    // Assign the ref to the container
    Object.defineProperty(result.current, 'current', {
      value: container,
      writable: true
    });

    // Focus the first button
    const btn1 = container.querySelector('#btn1') as HTMLButtonElement;
    btn1.focus();

    // Simulate Enter key press (should not affect focus)
    const enterEvent = new KeyboardEvent('keydown', {
      key: 'Enter',
      bubbles: true,
      cancelable: true
    });
    
    act(() => {
      document.dispatchEvent(enterEvent);
    });

    // Focus should remain on btn1
    expect(document.activeElement).toBe(btn1);
  });
});
