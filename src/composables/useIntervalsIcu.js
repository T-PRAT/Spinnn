import { ref, readonly } from 'vue';
import { useStorage } from './useStorage';
import { PreparationError } from '@/utils/preparationMessages';
import { extractDayWorkouts, localDateString } from '@/utils/intervalsWorkout';
import { DEFAULT_FTP } from '@/constants/zones';

const storage = useStorage();
const API_BASE_URL = 'https://intervals.icu/api/v1';
const REQUEST_TIMEOUT_MS = 15000;

// Singleton state
const apiKey = ref(null);
const athleteId = ref(null);
const isConnected = ref(false);

// Load from localStorage on module init
const credentials = storage.getIntervalsCredentials();
if (credentials) {
  apiKey.value = credentials.apiKey;
  athleteId.value = credentials.athleteId;
  isConnected.value = true;
}

/**
 * Appelle l'API Intervals.icu et traduit chaque échec en PreparationError :
 * identifiants refusés, limite de débit, serveur en panne, réseau, délai, réponse illisible.
 */
async function request(endpoint, { key, id }) {
  if (!key || !id) {
    throw new PreparationError('intervals.notConfigured');
  }

  let authorization;
  try {
    authorization = `Basic ${btoa(`API_KEY:${key}`)}`;
  } catch {
    // btoa refuse les caractères hors Latin-1 : une clé collée avec un caractère parasite
    throw new PreparationError('intervals.auth');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: { Authorization: authorization, Accept: 'application/json' },
      signal: controller.signal
    });
  } catch (error) {
    throw new PreparationError(error?.name === 'AbortError' ? 'intervals.timeout' : 'intervals.network');
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    const { status } = response;
    // 404 : identifiant athlète inconnu pour cette clé
    if (status === 401 || status === 403 || status === 404) throw new PreparationError('intervals.auth');
    if (status === 429) throw new PreparationError('intervals.rateLimit');
    if (status >= 500) throw new PreparationError('intervals.server', { status });
    throw new PreparationError('intervals.http', { status });
  }

  try {
    return await response.json();
  } catch {
    throw new PreparationError('intervals.badResponse');
  }
}

async function fetchDayWorkouts({ key, id }, ftp) {
  const date = localDateString();
  const events = await request(
    `/athlete/${encodeURIComponent(id)}/events?oldest=${date}&newest=${date}`,
    { key, id }
  );
  return { date, ...extractDayWorkouts(events, { date, ftp }) };
}

export function useIntervalsIcu() {
  function setCredentials(key, id) {
    if (storage.setIntervalsCredentials(key, id)) {
      apiKey.value = key;
      athleteId.value = id;
      isConnected.value = true;
    }
  }

  function disconnect() {
    storage.clearIntervalsCredentials();
    apiKey.value = null;
    athleteId.value = null;
    isConnected.value = false;
  }

  /**
   * Vérifie une clé API et un identifiant athlète auprès d'Intervals.icu, puis ne les
   * enregistre qu'en cas de succès : un échec (réseau compris) laisse la connexion
   * existante intacte et permet de réessayer sans tout ressaisir.
   * @throws {PreparationError}
   */
  async function connect(key, id, ftp = DEFAULT_FTP) {
    const cleanKey = String(key ?? '').trim();
    const cleanId = String(id ?? '').trim();

    const result = await fetchDayWorkouts({ key: cleanKey, id: cleanId }, ftp);
    setCredentials(cleanKey, cleanId);
    return result;
  }

  /**
   * Séances planifiées aujourd'hui (date locale) pour l'athlète connecté.
   * @param {number} ftp - FTP de Spinnn, pour convertir les cibles en watts absolus
   * @returns {Promise<{date: string, workouts: Array, skipped: Array}>}
   * @throws {PreparationError}
   */
  function getTodayWorkouts(ftp = DEFAULT_FTP) {
    return fetchDayWorkouts({ key: apiKey.value, id: athleteId.value }, ftp);
  }

  return {
    isConnected: readonly(isConnected),
    apiKey: readonly(apiKey),
    athleteId: readonly(athleteId),
    setCredentials,
    disconnect,
    connect,
    getTodayWorkouts
  };
}
