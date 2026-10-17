// Kalutara store: Monday - Saturday, 9:00 AM - 6:30 PM (Sri Lanka time)
const OPEN_MINUTES = 9 * 60;
const CLOSE_MINUTES = 18 * 60 + 30;

export interface StoreStatus {
  isOpen: boolean;
  label: string;
}

export const getStoreStatus = (now: Date = new Date()): StoreStatus => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Colombo',
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    hourCycle: 'h23'
  }).formatToParts(now);

  const get = (type: string) => parts.find(p => p.type === type)?.value ?? '';
  const weekday = get('weekday');
  const minutes = Number(get('hour')) * 60 + Number(get('minute'));
  const isSunday = weekday === 'Sun';

  if (!isSunday && minutes >= OPEN_MINUTES && minutes < CLOSE_MINUTES) {
    return { isOpen: true, label: 'Open now · Closes 6:30 PM' };
  }

  const opensToday = !isSunday && minutes < OPEN_MINUTES;
  const opensMonday = isSunday || (weekday === 'Sat' && minutes >= CLOSE_MINUTES);
  return {
    isOpen: false,
    label: opensToday ? 'Closed · Opens 9:00 AM' : opensMonday ? 'Closed · Opens Monday 9:00 AM' : 'Closed · Opens 9:00 AM tomorrow'
  };
};
