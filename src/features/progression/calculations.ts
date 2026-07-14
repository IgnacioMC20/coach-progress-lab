export function calculateE1RmKg(weightKg: number, reps: number) {
  return Number((weightKg * (1 + reps / 30)).toFixed(1));
}
