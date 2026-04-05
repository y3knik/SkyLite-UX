/**
 * Returns the start of the current day in local timezone.
 * Used for filtering countdowns to include items due "today" at local midnight,
 * avoiding timezone issues where UTC-based comparisons would exclude countdowns
 * in timezones behind UTC during early morning hours.
 */
export function getCountdownCutoff(): Date {
  const now = new Date();
  const cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return cutoff;
}
