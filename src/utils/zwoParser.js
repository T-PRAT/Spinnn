export const MAX_ZWO_BYTES = 1024 * 1024;

export function parseZwoFile(xml) {
  if (xml.querySelector('parsererror') || !xml.querySelector('workout_file > workout')) throw new Error('invalid');
  const intervals = [];
  const number = (el, name, max, allowZero = false) => {
    const raw = el.getAttribute(name);
    const value = raw === null ? NaN : Number(raw);
    if (!Number.isFinite(value) || value < (allowZero ? 0 : 1) || value > max) throw new Error('invalid');
    return value;
  };
  const power = (el, key) => number(el, key, 3, true);
  for (const el of xml.querySelector('workout_file > workout').children) {
    const type = el.tagName;
    if (type === 'textevent') continue;
    if (type === 'IntervalsT') {
      const repeats = number(el, 'Repeat', 1000);
      if (!Number.isInteger(repeats)) throw new Error('invalid');
      for (let i = 0; i < repeats; i++) {
        intervals.push({ type: 'work', duration: number(el, 'OnDuration', 86400), power: power(el, 'OnPower') });
        intervals.push({ type: 'recovery', duration: number(el, 'OffDuration', 86400), power: power(el, 'OffPower') });
      }
    } else if (['Warmup', 'Cooldown', 'Ramp'].includes(type)) {
      intervals.push({ type: type.toLowerCase(), duration: number(el, 'Duration', 86400), powerStart: power(el, 'PowerLow'), powerEnd: power(el, 'PowerHigh') });
    } else if (type === 'SteadyState' || type === 'FreeRide') {
      intervals.push({ type: type === 'FreeRide' ? 'freeride' : 'steady', duration: number(el, 'Duration', 86400), power: type === 'FreeRide' ? 0 : power(el, 'Power') });
    } else throw new Error('unsupported');
  }
  const duration = intervals.reduce((total, interval) => total + interval.duration, 0);
  if (!intervals.length || intervals.length > 2000 || duration > 86400) throw new Error('invalid');
  return { id: crypto.randomUUID(), name: xml.querySelector('workout_file > name')?.textContent?.trim() || 'ZWO', description: xml.querySelector('workout_file > description')?.textContent || '', duration, intervals, difficulty: 'Custom' };
}
