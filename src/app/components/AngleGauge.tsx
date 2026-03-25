// ============================================================
// AngleGauge — Presentation Layer
// Visual arc-based gauge showing current vs target angle
// Color-coded: red → amber → green based on proximity to target
// ============================================================

import React from 'react';

interface AngleGaugeProps {
  currentAngle: number;
  targetAngle: number;
  tolerance: number;
  size?: number;
}

export function AngleGauge({
  currentAngle,
  targetAngle,
  tolerance,
  size = 200,
}: AngleGaugeProps) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.38;
  const strokeWidth = size * 0.07;

  // Arc goes from -225° to 45° (270° total sweep)
  const startAngleDeg = -225;
  const sweepDeg = 270;

  const clampedCurrent = Math.min(Math.max(currentAngle, 0), 180);
  const clampedTarget = Math.min(Math.max(targetAngle, 0), 180);

  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const arcPath = (fromDeg: number, toDeg: number, r: number) => {
    const startRad = toRad(fromDeg);
    const endRad = toRad(toDeg);
    const largeArc = toDeg - fromDeg > 180 ? 1 : 0;
    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy + r * Math.sin(endRad);
    return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
  };

  // Map angle value (0–180) to svg arc degrees
  const mapToDeg = (angle: number) =>
    startAngleDeg + (angle / 180) * sweepDeg;

  const currentDeg = mapToDeg(clampedCurrent);
  const targetDeg = mapToDeg(clampedTarget);
  const endDeg = startAngleDeg + sweepDeg;

  // Determine color based on status
  const deviation = Math.abs(currentAngle - targetAngle);
  let gaugeColor = '#EF5350'; // red
  if (deviation <= tolerance) gaugeColor = '#66BB6A'; // green
  else if (deviation <= tolerance * 2.5) gaugeColor = '#FFA726'; // amber

  // Needle tip position
  const needleTipX = cx + (radius + strokeWidth * 0.5) * Math.cos(toRad(currentDeg));
  const needleTipY = cy + (radius + strokeWidth * 0.5) * Math.sin(toRad(currentDeg));
  const needleBaseX = cx + (radius - strokeWidth * 0.5) * Math.cos(toRad(currentDeg));
  const needleBaseY = cy + (radius - strokeWidth * 0.5) * Math.sin(toRad(currentDeg));

  // Target tick
  const targetTickOuter = radius + strokeWidth * 0.8;
  const targetTickInner = radius - strokeWidth * 0.8;

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background track */}
        <path
          d={arcPath(startAngleDeg, endDeg, radius)}
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Active fill arc */}
        {clampedCurrent > 0 && (
          <path
            d={arcPath(startAngleDeg, currentDeg, radius)}
            fill="none"
            stroke={gaugeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            style={{ transition: 'all 0.15s ease-out', filter: `drop-shadow(0 0 6px ${gaugeColor}88)` }}
          />
        )}

        {/* Target marker */}
        <line
          x1={cx + targetTickInner * Math.cos(toRad(targetDeg))}
          y1={cy + targetTickInner * Math.sin(toRad(targetDeg))}
          x2={cx + targetTickOuter * Math.cos(toRad(targetDeg))}
          y2={cy + targetTickOuter * Math.sin(toRad(targetDeg))}
          stroke="#FFD600"
          strokeWidth={4}
          strokeLinecap="round"
        />

        {/* Needle indicator */}
        <line
          x1={needleBaseX}
          y1={needleBaseY}
          x2={needleTipX}
          y2={needleTipY}
          stroke="#FFFFFF"
          strokeWidth={3}
          strokeLinecap="round"
          style={{ transition: 'all 0.15s ease-out' }}
        />

        {/* Center display */}
        <text
          x={cx}
          y={cy - 8}
          textAnchor="middle"
          fill="#FFFFFF"
          fontSize={size * 0.18}
          fontWeight="700"
          fontFamily="system-ui, sans-serif"
        >
          {currentAngle}°
        </text>
        <text
          x={cx}
          y={cy + size * 0.13}
          textAnchor="middle"
          fill="rgba(255,255,255,0.6)"
          fontSize={size * 0.09}
          fontFamily="system-ui, sans-serif"
        >
          目標 {targetAngle}°
        </text>

        {/* Min/Max labels */}
        <text
          x={cx - radius * 0.85}
          y={cy + radius * 0.72}
          textAnchor="middle"
          fill="rgba(255,255,255,0.4)"
          fontSize={size * 0.075}
          fontFamily="system-ui, sans-serif"
        >
          0°
        </text>
        <text
          x={cx + radius * 0.85}
          y={cy + radius * 0.72}
          textAnchor="middle"
          fill="rgba(255,255,255,0.4)"
          fontSize={size * 0.075}
          fontFamily="system-ui, sans-serif"
        >
          180°
        </text>
      </svg>
    </div>
  );
}
