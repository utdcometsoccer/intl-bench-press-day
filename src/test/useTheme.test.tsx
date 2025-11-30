import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useTheme } from '../hooks/useTheme';

describe('useTheme', () => {
  const THEME_STORAGE_KEY = 'ibpd_theme';

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Reset document attribute
    document.documentElement.removeAttribute('data-theme');
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('should default to light theme when no saved preference', () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('should load saved theme from localStorage', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('should load high-contrast theme from localStorage', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'high-contrast');
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('high-contrast');
    expect(document.documentElement.getAttribute('data-theme')).toBe('high-contrast');
  });

  it('should toggle from light to dark theme', () => {
    const { result } = renderHook(() => useTheme());
    
    expect(result.current.theme).toBe('light');
    
    act(() => {
      result.current.toggleTheme();
    });
    
    expect(result.current.theme).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
  });

  it('should toggle from dark to high-contrast theme', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    const { result } = renderHook(() => useTheme());
    
    expect(result.current.theme).toBe('dark');
    
    act(() => {
      result.current.toggleTheme();
    });
    
    expect(result.current.theme).toBe('high-contrast');
    expect(document.documentElement.getAttribute('data-theme')).toBe('high-contrast');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('high-contrast');
  });

  it('should toggle from high-contrast to light theme', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'high-contrast');
    const { result } = renderHook(() => useTheme());
    
    expect(result.current.theme).toBe('high-contrast');
    
    act(() => {
      result.current.toggleTheme();
    });
    
    expect(result.current.theme).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
  });

  it('should persist theme preference to localStorage', () => {
    const { result } = renderHook(() => useTheme());
    
    act(() => {
      result.current.toggleTheme();
    });
    
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    
    // Create a new hook instance to verify persistence
    const { result: result2 } = renderHook(() => useTheme());
    expect(result2.current.theme).toBe('dark');
  });

  it('should cycle through all three themes via toggle', () => {
    const { result } = renderHook(() => useTheme());
    
    // Start at light
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    
    // Toggle to dark
    act(() => {
      result.current.toggleTheme();
    });
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    
    // Toggle to high-contrast
    act(() => {
      result.current.toggleTheme();
    });
    expect(document.documentElement.getAttribute('data-theme')).toBe('high-contrast');
    
    // Toggle back to light
    act(() => {
      result.current.toggleTheme();
    });
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('should allow direct theme setting via setTheme', () => {
    const { result } = renderHook(() => useTheme());
    
    expect(result.current.theme).toBe('light');
    
    act(() => {
      result.current.setTheme('high-contrast');
    });
    
    expect(result.current.theme).toBe('high-contrast');
    expect(document.documentElement.getAttribute('data-theme')).toBe('high-contrast');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('high-contrast');
  });
});
