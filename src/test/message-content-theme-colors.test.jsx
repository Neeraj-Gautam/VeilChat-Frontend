import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import MessageContent from '../components/MessageContent'

describe('MessageContent Theme Colors', () => {
  beforeEach(() => {
    // Reset DOM
    document.documentElement.removeAttribute('data-theme')
  })

  describe('Regular messages with links', () => {
    it('should apply theme-text-on-own class for own messages', () => {
      const { container } = render(
        <MessageContent 
          content="Check out https://example.com" 
          isOwn={true} 
          isDeleted={false} 
        />
      )
      
      const messageDiv = container.querySelector('div')
      expect(messageDiv).toHaveClass('text-theme-text-on-own')
      
      const link = screen.getByRole('link')
      expect(link).toHaveClass('text-theme-text-on-own')
    })

    it('should apply theme-text-on-other class for other messages', () => {
      const { container } = render(
        <MessageContent 
          content="Check out https://example.com" 
          isOwn={false} 
          isDeleted={false} 
        />
      )
      
      const messageDiv = container.querySelector('div')
      expect(messageDiv).toHaveClass('text-theme-text-on-other')
      
      const link = screen.getByRole('link')
      expect(link).toHaveClass('text-theme-text-on-other')
    })
  })

  describe('Deleted messages', () => {
    it('should apply theme-text-on-own class for deleted own messages', () => {
      const { container } = render(
        <MessageContent 
          content="This will be deleted" 
          isOwn={true} 
          isDeleted={true} 
        />
      )
      
      const deletedMessage = container.querySelector('p')
      expect(deletedMessage).toHaveClass('text-theme-text-on-own')
      expect(deletedMessage).toHaveTextContent('🚫 This message was deleted')
    })

    it('should apply theme-text-on-other class for deleted other messages', () => {
      const { container } = render(
        <MessageContent 
          content="This will be deleted" 
          isOwn={false} 
          isDeleted={true} 
        />
      )
      
      const deletedMessage = container.querySelector('p')
      expect(deletedMessage).toHaveClass('text-theme-text-on-other')
      expect(deletedMessage).toHaveTextContent('🚫 This message was deleted')
    })
  })

  describe('Emoji-only messages', () => {
    it('should render emoji-only messages without theme text classes', () => {
      const { container } = render(
        <MessageContent 
          content="😀😃😄" 
          isOwn={true} 
          isDeleted={false} 
        />
      )
      
      const emojiDiv = container.querySelector('div')
      // Emoji-only messages should not have theme text classes
      // They inherit color from parent message bubble
      expect(emojiDiv).not.toHaveClass('text-theme-text-on-own')
      expect(emojiDiv).not.toHaveClass('text-theme-text-on-other')
    })
  })

  describe('Regular text messages', () => {
    it('should apply theme-text-on-own class for own text messages', () => {
      const { container } = render(
        <MessageContent 
          content="Hello world" 
          isOwn={true} 
          isDeleted={false} 
        />
      )
      
      const messageDiv = container.querySelector('div')
      expect(messageDiv).toHaveClass('text-theme-text-on-own')
    })

    it('should apply theme-text-on-other class for other text messages', () => {
      const { container } = render(
        <MessageContent 
          content="Hello world" 
          isOwn={false} 
          isDeleted={false} 
        />
      )
      
      const messageDiv = container.querySelector('div')
      expect(messageDiv).toHaveClass('text-theme-text-on-other')
    })
  })

  describe('Theme switching', () => {
    it('should work with all themes for own messages', () => {
      const themes = ['light', 'dark', 'whatsapp', 'telegram']
      
      themes.forEach(theme => {
        document.documentElement.setAttribute('data-theme', theme)
        
        const { container } = render(
          <MessageContent 
            content="Test message" 
            isOwn={true} 
            isDeleted={false} 
          />
        )
        
        const messageDiv = container.querySelector('div')
        expect(messageDiv).toHaveClass('text-theme-text-on-own')
      })
    })

    it('should work with all themes for other messages', () => {
      const themes = ['light', 'dark', 'whatsapp', 'telegram']
      
      themes.forEach(theme => {
        document.documentElement.setAttribute('data-theme', theme)
        
        const { container } = render(
          <MessageContent 
            content="Test message" 
            isOwn={false} 
            isDeleted={false} 
          />
        )
        
        const messageDiv = container.querySelector('div')
        expect(messageDiv).toHaveClass('text-theme-text-on-other')
      })
    })
  })
})

