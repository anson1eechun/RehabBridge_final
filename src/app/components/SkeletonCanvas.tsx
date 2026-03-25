// ============================================================
// SkeletonCanvas — Presentation Layer
// Renders real-time skeleton overlay on top of the camera feed
// Highlights exercise-relevant joints in gold
// ============================================================

import { useEffect, useRef } from 'react';
import {
  POSE_CONNECTIONS,
  SKELETON_COLORS,
  KEYPOINT_INDEX,
  type Keypoint,
} from '../utils/angleCalculator';

interface SkeletonCanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  keypoints: Keypoint[];
  videoWidth: number;
  videoHeight: number;
  highlightJoints?: string[]; // joints to highlight in gold
  minConfidence?: number;
}

export function SkeletonCanvas({
  canvasRef,
  keypoints,
  videoWidth,
  videoHeight,
  highlightJoints = [],
  minConfidence = 0.3,
}: SkeletonCanvasProps) {
  const prevKeypoints = useRef<Keypoint[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Match canvas to video dimensions
    canvas.width = videoWidth;
    canvas.height = videoHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!keypoints || keypoints.length === 0) return;

    const validKps = keypoints.filter(kp => (kp.score ?? 1) >= minConfidence);
    if (validKps.length < 5) return;

    // Build index map for fast lookup
    const kpMap: Record<string, Keypoint> = {};
    keypoints.forEach(kp => { kpMap[kp.name] = kp; });

    const scaleX = canvas.width / videoWidth;
    const scaleY = canvas.height / videoHeight;

    // ── Draw bones ──────────────────────────────────────────
    POSE_CONNECTIONS.forEach(([i, j]) => {
      const names = Object.keys(KEYPOINT_INDEX);
      const kp1 = kpMap[names[i]];
      const kp2 = kpMap[names[j]];

      if (!kp1 || !kp2) return;
      if ((kp1.score ?? 1) < minConfidence) return;
      if ((kp2.score ?? 1) < minConfidence) return;

      const isHighlighted =
        highlightJoints.includes(kp1.name) &&
        highlightJoints.includes(kp2.name);

      ctx.beginPath();
      ctx.moveTo(kp1.x * scaleX, kp1.y * scaleY);
      ctx.lineTo(kp2.x * scaleX, kp2.y * scaleY);
      ctx.strokeStyle = isHighlighted
        ? SKELETON_COLORS.boneHighlight
        : SKELETON_COLORS.bone;
      ctx.lineWidth = isHighlighted ? 4 : 2.5;
      ctx.globalAlpha = isHighlighted ? 0.95 : 0.75;
      ctx.stroke();
      ctx.globalAlpha = 1.0;
    });

    // ── Draw joints ─────────────────────────────────────────
    keypoints.forEach(kp => {
      if ((kp.score ?? 1) < minConfidence) return;

      const isHighlighted = highlightJoints.includes(kp.name);
      const x = kp.x * scaleX;
      const y = kp.y * scaleY;
      const radius = isHighlighted ? 10 : 6;

      // Outer glow
      ctx.beginPath();
      ctx.arc(x, y, radius + 3, 0, 2 * Math.PI);
      ctx.fillStyle = isHighlighted
        ? 'rgba(255, 214, 0, 0.3)'
        : 'rgba(0, 229, 255, 0.2)';
      ctx.fill();

      // Inner circle
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = isHighlighted
        ? SKELETON_COLORS.jointHighlight
        : SKELETON_COLORS.joint;
      ctx.fill();

      // White center dot
      ctx.beginPath();
      ctx.arc(x, y, radius * 0.35, 0, 2 * Math.PI);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
    });

    prevKeypoints.current = keypoints;
  }, [keypoints, videoWidth, videoHeight, highlightJoints, minConfidence, canvasRef]);

  return null;
}
