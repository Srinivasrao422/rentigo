export function rentalDate(offset = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()]
    .map((part) => String(part).padStart(2, "0")).join("-");
}

export function rentalDateTime(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return "";
  const parsed = new Date(`${date}T10:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return "";
  const iso = parsed.toISOString();
  return iso.startsWith(date) ? iso : "";
}

export function rentalRange(startDate: string, endDate: string) {
  if (!rentalDateTime(startDate) || !rentalDateTime(endDate) || endDate <= startDate) {
    return null;
  }
  return { startDate, endDate };
}
