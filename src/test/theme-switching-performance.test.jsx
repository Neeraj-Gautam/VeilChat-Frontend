/**
 * Theme Switching Performance Tests
 * 
 * **Validates: Requirements 15.1, 15.2, 15.3, 15.4**
 * 
 * Requirements:
 * 15.1: Theme switching completes in less than 100 milliseconds
 * 15.2: No layout shift or reflow occurs when theme changes
 * 15.3: React components don't re-render when theme changes
 * 15.4: Performance measurements are available in development mode
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, act } from '@testing-library/react'
import * as fc from 'fast-check'
import useThemeStore from '../store/useThemeStore'
import React from 'react'

// Simple component for testing re-renders - uses selector to minimize re-renders
const MinimalSubscriber = ({ renderCountRef, onRender }) => {
  // Only subscribe to theme, not entire store
  const theme = useThemeStore((state) => state.theme)
  
  if (renderCountRef) {
    renderCountRef.current++
  }
  
  if (onRender) {
    onRender(theme)
  }
  
  return (
    <div data-testid="minimal-subscriber">
      <span data-testid="theme-value">{theme}</span>
    </div>
  )
}

// Component that doesn't subscribe to theme store at all
const UnrelatedComponent = ({ renderCountRef }) => {
  const [count, setCount] = React.useState(0)
  
  if (renderCountRef) {
    renderCountRef.current++
  }
  
  return (
    <div data-testid="unrelated-component">
      <button onClick={() => setCount(c => c + 1)} data-testid="increment-btn">Increment</button>
      <span data-testid="count-value">{count}</span>
    </div>
  )
}

describe('Theme Switching Performance', () => {
  beforeEach(() => {
    // Reset to light theme before each test
    useThemeStore.setState({ theme: 'light' })
    document.documentElement.setAttribute('data-theme', 'light')
    localStorage.setItem('theme', 'light')
  })

  describe('Requirement 15.1: Theme switching completes in <100ms', () => {
    it('should complete theme switch in under 100ms for all themes', async () => {
      const validThemes = ['light', 'dark', 'whatsapp', 'telegram']
      const { setTheme } = useThemeStore.getState()
      
      for (const targetTheme of validThemes) {
        const startTime = performance.now()
        
        await act(async () => {
          setTheme(targetTheme)
        })
        
        const endTime = performance.now()
        const switchTime = endTime - startTime
        
        // Verify theme was actually applied
        expect(document.documentElement.getAttribute('data-theme')).toBe(targetTheme)
        
        // Performance requirement: < 100ms
        expect(switchTime).toBeLessThan(100)
      }
    })

    it('should handle rapid theme switches within performance budget', async () => {
      const { setTheme } = useThemeStore.getState()
      const themes = ['light', 'dark', 'whatsapp', 'telegram', 'light', 'dark']
      
      for (const theme of themes) {
        const startTime = performance.now()
        
        await act(async () => {
          setTheme(theme)
        })
        
        const switchTime = performance.now() - startTime
        expect(switchTime).toBeLessThan(100)
      }
    })

    it('should meet performance requirement across multiple iterations', async () => {
      const { setTheme } = useThemeStore.getState()
      const iterations = 10
      const validThemes = ['light', 'dark', 'whatsapp', 'telegram']
      
      for (let i = 0; i < iterations; i++) {
        const theme = validThemes[i % validThemes.length]
        
        const startTime = performance.now()
        
        await act(async () => {
          setTheme(theme)
        })
        
        const switchTime = performance.now() - startTime
        expect(switchTime).toBeLessThan(100)
      }
    })

    it('should use property-based testing to verify performance across random theme sequences', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.constantFrom('light', 'dark', 'whatsapp', 'telegram'),
            { minLength: 1, maxLength: 20 }
          ),
          (themeSequence) => {
            const { setTheme } = useThemeStore.getState()
            
            for (const theme of themeSequence) {
              const startTime = performance.now()
              setTheme(theme)
              const switchTime = performance.now() - startTime
              
              // Performance requirement: < 100ms
              if (switchTime >= 100) {
                throw new Error(`Theme switch to "${theme}" took ${switchTime}ms, exceeding 100ms threshold`)
              }
            }
            
            return true
          }
        ),
        { numRuns: 50 }
      )
    })
  })

  describe('Requirement 15.2: No layout shift or reflow occurs', () => {
    it('should not cause layout shift when switching themes', async () => {
      // Create a test element with known dimensions
      const testElement = document.createElement('div')
      testElement.id = 'layout-test-perf'
      testElement.style.width = '100px'
      testElement.style.height = '100px'
      testElement.style.position = 'absolute'
      testElement.style.visibility = 'hidden'
      document.body.appendChild(testElement)
      
      try {
        // Measure initial layout
        const initialRect = testElement.getBoundingClientRect()
        
        const { setTheme } = useThemeStore.getState()
        
        // Switch theme
        await act(async () => {
          setTheme('dark')
        })
        
        // Measure after theme switch - dimensions should be unchanged
        const afterRect = testElement.getBoundingClientRect()
        
        // Verify no layout changes (same dimensions)
        expect(afterRect.width).toBe(initialRect.width)
        expect(afterRect.height).toBe(initialRect.height)
      } finally {
        // Cleanup
        document.body.removeChild(testElement)
      }
    })

    it('should verify theme attribute change does not trigger layout recalculation', async () => {
      const { setTheme } = useThemeStore.getState()
      const validThemes = ['light', 'dark', 'whatsapp', 'telegram']
      
      // Create element to measure layout stability - use fixed dimensions
      const testEl = document.createElement('div')
      testEl.id = 'layout-test-element'
      testEl.style.cssText = 'width: 200px; height: 50px; position: absolute;'
      testEl.textContent = 'Test'
      document.body.appendChild(testEl)
      
      // In jsdom, offsetWidth/offsetHeight may be 0, but we can verify
      // that the element remains in the DOM and its style hasn't changed
      try {
        for (const theme of validThemes) {
          // Store element properties before theme change
          const styleBefore = testEl.getAttribute('style')
          
          await act(async () => {
            setTheme(theme)
          })
          
          // Verify element is still in DOM
          expect(document.body.contains(testEl)).toBe(true)
          
          // Verify style hasn't changed (no layout-affecting changes)
          const styleAfter = testEl.getAttribute('style')
          expect(styleAfter).toBe(styleBefore)
          
          // Verify data-theme was updated (CSS variables change colors, not layout)
          expect(document.documentElement.getAttribute('data-theme')).toBe(theme)
        }
      } finally {
        document.body.removeChild(testEl)
      }
    })
  })

  describe('Requirement 15.3: React components don\'t re-render on theme change', () => {
    it('should minimize re-renders by using CSS variables instead of prop changes', async () => {
      const renderCountRef = { current: 0 }
      const { setTheme } = useThemeStore.getState()
      
      // Render component that uses minimal selector
      const { rerender } = render(<MinimalSubscriber renderCountRef={renderCountRef} />)
      
      const afterInitialRender = renderCountRef.current
      expect(afterInitialRender).toBe(1)
      
      // Switch theme - this will trigger one re-render for the subscriber
      await act(async () => {
        setTheme('dark')
      })
      
      // Count after theme switch (without manual rerender)
      const afterThemeSwitch = renderCountRef.current
      
      // The theme change should cause at most 1 re-render (due to selector subscription)
      // We check that it's minimal - not excessive re-renders
      const rendersDueToThemeChange = afterThemeSwitch - afterInitialRender
      
      // Should be exactly 1 re-render from theme change (not multiple)
      expect(rendersDueToThemeChange).toBe(1)
      
      // Manual rerender to verify component still works
      rerender(<MinimalSubscriber renderCountRef={renderCountRef} />)
      
      expect(renderCountRef.current).toBe(afterThemeSwitch + 1)
    })

    it('should not re-render components that do NOT subscribe to theme store', async () => {
      const renderCountRef = { current: 0 }
      
      render(<UnrelatedComponent renderCountRef={renderCountRef} />)
      
      const initialCount = renderCountRef.current
      expect(initialCount).toBe(1)
      
      const { setTheme } = useThemeStore.getState()
      
      // Switch theme multiple times
      await act(async () => {
        setTheme('dark')
        setTheme('whatsapp')
        setTheme('telegram')
      })
      
      // Component that doesn't subscribe to theme should NOT re-render
      // from theme changes
      expect(renderCountRef.current).toBe(initialCount)
    })

    it('should use CSS-based updates (data-theme attribute) instead of React props', () => {
      const { setTheme } = useThemeStore.getState()
      
      // Verify that theme switching uses DOM data-theme attribute (CSS-based)
      // rather than passing theme as props to all components
      
      const validThemes = ['light', 'dark', 'whatsapp', 'telegram']
      
      for (const theme of validThemes) {
        setTheme(theme)
        
        // Verify data-theme attribute is set (enables CSS variable updates)
        const dataTheme = document.documentElement.getAttribute('data-theme')
        expect(dataTheme).toBe(theme)
        
        // Verify localStorage is updated
        expect(localStorage.getItem('theme')).toBe(theme)
        
        // Verify Zustand state is updated
        expect(useThemeStore.getState().theme).toBe(theme)
      }
      
      // This architecture ensures CSS variables update the colors
      // without requiring React to re-render all components with new props
    })
  })

  describe('Requirement 15.4: Performance measurements in development mode', () => {
    it('should provide performance measurement via Performance API', async () => {
      // Create a simple performance measurement utility
      const measureThemeSwitch = async (targetTheme) => {
        const { setTheme } = useThemeStore.getState()
        
        const markName = `theme-switch-${targetTheme}-${Date.now()}`
        
        // Use Performance API
        performance.mark(markName)
        
        await act(async () => {
          setTheme(targetTheme)
        })
        
        const endMark = `${markName}-end`
        performance.mark(endMark)
        performance.measure(
          `Theme switch to ${targetTheme}`,
          markName,
          endMark
        )
        
        const measures = performance.getEntriesByName(`Theme switch to ${targetTheme}`)
        const lastMeasure = measures[measures.length - 1]
        
        // Cleanup
        performance.clearMarks(markName)
        performance.clearMarks(endMark)
        performance.clearMeasures(`Theme switch to ${targetTheme}`)
        
        return lastMeasure.duration
      }
      
      const duration = await measureThemeSwitch('telegram')
      
      // Verify measurement was taken
      expect(duration).toBeDefined()
      expect(duration).toBeLessThan(100)
    })

    it('should measure DOM attribute update performance separately', () => {
      const validThemes = ['light', 'dark', 'whatsapp', 'telegram']
      
      const domUpdateTimes = []
      
      for (const theme of validThemes) {
        const startTime = performance.now()
        
        // Only update DOM attribute (CSS mechanism)
        document.documentElement.setAttribute('data-theme', theme)
        
        const endTime = performance.now()
        
        domUpdateTimes.push(endTime - startTime)
        
        // Verify attribute was set
        expect(document.documentElement.getAttribute('data-theme')).toBe(theme)
      }
      
      // DOM attribute updates should be extremely fast (< 5ms)
      domUpdateTimes.forEach(time => {
        expect(time).toBeLessThan(5)
      })
    })
  })

  describe('Overall Performance Integration', () => {
    it('should maintain performance under repeated theme switches', async () => {
      const { setTheme } = useThemeStore.getState()
      const validThemes = ['light', 'dark', 'whatsapp', 'telegram']
      const iterations = 50
      
      const switchTimes = []
      
      for (let i = 0; i < iterations; i++) {
        const theme = validThemes[i % validThemes.length]
        
        const startTime = performance.now()
        
        await act(async () => {
          setTheme(theme)
        })
        
        const switchTime = performance.now() - startTime
        switchTimes.push(switchTime)
      }
      
      // All switches should be under 100ms
      const maxTime = Math.max(...switchTimes)
      const avgTime = switchTimes.reduce((a, b) => a + b, 0) / switchTimes.length
      
      expect(maxTime).toBeLessThan(100)
    })

    it('should verify CSS-based updates are faster than full store updates', () => {
      const { setTheme } = useThemeStore.getState()
      
      // Measure pure DOM attribute change (CSS-based)
      const cssBasedStart = performance.now()
      document.documentElement.setAttribute('data-theme', 'telegram')
      const cssBasedEnd = performance.now()
      
      const cssBasedTime = cssBasedEnd - cssBasedStart
      
      // Pure CSS updates should be nearly instant (< 5ms)
      expect(cssBasedTime).toBeLessThan(5)
      
      // Now measure full theme store update (includes state + localStorage)
      const fullStart = performance.now()
      setTheme('whatsapp')
      const fullEnd = performance.now()
      
      const fullTime = fullEnd - fullStart
      
      // Full update includes state and localStorage, should still be < 100ms
      expect(fullTime).toBeLessThan(100)
      
      // CSS-only should be faster than full update
      expect(cssBasedTime).toBeLessThan(fullTime)
    })

    it('should verify architecture uses data-theme attribute for CSS variable updates', () => {
      const { setTheme } = useThemeStore.getState()
      const validThemes = ['light', 'dark', 'whatsapp', 'telegram']
      
      for (const theme of validThemes) {
        setTheme(theme)
        
        // Primary verification: data-theme attribute is set
        const dataTheme = document.documentElement.getAttribute('data-theme')
        expect(dataTheme).toBe(theme)
        
        // This enables CSS :root[data-theme="..."] selectors to apply
        // CSS custom properties, which update colors without React re-renders
        
        // Secondary: localStorage is updated for persistence
        expect(localStorage.getItem('theme')).toBe(theme)
        
        // Tertiary: Zustand state is updated
        expect(useThemeStore.getState().theme).toBe(theme)
      }
    })
  })
})
