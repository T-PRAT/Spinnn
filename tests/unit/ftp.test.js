import { describe, expect, it } from 'bun:test';
import { FTP_MAX, FTP_MIN, parseFtp } from '../../src/utils/ftp.js';
import { PreparationError, describePreparationError, preparationText } from '../../src/utils/preparationMessages.js';

describe('parseFtp', () => {
  it('accepte des nombres et des textes numériques', () => {
    expect(parseFtp(250)).toBe(250);
    expect(parseFtp('250')).toBe(250);
    expect(parseFtp(' 250 ')).toBe(250);
  });

  it('arrondit un décimal, virgule française comprise', () => {
    expect(parseFtp('250,4')).toBe(250);
    expect(parseFtp(250.6)).toBe(251);
  });

  it('accepte les bornes', () => {
    expect(parseFtp(FTP_MIN)).toBe(FTP_MIN);
    expect(parseFtp(FTP_MAX)).toBe(FTP_MAX);
  });

  it('refuse les valeurs hors bornes ou non numériques', () => {
    for (const value of [0, -5, FTP_MIN - 1, FTP_MAX + 1, '', '  ', 'abc', '25a', NaN, Infinity, null, undefined, {}, '1e3']) {
      expect(parseFtp(value)).toBeNull();
    }
  });
});

describe('messages de préparation', () => {
  it('traduit et remplace les variables', () => {
    expect(preparationText('ftp.invalid', { min: 50, max: 600 }, 'fr')).toBe('La FTP doit être un nombre de watts compris entre 50 et 600.');
    expect(preparationText('ftp.invalid', { min: 50, max: 600 }, 'en')).toBe('FTP must be a number of watts between 50 and 600.');
  });

  it('retombe sur le français pour une langue inconnue', () => {
    expect(preparationText('intervals.network', {}, 'de')).toContain('Impossible de joindre Intervals.icu');
  });

  it('donne un message générique, jamais le texte technique d’une exception', () => {
    expect(describePreparationError(new TypeError('Failed to fetch'), 'fr')).toBe('Une erreur inattendue est survenue. Réessayez.');
    expect(describePreparationError(new PreparationError('intervals.auth'), 'fr')).toContain('refuse l’authentification');
  });

  it('a une traduction anglaise pour chaque message français', () => {
    const missing = [];
    const sample = (code) => preparationText(code, {}, 'en') === code;
    // Les codes sont déduits des erreurs et messages effectivement émis par l'application
    for (const code of [
      'zwo.unreadable', 'zwo.tooLarge', 'zwo.invalidXml', 'zwo.notZwo', 'zwo.notBike', 'zwo.empty', 'zwo.unsupportedBlock',
      'zwo.invalidValue', 'intervals.notConfigured', 'intervals.auth', 'intervals.rateLimit', 'intervals.server',
      'intervals.http', 'intervals.network', 'intervals.timeout', 'intervals.badResponse', 'ftp.invalid', 'ftp.saved',
      'ftp.storageFailed', 'intervals.skip.noStructure', 'intervals.skip.notCycling', 'intervals.skip.noDuration',
      'intervals.skip.freeride', 'intervals.skip.noPowerTarget', 'intervals.skip.unit', 'intervals.skip.invalidValue',
      'intervals.skip.tooDeep'
    ]) {
      if (sample(code)) missing.push(code);
      expect(preparationText(code, {}, 'fr')).not.toBe(code);
    }
    expect(missing).toEqual([]);
  });
});
