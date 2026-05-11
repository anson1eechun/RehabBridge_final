// ============================================================
// SkeletonCanvas — Presentation Layer
// Renders real-time skeleton overlay on top of the camera feed
// Highlights exercise-relevant joints in gold
// ============================================================

import { useEffect, useRef } from 'react';
import {
  POSE_CONNECTIONS,
  SKELETON_COLORS,
  KEYPOINT_NAMES,
  calculateAngle,
  type JointRef,
  type Keypoint,
} from '../utils/angleCalculator';

interface SkeletonCanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  keypoints: Keypoint[];
  videoWidth: number;
  videoHeight: number;
  highlightJoints?: JointRef[]; // joints to highlight in gold
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

    const kpByName: Record<string, Keypoint> = {};
    const kpByIndex: Record<number, Keypoint> = {};
    keypoints.forEach((kp, i) => {
      kpByName[kp.name] = kp;
      kpByIndex[kp.index ?? i] = kp;
    });

    const resolveRef = (ref: JointRef): Keypoint | undefined => (
      typeof ref === 'number' ? kpByIndex[ref] : kpByName[ref]
    );

    const isHighlighted = (kp: Keypoint, fallbackIndex?: number) => {
      const idx = kp.index ?? fallbackIndex;
      return highlightJoints.some(
        (ref) => ref === kp.name || (typeof ref === 'number' && ref === idx),
      );
    };

    const scaleX = canvas.width / videoWidth;
    const scaleY = canvas.height / videoHeight;

    // Canvas is mirrored by CSS (scaleX(-1)).
    // We mirror text one more time in drawing space so it appears readable to users.
    const drawReadableText = (
      text: string,
      x: number,
      y: number,
      options?: { stroke?: boolean; fill?: boolean },
    ) => {
      const { stroke = false, fill = true } = options ?? {};
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(-1, 1);
      if (stroke) ctx.strokeText(text, 0, 0);
      if (fill) ctx.fillText(text, 0, 0);
      ctx.restore();
    };

    // ── Draw bones ──────────────────────────────────────────
    POSE_CONNECTIONS.forEach(([i, j]) => {
      const kp1 = kpByIndex[i] ?? kpByName[KEYPOINT_NAMES[i]];
      const kp2 = kpByIndex[j] ?? kpByName[KEYPOINT_NAMES[j]];

      if (!kp1 || !kp2) return;
      if ((kp1.score ?? 1) < minConfidence) return;
      if ((kp2.score ?? 1) < minConfidence) return;

      const boneHighlighted = isHighlighted(kp1, i) && isHighlighted(kp2, j);

      ctx.beginPath();
      ctx.moveTo(kp1.x * scaleX, kp1.y * scaleY);
      ctx.lineTo(kp2.x * scaleX, kp2.y * scaleY);
      ctx.strokeStyle = boneHighlighted
        ? SKELETON_COLORS.boneHighlight
        : SKELETON_COLORS.bone;
      ctx.lineWidth = boneHighlighted ? 4 : 2.5;
      ctx.globalAlpha = boneHighlighted ? 0.95 : 0.75;
      ctx.stroke();
      ctx.globalAlpha = 1.0;
    });

    // ── Draw angle arc + text for active training joint ────
    if (highlightJoints.length >= 3) {
      const p1 = resolveRef(highlightJoints[0]);
      const vertex = resolveRef(highlightJoints[1]);
      const p2 = resolveRef(highlightJoints[2]);

      if (p1 && vertex && p2 &&
        (p1.score ?? 1) >= minConfidence &&
        (vertex.score ?? 1) >= minConfidence &&
        (p2.score ?? 1) >= minConfidence
      ) {
        const vx = vertex.x * scaleX;
        const vy = vertex.y * scaleY;
        const p1x = p1.x * scaleX;
        const p1y = p1.y * scaleY;
        const p2x = p2.x * scaleX;
        const p2y = p2.y * scaleY;

        const start = Math.atan2(p1y - vy, p1x - vx);
        const end = Math.atan2(p2y - vy, p2x - vx);
        const raw = end - start;
        const delta = Math.atan2(Math.sin(raw), Math.cos(raw)); // [-PI, PI]
        const radius = 36;

        ctx.beginPath();
        ctx.arc(vx, vy, radius, start, start + delta, delta < 0);
        ctx.strokeStyle = SKELETON_COLORS.angleArc;
        ctx.lineWidth = 4;
        ctx.globalAlpha = 0.9;
        ctx.stroke();
        ctx.globalAlpha = 1;

        const angle = calculateAngle(p1, vertex, p2);
        const mid = start + delta / 2;
        const tx = vx + Math.cos(mid) * (radius + 20);
        const ty = vy + Math.sin(mid) * (radius + 20);

        ctx.font = 'bold 18px system-ui';
        ctx.fillStyle = SKELETON_COLORS.angleText;
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.lineWidth = 3;
        const label = `${angle}°`;
        drawReadableText(label, tx - 18, ty + 6, { stroke: true, fill: true });
      }
    }

    // ── Draw joints ─────────────────────────────────────────
    keypoints.forEach((kp, idx) => {
      if ((kp.score ?? 1) < minConfidence) return;

      const highlighted = isHighlighted(kp, idx);
      const x = kp.x * scaleX;
      const y = kp.y * scaleY;
      const radius = highlighted ? 10 : 6;

      // Outer glow
      ctx.beginPath();
      ctx.arc(x, y, radius + 3, 0, 2 * Math.PI);
      ctx.fillStyle = highlighted
        ? 'rgba(255, 214, 0, 0.3)'
        : 'rgba(0, 229, 255, 0.2)';
      ctx.fill();

      // Inner circle
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = highlighted ? SKELETON_COLORS.jointHighlight : SKELETON_COLORS.joint;
      ctx.fill();

      // White center dot
      ctx.beginPath();
      ctx.arc(x, y, radius * 0.35, 0, 2 * Math.PI);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();

      // Draw index label for better debug/visual feedback
      const labelIndex = kp.index ?? idx;
      ctx.font = '12px system-ui';
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      drawReadableText(`${labelIndex}`, x + 8, y - 8);
    });

    prevKeypoints.current = keypoints;
  }, [keypoints, videoWidth, videoHeight, highlightJoints, minConfidence, canvasRef]);

  return null;
}
