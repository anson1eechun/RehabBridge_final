// ============================================================
// poseLogic.ts — 定義每個動作對應的關節點與計算公式
// ============================================================

export const EXERCISE_LOGIC = {
  // 1. 膝蓋彎曲訓練 (Knee Flexion)
  // 關節點：髖部 (Hip) -> 膝蓋 (Knee) -> 腳踝 (Ankle)
  knee_flexion: {
    points: ['hip', 'knee', 'ankle'],
    targetAngle: 90,
    side: 'left', // 或由 ML Kit 自動偵測哪一邊較清楚
  },
  
  // 2. 直腿抬舉 (Leg Raise)
  // 關節點：肩膀 (Shoulder) -> 髖部 (Hip) -> 膝蓋 (Knee)
  leg_raise: {
    points: ['shoulder', 'hip', 'knee'],
    targetAngle: 45,
    side: 'left',
  },
  
  // 3. 靠牆深蹲 (Squat)
  // 關節點：髖部 -> 膝蓋 -> 腳踝 (需偵測雙邊或單邊)
  squat: {
    points: ['hip', 'knee', 'ankle'],
    targetAngle: 100,
    side: 'both',
  },
  
  // 4. 肩部平舉 (Shoulder Abduction)
  // 關節點：髖部 -> 肩膀 -> 手肘
  shoulder_abduction: {
    points: ['hip', 'shoulder', 'elbow'],
    targetAngle: 90,
    side: 'left',
  },
  
  // 5. 二頭肌彎舉 (Elbow Flexion)
  // 關節點：肩膀 -> 手肘 -> 手腕
  elbow_flexion: {
    points: ['shoulder', 'elbow', 'wrist'],
    targetAngle: 120,
    side: 'left',
  },
  
  // 6. 側向抬腿 (Side Leg Raise)
  // 關節點：另一側腳踝 -> 髖部 -> 抬起側腳踝
  side_leg_raise: {
    points: ['left_ankle', 'hip', 'right_ankle'],
    targetAngle: 30,
    side: 'both',
  }
};
/**
 * 計算三點形成的夾角 (角度制)
 * A, B, C 為包含 x, y 座標的物件
 * B 為頂點 (例如膝蓋)
 */
export function calculateAngle(A: any, B: any, C: any) {
  const radians = Math.atan2(C.y - B.y, C.x - B.x) - 
                  Math.atan2(A.y - B.y, A.x - B.x);
  let angle = Math.abs((radians * 180.0) / Math.PI);
  
  if (angle > 180.0) {
    angle = 360 - angle;
  }
  return Math.round(angle);
}