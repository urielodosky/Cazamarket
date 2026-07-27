export function formatTimeAgo(timeInput?: string | number): string {
  if (!timeInput) return 'Hace 1 min';

  let timestamp = 0;
  if (typeof timeInput === 'number') {
    timestamp = timeInput;
  } else if (!isNaN(Number(timeInput))) {
    timestamp = Number(timeInput);
  } else {
    const parsedDate = Date.parse(timeInput);
    if (!isNaN(parsedDate)) {
      timestamp = parsedDate;
    }
  }

  if (!timestamp) {
    if (timeInput === 'Justo ahora' || timeInput === 'Hace un momento') return 'Hace 1 min';
    return String(timeInput);
  }

  const diffMs = Date.now() - timestamp;
  if (diffMs < 0) return 'Hace 1 min';

  const diffSecs = Math.floor(diffMs / 1000);
  if (diffSecs < 60) return 'Hace 1 min';

  const diffMins = Math.floor(diffSecs / 60);
  if (diffMins < 60) return `Hace ${diffMins} min${diffMins > 1 ? 's' : ''}`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `Hace ${diffHours} hs`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `Hace ${diffMonths} mes${diffMonths > 1 ? 'es' : ''}`;

  const diffYears = Math.floor(diffDays / 365);
  return `Hace ${diffYears} año${diffYears > 1 ? 's' : ''}`;
}
