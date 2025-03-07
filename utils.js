export function calculateTimeRemaining(diff) {
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  return { hours, minutes, seconds };
}

export function padZero(num) {
  return num.toString().padStart(2, "0");
}

export function formatTime(hours, minutes, seconds) {
  return hours > 0
    ? `${padZero(hours)}:${padZero(minutes)}:${padZero(seconds)}`
    : `${padZero(minutes)}:${padZero(seconds)}`;
}
