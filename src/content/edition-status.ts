export function madridToday(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Madrid',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

// The final day is still open; elapsed editions remain visible as closed.
export function editionStatus(
  edition: { status: 'open' | 'closed'; endDate: string },
  today = madridToday(),
): 'open' | 'closed' {
  return edition.status === 'closed' || edition.endDate < today ? 'closed' : 'open';
}
