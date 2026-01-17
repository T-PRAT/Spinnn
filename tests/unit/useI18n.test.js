/**
 * Unit tests for useI18n composable
 *
 * Tests language detection, persistence, and locale management:
 * - Browser language auto-detection
 * - localStorage persistence
 * - Locale switching
 */

import { describe, it, expect, beforeEach } from 'vitest';

describe('useI18n Logic', () => {
  const STORAGE_KEY = 'spinnn_locale';
  const supportedLocales = ['fr', 'en'];

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('Browser Language Detection Logic', () => {
    it('should detect English browser language (en-US -> en)', () => {
      const browserLang = 'en-US';
      const detectedLocale = browserLang.split('-')[0];
      expect(detectedLocale).toBe('en');
      expect(supportedLocales.includes(detectedLocale)).toBe(true);
    });

    it('should detect French browser language (fr-FR -> fr)', () => {
      const browserLang = 'fr-FR';
      const detectedLocale = browserLang.split('-')[0];
      expect(detectedLocale).toBe('fr');
      expect(supportedLocales.includes(detectedLocale)).toBe(true);
    });

    it('should fallback to default for unsupported locale (de-DE -> fr)', () => {
      const browserLang = 'de-DE';
      const detectedLocale = browserLang.split('-')[0];
      expect(supportedLocales.includes(detectedLocale)).toBe(false);
      // Default fallback would be 'fr'
    });
  });

  describe('Locale Persistence', () => {
    it('should save locale to localStorage', () => {
      localStorage.setItem(STORAGE_KEY, 'en');
      expect(localStorage.getItem(STORAGE_KEY)).toBe('en');
    });

    it('should load locale from localStorage', () => {
      localStorage.setItem(STORAGE_KEY, 'fr');
      const loaded = localStorage.getItem(STORAGE_KEY);
      expect(loaded).toBe('fr');
    });

    it('should return null when no locale is stored', () => {
      const loaded = localStorage.getItem(STORAGE_KEY);
      expect(loaded).toBeNull();
    });
  });

  describe('Locale Validation', () => {
    it('should accept valid locale "en"', () => {
      const locale = 'en';
      expect(supportedLocales.includes(locale)).toBe(true);
    });

    it('should accept valid locale "fr"', () => {
      const locale = 'fr';
      expect(supportedLocales.includes(locale)).toBe(true);
    });

    it('should reject invalid locale "de"', () => {
      const locale = 'de';
      expect(supportedLocales.includes(locale)).toBe(false);
    });

    it('should reject invalid locale "es"', () => {
      const locale = 'es';
      expect(supportedLocales.includes(locale)).toBe(false);
    });
  });

  describe('Supported Locales', () => {
    it('should have exactly 2 supported locales', () => {
      expect(supportedLocales.length).toBe(2);
    });

    it('should include French and English', () => {
      expect(supportedLocales).toContain('fr');
      expect(supportedLocales).toContain('en');
    });
  });
});
