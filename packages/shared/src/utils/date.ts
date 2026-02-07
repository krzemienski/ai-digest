export function formatDigestDate(date: Date): string {
  return date.toISOString().split("T")[0] as string;
}

export function isWithinHours(date: Date, hours: number): boolean {
  return Date.now() - date.getTime() < hours * 60 * 60 * 1000;
}
