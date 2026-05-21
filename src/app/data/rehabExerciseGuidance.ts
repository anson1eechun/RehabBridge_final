export interface RehabExerciseGuidance {
  exerciseId: string;
  sourceLabel: string;
  sourceUrl: string;
  whatToDo: string[];
  precautions: string[];
}

const AAOS_KNEE_EXERCISES = 'https://orthoinfo.aaos.org/en/staying-healthy/knee-exercises';
const AAOS_KNEE_CONDITIONING = 'https://orthoinfo.aaos.org/en/recovery/knee-conditioning-program?grpwebid=26DAE356';
const AAOS_SHOULDER_CONDITIONING = 'https://orthoinfo.aaos.org/en/recovery/rotator-cuff-and-shoulder-conditioning-program';
const AAOS_SHOULDER_SURGERY = 'https://orthoinfo.aaos.org/en/recovery/shoulder-surgery-exercise-guide/';
const AAOS_HIP_CONDITIONING = 'https://orthoinfo.aaos.org/en/recovery/hip-conditioning-program';
const AAOS_SPINE_CONDITIONING = 'https://orthoinfo.aaos.org/en/recovery/spine-conditioning-program?grpwebid=26DAE356';
const CUH_ELBOW_ROM = 'https://www.cuh.nhs.uk/patient-information/elbow-range-of-movement-exercises/';
const CUH_BACK_MOBILITY = 'https://www.cuh.nhs.uk/patient-information/back-mobility-exercises/';
const NHS_STRENGTH_BALANCE = 'https://www.nhsinform.scot/healthy-living/preventing-falls/keeping-well/strength-and-balance-exercises/';
const OSF_HEEL_SLIDES = 'https://healthlibrary.osfhealthcare.org/library/healthsheets/3%2CS%2C90815';

function professionalGuidance(
  exerciseId: string,
  sourceLabel: string,
  sourceUrl: string,
  whatToDo: string[],
  precautions: string[]
): RehabExerciseGuidance {
  return {
    exerciseId,
    sourceLabel: `物理治療師動作PDF + ${sourceLabel}`,
    sourceUrl,
    whatToDo,
    precautions: [
      ...precautions,
      '若疼痛、麻、頭暈或不穩明顯增加，先停止訓練並回報醫師或治療師。',
    ],
  };
}

export const rehabExerciseGuidanceCatalog: Record<string, RehabExerciseGuidance> = {
  knee_flexion: {
    exerciseId: 'knee_flexion',
    sourceLabel: 'AAOS OrthoInfo Knee Conditioning Program / OSF HealthCare Heel Slides',
    sourceUrl: OSF_HEEL_SLIDES,
    whatToDo: [
      '把腳跟慢慢往身體方向滑回來，讓膝蓋彎曲到醫師設定的角度。',
      '到達目標角度後先穩住，再慢慢把腳滑回開始位置。',
      '如果是站姿屈膝，請扶穩椅背或牆面，膝蓋保持靠近，不要快速甩動。',
    ],
    precautions: [
      '只彎到舒服且安全的範圍，不要硬壓到疼痛。',
      '動作要慢，避免突然用力或用慣性把膝蓋拉過頭。',
      '若疼痛變明顯、腫脹或卡住，先停止並回報醫師或治療師。',
    ],
  },
  knee_extension: {
    exerciseId: 'knee_extension',
    sourceLabel: 'AAOS OrthoInfo Knee Conditioning Program',
    sourceUrl: AAOS_KNEE_CONDITIONING,
    whatToDo: [
      '坐正或依治療師指定姿勢，先收緊大腿前側肌肉。',
      '慢慢把膝蓋伸直，抬到系統指定角度後穩住。',
      '完成保持秒數後，慢慢放回，不要讓腳突然掉下來。',
    ],
    precautions: [
      '不要用甩腿或衝太快的方式伸膝。',
      '伸直但不要硬鎖膝蓋，關節不舒服就立刻減少角度。',
      '如果有術後限制，請以醫師或治療師給的角度為主。',
    ],
  },
  leg_raise: {
    exerciseId: 'leg_raise',
    sourceLabel: 'AAOS OrthoInfo Knee Exercises / Knee Conditioning Program',
    sourceUrl: AAOS_KNEE_EXERCISES,
    whatToDo: [
      '先收緊大腿前側，讓膝蓋保持直線。',
      '慢慢抬腿到目標角度，停住後再慢慢放下。',
      '抬腿過程保持身體穩定，照系統提示完成每一下。',
    ],
    precautions: [
      '不要拱背、憋氣或用甩動把腿抬高。',
      '抬腿高度以醫師設定為準，不需要追求越高越好。',
      '如果腰、髖或膝蓋疼痛增加，先停止訓練。',
    ],
  },
  squat: {
    exerciseId: 'squat',
    sourceLabel: 'AAOS OrthoInfo Knee Exercises',
    sourceUrl: AAOS_KNEE_EXERCISES,
    whatToDo: [
      '背部靠牆，雙腳往前站，慢慢往下滑到指定角度。',
      '保持腹部微收，膝蓋朝腳尖方向，不要左右晃。',
      '達到目標角度後停住，再慢慢滑回站姿。',
    ],
    precautions: [
      '臀部不要低於膝蓋，膝蓋也不要往前超過腳尖太多。',
      '不要彎腰往前倒，頭、背、臀盡量貼著牆。',
      '膝蓋疼痛或不穩時先停止，等醫師確認後再做。',
    ],
  },
  shoulder_abduction: {
    exerciseId: 'shoulder_abduction',
    sourceLabel: 'AAOS OrthoInfo Shoulder Surgery Exercise Guide',
    sourceUrl: AAOS_SHOULDER_SURGERY,
    whatToDo: [
      '手肘保持伸直，手臂從身體側邊慢慢抬起。',
      '手掌朝下，抬到醫師設定角度後穩住。',
      '完成後慢慢放回身體旁邊。',
    ],
    precautions: [
      '不要聳肩，也不要身體歪一邊代償。',
      '肩部術後患者請先確認這個動作適合目前階段。',
      '如果肩膀有刺痛或卡住感，先停止並回報。',
    ],
  },
  shoulder_flexion: {
    exerciseId: 'shoulder_flexion',
    sourceLabel: 'AAOS OrthoInfo Shoulder Surgery Exercise Guide',
    sourceUrl: AAOS_SHOULDER_SURGERY,
    whatToDo: [
      '手肘保持伸直，手臂從身體前方慢慢往上抬。',
      '以拇指帶方向，抬到目標角度後穩定停住。',
      '放下時同樣慢慢控制，不要讓手臂突然落下。',
    ],
    precautions: [
      '不要聳肩或把肩胛骨整個抬起來代償。',
      '不要硬推到痛的位置，角度以處方設定為準。',
      '若醫師限制肩膀活動角度，請依醫囑調整。',
    ],
  },
  elbow_flexion: {
    exerciseId: 'elbow_flexion',
    sourceLabel: 'Cambridge University Hospitals NHS Elbow Range of Movement Exercises',
    sourceUrl: CUH_ELBOW_ROM,
    whatToDo: [
      '手臂放鬆，慢慢彎曲手肘，讓手掌往肩膀方向靠近。',
      '需要時可以用另一隻手輕輕協助，但不要硬拉。',
      '到達目標角度後穩住，再慢慢回到開始位置。',
    ],
    precautions: [
      '動作只做到舒服範圍，不能用力壓過疼痛。',
      '肩膀和身體不要跟著轉，讓動作集中在手肘。',
      '如果運動會痛，請停止並詢問物理治療師或醫師。',
    ],
  },
  elbow_extension: {
    exerciseId: 'elbow_extension',
    sourceLabel: 'Cambridge University Hospitals NHS Elbow Range of Movement Exercises',
    sourceUrl: CUH_ELBOW_ROM,
    whatToDo: [
      '從手肘彎曲的位置開始，慢慢把手肘伸直。',
      '伸到醫師設定角度後輕輕穩住，再慢慢回來。',
      '如果使用牆面輔助，手掌保持接觸牆面，身體慢慢往後移讓手肘伸直。',
    ],
    precautions: [
      '不要用反彈或突然推牆的方式伸直手肘。',
      '不要把手肘硬鎖到底，保持可控制的舒適範圍。',
      '疼痛、麻或術後限制不確定時，先詢問治療師。',
    ],
  },
  hip_abduction: {
    exerciseId: 'hip_abduction',
    sourceLabel: 'AAOS OrthoInfo Hip Conditioning Program',
    sourceUrl: AAOS_HIP_CONDITIONING,
    whatToDo: [
      '側躺時把要訓練的腿放在上方，下方腿微彎支撐。',
      '上方腿伸直，慢慢往上抬到設定角度後穩住。',
      '完成保持秒數後慢慢放下，休息一下再做下一次。',
    ],
    precautions: [
      '膝蓋保持直但不要鎖死。',
      '不要為了抬更高而轉動腿或扭動骨盆。',
      '如果腰部或髖部開始代償疼痛，先降低角度或停止。',
    ],
  },
  side_leg_raise: {
    exerciseId: 'side_leg_raise',
    sourceLabel: 'AAOS OrthoInfo Hip Conditioning Program',
    sourceUrl: AAOS_HIP_CONDITIONING,
    whatToDo: [
      '身體側躺或依治療師指定姿勢，身體保持一直線。',
      '上方腿慢慢往側邊抬起，停在目標角度。',
      '放下時慢慢控制，讓骨盆維持穩定。',
    ],
    precautions: [
      '不要身體往前倒或往後仰來偷抬腿。',
      '不要把腳尖轉來轉去追求更高角度。',
      '髖部、腰部或膝蓋不舒服時先停止。',
    ],
  },
  shoulder_press_band: professionalGuidance(
    'shoulder_press_band',
    'AAOS Rotator Cuff and Shoulder Conditioning Program',
    AAOS_SHOULDER_CONDITIONING,
    ['彈力帶固定後，手臂從肩膀附近慢慢往上推。', '推到醫師設定角度即可，不需要追求完全過頭。', '慢慢回到開始位置，肩膀保持放鬆。'],
    ['避免聳肩或拱腰代償。', '肩膀出現夾痛或刺痛時降低角度。']
  ),
  standing_row_band: professionalGuidance(
    'standing_row_band',
    'AAOS Rotator Cuff and Shoulder Conditioning Program',
    AAOS_SHOULDER_CONDITIONING,
    ['站穩後手肘往後拉，讓肩胛輕輕夾住。', '拉到目標角度後穩住，再慢慢放回。', '整個過程保持胸口打開、身體不後仰。'],
    ['不要用身體往後倒來拉彈力帶。', '彈力帶阻力先從輕量開始。']
  ),
  seated_row_band: professionalGuidance(
    'seated_row_band',
    'AAOS Rotator Cuff and Shoulder Conditioning Program',
    AAOS_SHOULDER_CONDITIONING,
    ['坐穩椅面，彈力帶固定在腳掌或前方。', '手肘沿身體兩側往後拉，肩胛輕輕夾住。', '慢慢回到開始位置，不要讓彈力帶突然彈回。'],
    ['坐姿保持背部挺直。', '肩膀不要往耳朵方向聳起。']
  ),
  push_up_supported: professionalGuidance(
    'push_up_supported',
    'AAOS Rotator Cuff and Shoulder Conditioning Program',
    AAOS_SHOULDER_CONDITIONING,
    ['雙手扶牆或穩固桌面，身體保持一直線。', '手肘慢慢彎曲到目標角度，再慢慢推回。', '先做扶牆版本，穩定後再由治療師決定是否進階。'],
    ['不建議一開始做地面版本。', '手腕、肩膀或胸口不適時停止。']
  ),
  biceps_curl_band: professionalGuidance(
    'biceps_curl_band',
    'AAOS Rotator Cuff and Shoulder Conditioning Program',
    AAOS_SHOULDER_CONDITIONING,
    ['上臂貼近身體，前臂慢慢往上彎。', '到達目標角度後停一下，再慢慢放下。', '動作集中在手肘，不用肩膀幫忙。'],
    ['不要甩動手臂或用身體借力。', '彈力帶阻力以能穩定控制為準。']
  ),
  overhead_triceps_extension: professionalGuidance(
    'overhead_triceps_extension',
    'AAOS Rotator Cuff and Shoulder Conditioning Program',
    AAOS_SHOULDER_CONDITIONING,
    ['上臂固定後，手肘由彎曲慢慢伸直。', '伸到設定角度後停一下，再控制回來。', '腹部輕收，避免腰往後拱。'],
    ['肩膀活動受限者先降低手臂高度。', '不要把手肘突然鎖死。']
  ),
  shoulder_lateral_raise_band: professionalGuidance(
    'shoulder_lateral_raise_band',
    'AAOS Rotator Cuff and Shoulder Conditioning Program',
    AAOS_SHOULDER_CONDITIONING,
    ['手臂從身體側邊慢慢抬起。', '抬到肩膀高度附近即可，依醫師角度停住。', '慢慢放下，保持肩膀不聳起。'],
    ['不要為了抬高而歪身體。', '肩膀疼痛時先改較低目標角度。']
  ),
  seated_marching: professionalGuidance(
    'seated_marching',
    'NHS inform Strength and Balance Exercises',
    NHS_STRENGTH_BALANCE,
    ['坐穩並保持挺胸，單腳慢慢抬起。', '抬到目標高度後穩住，再慢慢放下。', '依治療師安排可左右交替或先練單側。'],
    ['椅子要穩固，腳底不要滑。', '不要後仰或用手大力拉腿。']
  ),
  long_arc_quad: professionalGuidance(
    'long_arc_quad',
    'AAOS Knee Conditioning Program / NHS inform',
    AAOS_KNEE_CONDITIONING,
    ['坐姿把小腿慢慢伸直，感覺大腿前側出力。', '到達目標角度後保持，再慢慢放下。', '每一下都用控制完成，不追求速度。'],
    ['不要快速甩腳。', '膝蓋疼痛增加時降低角度或停止。']
  ),
  sit_to_stand: professionalGuidance(
    'sit_to_stand',
    'NHS inform Strength and Balance Exercises',
    NHS_STRENGTH_BALANCE,
    ['坐在穩固椅子上，腳收在膝蓋下方。', '慢慢站起來，再慢慢坐回去。', '需要時可先使用扶手。'],
    ['椅子不可滑動或有輪子。', '站起時頭暈或膝痛明顯要停止。']
  ),
  band_squat: professionalGuidance(
    'band_squat',
    'AAOS Knee Conditioning Program',
    AAOS_KNEE_CONDITIONING,
    ['雙腳與肩同寬，慢慢往後坐。', '到達醫師設定的膝蓋角度後停住。', '再用腳跟力量慢慢站回。'],
    ['不要彎腰往前倒。', '膝蓋不要內夾，疼痛時先減少下蹲深度。']
  ),
  split_squat_band: professionalGuidance(
    'split_squat_band',
    'AAOS Knee Conditioning Program',
    AAOS_KNEE_CONDITIONING,
    ['前後腳分站，必要時扶著椅背。', '前膝慢慢彎曲到目標角度。', '穩定後再慢慢站回。'],
    ['這是較進階動作，平衡不足者不要單獨練。', '前膝疼痛或身體晃動明顯時停止。']
  ),
  standing_hip_abduction_band: professionalGuidance(
    'standing_hip_abduction_band',
    'AAOS Hip Conditioning Program / NHS inform',
    AAOS_HIP_CONDITIONING,
    ['扶椅站穩，訓練腿往側邊慢慢抬。', '抬到目標角度後保持，骨盆維持正面。', '慢慢放回，不讓彈力帶把腿拉回。'],
    ['不要側彎身體或轉動骨盆。', '抬不高沒關係，穩定比高度重要。']
  ),
  hip_adduction_band: professionalGuidance(
    'hip_adduction_band',
    'AAOS Hip Conditioning Program',
    AAOS_HIP_CONDITIONING,
    ['扶穩後，腿從外側慢慢往身體中線收回。', '到達目標角度後停一下，再控制回去。', '骨盆保持面向前方。'],
    ['角度小也可以，避免硬拉。', '不要用身體旋轉來帶動腿。']
  ),
  standing_hip_extension_band: professionalGuidance(
    'standing_hip_extension_band',
    'AAOS Hip Conditioning Program',
    AAOS_HIP_CONDITIONING,
    ['扶椅站穩，訓練腿慢慢往後伸。', '到目標角度後停住，再慢慢回來。', 'APP版本使用慢速控制，不採用快速踢腿。'],
    ['不要讓腰往後拱。', '不要快速踢，避免拉扯或失去平衡。']
  ),
  standing_hip_flexion_band: professionalGuidance(
    'standing_hip_flexion_band',
    'NHS inform Strength and Balance Exercises',
    NHS_STRENGTH_BALANCE,
    ['扶椅站穩，腿慢慢往前抬。', '到達目標高度後停一下，再慢慢放下。', '保持身體直立，不要後仰。'],
    ['平衡不足者需旁人陪同或改坐姿踏步。', '不要用甩腿方式完成。']
  ),
  terminal_knee_extension_band: professionalGuidance(
    'terminal_knee_extension_band',
    'AAOS Knee Conditioning Program',
    AAOS_KNEE_CONDITIONING,
    ['彈力帶固定在膝後，膝蓋從微彎慢慢打直。', '大腿前側出力，終點停兩秒。', '再回到微彎起始位置。'],
    ['終末角度採保守設定，不要硬鎖膝。', '膝蓋腫痛或卡住感增加時停止。']
  ),
  hip_bridge: professionalGuidance(
    'hip_bridge',
    'AAOS Spine Conditioning Program / CUH Back Mobility Exercises',
    CUH_BACK_MOBILITY,
    ['仰躺屈膝踩地，先輕輕收腹。', '夾臀後慢慢抬起骨盆，讓肩到膝接近一直線。', '停住後慢慢放下，回到開始位置。'],
    ['不要用腰硬拱到過高。', '若下背痛增加，先停止並回報。']
  ),
};

export const fallbackRehabGuidance: RehabExerciseGuidance = {
  exerciseId: 'default',
  sourceLabel: 'AAOS OrthoInfo Exercise Safety Guidance',
  sourceUrl: AAOS_KNEE_EXERCISES,
  whatToDo: [
    '依照醫師設定的角度、組數和次數，慢慢做到目標區。',
    '到達目標角度後保持幾秒，再慢慢回到開始位置。',
    '全程看著畫面提示，不需要追求速度。',
  ],
  precautions: [
    '不要忽略疼痛；如果訓練中疼痛明顯，請先停止。',
    '不要用甩動、硬壓或突然用力完成動作。',
    '如果不確定動作是否正確，請詢問醫師或物理治療師。',
  ],
};

export function getRehabExerciseGuidance(exerciseId?: string): RehabExerciseGuidance {
  if (!exerciseId) return fallbackRehabGuidance;
  return rehabExerciseGuidanceCatalog[exerciseId] ?? fallbackRehabGuidance;
}
