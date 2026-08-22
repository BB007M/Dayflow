export const formatWorkedHours = (hours: number | null | undefined): string => {
  if (hours === null || hours === undefined || hours <= 0) return '--';

  const totalMinutes = Math.round(hours * 60);
  const wholeHours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (wholeHours === 0) return `${minutes} min`;
  if (minutes === 0) return `${wholeHours} hr`;
  return `${wholeHours} hr ${minutes} min`;
};

export const formatWorkedSeconds = (totalSeconds: number): string =>
  formatWorkedHours(totalSeconds / 3600);

export const formatWorkedClock = (hours: number): string => {
  const totalSeconds = Math.max(0, Math.round(hours * 3600));
  const wholeHours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [wholeHours, minutes, seconds]
    .map((value) => String(value).padStart(2, '0'))
    .join(':');
};

export const getLocalDateKey = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};