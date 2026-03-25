// ============================================================
// AngleCalculator — Domain Layer
// Calculates joint angles from pose keypoints
// Uses vector mathematics for accurate angle measurement
// ============================================================

export interface Keypoint {
  name: string;
  x: number;
  y: number;
  score?: number;
}

export interface AngleResult {
  angle: number;
  status: 'below' | 'achieved' | 'above' | 'unknown';
  deviation: number;
  percentage: number; // 0–100 progress toward target
}

/**
 * Calculate angle at the vertex point between two vectors:
 * vector (vertex → p1) and vector (vertex → p2)
 */
export function calculateAngle(
  p1: { x: number; y: number },
  vertex: { x: number; y: number },
  p2: { x: number; y: number }
): number {
  const v1 = { x: p1.x - vertex.x, y: p1.y - vertex.y };
  const v2 = { x: p2.x - vertex.x, y: p2.y - vertex.y };

  const dot = v1.x * v2.x + v1.y * v2.y;
  const mag1 = Math.sqrt(v1.x ** 2 + v1.y ** 2);
  const mag2 = Math.sqrt(v2.x ** 2 + v2.y ** 2);

  if (mag1 === 0 || mag2 === 0) return 0;

  const cosAngle = Math.max(-1, Math.min(1, dot / (mag1 * mag2)));
  return Math.round(Math.acos(cosAngle) * (180 / Math.PI));
}

/**
 * Get angle result with status relative to target
 */
export function getAngleResult(
  currentAngle: number,
  targetAngle: number,
  tolerance: number
): AngleResult {
  const deviation = currentAngle - targetAngle;
  const absDeviation = Math.abs(deviation);

  let status: AngleResult['status'];
  if (absDeviation <= tolerance) {
    status = 'achieved';
  } else if (currentAngle < targetAngle) {
    status = 'below';
  } else {
    status = 'above';
  }

  const percentage = Math.min(100, Math.round((currentAngle / targetAngle) * 100));

  return { angle: currentAngle, status, deviation, percentage };
}

/**
 * Find a keypoint by name from array
 */
export function findKeypoint(
  keypoints: Keypoint[],
  name: string
): Keypoint | undefined {
  return keypoints.find((kp) => kp.name === name);
}

/**
 * Extract angle from keypoints given three joint names
 */
export function extractAngleFromKeypoints(
  keypoints: Keypoint[],
  jointNames: [string, string, string], // [p1, vertex, p2]
  minConfidence = 0.3
): number | null {
  const [p1Name, vertexName, p2Name] = jointNames;

  const p1 = findKeypoint(keypoints, p1Name);
  const vertex = findKeypoint(keypoints, vertexName);
  const p2 = findKeypoint(keypoints, p2Name);

  if (!p1 || !vertex || !p2) return null;
  if ((p1.score ?? 1) < minConfidence) return null;
  if ((vertex.score ?? 1) < minConfidence) return null;
  if ((p2.score ?? 1) < minConfidence) return null;

  return calculateAngle(p1, vertex, p2);
}

// ─── Skeleton Connection Map ────────────────────────────────
// MoveNet keypoint indices for connection rendering
export const POSE_CONNECTIONS: [number, number][] = [
  // Face
  [0, 1], [0, 2], [1, 3], [2, 4],
  // Body
  [5, 6],   // shoulders
  [5, 7], [7, 9],   // left arm
  [6, 8], [8, 10],  // right arm
  [5, 11], [6, 12], // torso sides
  [11, 12], // hips
  [11, 13], [13, 15], // left leg
  [12, 14], [14, 16], // right leg
];

export const KEYPOINT_NAMES = [
  'nose', 'left_eye', 'right_eye', 'left_ear', 'right_ear',
  'left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow',
  'left_wrist', 'right_wrist', 'left_hip', 'right_hip',
  'left_knee', 'right_knee', 'left_ankle', 'right_ankle',
];

export const KEYPOINT_INDEX: Record<string, number> = Object.fromEntries(
  KEYPOINT_NAMES.map((name, i) => [name, i])
);

// Color codes for skeleton drawing
export const SKELETON_COLORS = {
  joint: '#00E5FF',
  jointHighlight: '#FFD600',
  bone: '#00BCD4',
  boneHighlight: '#FF6F00',
  angleArc: '#69F0AE',
  angleText: '#FFFFFF',
};
