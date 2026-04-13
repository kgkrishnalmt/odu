// Average step length estimates
const RUN_STEP_LENGTH = 0.75 // meters per step
const WALK_STEP_LENGTH = 0.65

export function estimateSteps(distanceKm: number, runTimeSeconds: number, walkTimeSeconds: number) {
  const runDistance = (distanceKm * 1000) * (runTimeSeconds / (runTimeSeconds + walkTimeSeconds || 1))
  const walkDistance = (distanceKm * 1000) * (walkTimeSeconds / (runTimeSeconds + walkTimeSeconds || 1))
  return Math.round((runDistance / RUN_STEP_LENGTH) + (walkDistance / WALK_STEP_LENGTH))
}

export function estimateCalories(
  distanceKm: number,
  durationSeconds: number,
  weightKg = 70
) {
  // MET-based estimate: running ~8 MET, walking ~3.5 MET, blended
  const hours = durationSeconds / 3600
  const met = 6.5
  return Math.round(met * weightKg * hours)
}

export function calculateDistance(coords: [number, number][]) {
  let total = 0
  for (let i = 1; i < coords.length; i++) {
    total += haversine(coords[i - 1], coords[i])
  }
  return total // in km
}

function haversine([lat1, lon1]: [number, number], [lat2, lon2]: [number, number]) {
  const R = 6371
  const dLat = deg2rad(lat2 - lat1)
  const dLon = deg2rad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180)
}