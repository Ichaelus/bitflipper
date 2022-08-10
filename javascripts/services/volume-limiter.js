/***
 * A limiter can keep the volume in an acceptable range after applying effects
***/

const THRESHOLD = -30.0 // this is the pitfall, leave some headroom
const KNEE = 6.0 // brute force
const RATIO = 20.0 // max compression
const ATTACK_SECONDS = 0.002
const RELEASE_SECONDS = 0.1

export function setupVolumeLimiter(audioContext) {
  const limiter = audioContext.createDynamicsCompressor()
  const now = audioContext.currentTime

  limiter.threshold.setValueAtTime(THRESHOLD, now)
  limiter.knee.setValueAtTime(KNEE, now)
  limiter.ratio.setValueAtTime(RATIO, now)
  limiter.attack.setValueAtTime(ATTACK_SECONDS, now)
  limiter.release.setValueAtTime(RELEASE_SECONDS, now)

  return limiter
}
