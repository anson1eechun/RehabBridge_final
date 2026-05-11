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
  index?: number;
}

export type JointRef = string | number;

const BLAZE_TO_MOVENET_INDEX: Record<number, number> = {
  // Arms
  11: 5, 12: 6, 13: 7, 14: 8, 15: 9, 16: 10,
  // Hips / legs
  23: 11, 24: 12, 25: 13, 26: 14, 27: 15, 28: 16,
  // Approximate feet to ankle in MoveNet
  29: 15, 30: 16, 31: 15, 32: 16,
};

function isMoveNetLike(keypoints: Keypoint[]): boolean {
  if (!keypoints.length) return false;
  const maxIndex = Math.max(...keypoints.map((kp, i) => kp.index ?? i));
  return maxIndex <= 16;
}

const MIRROR_INDEX_MAP: Record<number, number> = {
  0: 0,
  1: 4, 2: 5, 3: 6,
  4: 1, 5: 2, 6: 3,
  7: 8, 8: 7,
  9: 10, 10: 9,
  11: 12, 12: 11,
  13: 14, 14: 13,
  15: 16, 16: 15,
  17: 18, 18: 17,
  19: 20, 20: 19,
  21: 22, 22: 21,
  23: 24, 24: 23,
  25: 26, 26: 25,
  27: 28, 28: 27,
  29: 30, 30: 29,
  31: 32, 32: 31,
};

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
  ref: JointRef
): Keypoint | undefined {
  if (typeof ref === 'number') {
    const direct = keypoints.find((kp) => kp.index === ref) ?? keypoints[ref];
    if (direct) return direct;

    // If current detector only gives 17 points, map BlazePose index to MoveNet index.
    if (isMoveNetLike(keypoints) && ref > 16) {
      const mapped = BLAZE_TO_MOVENET_INDEX[ref];
      if (mapped !== undefined) {
        return keypoints.find((kp) => kp.index === mapped) ?? keypoints[mapped];
      }
    }
    return undefined;
  }
  return keypoints.find((kp) => kp.name === ref);
}

export function mirrorJointRef(ref: JointRef): JointRef {
  if (typeof ref === 'number') {
    return MIRROR_INDEX_MAP[ref] ?? ref;
  }

  if (ref.startsWith('left_')) return ref.replace('left_', 'right_');
  if (ref.startsWith('right_')) return ref.replace('right_', 'left_');
  if (ref === 'mouth_left') return 'mouth_right';
  if (ref === 'mouth_right') return 'mouth_left';
  return ref;
}

export function mirrorJointTriplet(
  joints: [JointRef, JointRef, JointRef]
): [JointRef, JointRef, JointRef] {
  return [
    mirrorJointRef(joints[0]),
    mirrorJointRef(joints[1]),
    mirrorJointRef(joints[2]),
  ];
}

export function getJointTripletConfidence(
  keypoints: Keypoint[],
  joints: [JointRef, JointRef, JointRef]
): number {
  const p1 = findKeypoint(keypoints, joints[0]);
  const p2 = findKeypoint(keypoints, joints[1]);
  const p3 = findKeypoint(keypoints, joints[2]);
  if (!p1 || !p2 || !p3) return 0;
  return ((p1.score ?? 0) + (p2.score ?? 0) + (p3.score ?? 0)) / 3;
}

/**
 * Extract angle from keypoints given three joint names
 */
export function extractAngleFromKeypoints(
  keypoints: Keypoint[],
  jointNames: [JointRef, JointRef, JointRef], // [p1, vertex, p2]
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
  // BlazePose (33 keypoints) connections
  // Face
  [0, 1], [1, 2], [2, 3], [3, 7],
  [0, 4], [4, 5], [5, 6], [6, 8],
  [9, 10],
  // Torso
  [11, 12], [11, 23], [12, 24], [23, 24],
  // Left arm
  [11, 13], [13, 15], [15, 17], [15, 19], [15, 21], [17, 19],
  // Right arm
  [12, 14], [14, 16], [16, 18], [16, 20], [16, 22], [18, 20],
  // Left leg
  [23, 25], [25, 27], [27, 29], [29, 31], [27, 31],
  // Right leg
  [24, 26], [26, 28], [28, 30], [30, 32], [28, 32],
];

export const KEYPOINT_NAMES = [
  'nose',
  'left_eye_inner', 'left_eye', 'left_eye_outer',
  'right_eye_inner', 'right_eye', 'right_eye_outer',
  'left_ear', 'right_ear',
  'mouth_left', 'mouth_right',
  'left_shoulder', 'right_shoulder',
  'left_elbow', 'right_elbow',
  'left_wrist', 'right_wrist',
  'left_pinky', 'right_pinky',
  'left_index', 'right_index',
  'left_thumb', 'right_thumb',
  'left_hip', 'right_hip',
  'left_knee', 'right_knee',
  'left_ankle', 'right_ankle',
  'left_heel', 'right_heel',
  'left_foot_index', 'right_foot_index',
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
