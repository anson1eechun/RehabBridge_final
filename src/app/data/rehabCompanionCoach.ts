export type RehabCoachEvent =
  | 'start'
  | 'achieved'
  | 'tooLow'
  | 'tooHigh'
  | 'repComplete'
  | 'setComplete'
  | 'restDone'
  | 'pause'
  | 'resume'
  | 'complete';

export interface RehabCoachContext {
  exerciseName: string;
  bodyArea?: string;
  targetAngle: number;
  currentAngle?: number;
  deviation?: number;
  holdSeconds: number;
  currentRep: number;
  totalReps: number;
  currentSet: number;
  totalSets: number;
  completedSet?: number;
  nextSet?: number;
  restSeconds?: number;
  score?: number;
  avgAngle?: number;
  maxAngle?: number;
  durationMinutes?: number;
  stabilityPercent?: number | null;
}

const pick = (lines: string[]) => lines[Math.floor(Math.random() * lines.length)] ?? lines[0] ?? '';

function getBodyCue(ctx: RehabCoachContext, direction: 'low' | 'high') {
  const name = `${ctx.exerciseName}${ctx.bodyArea ?? ''}`;
  if (name.includes('膝')) {
    return direction === 'low' ? '膝蓋再彎一點點' : '膝蓋先放鬆一點';
  }
  if (name.includes('肩')) {
    return direction === 'low' ? '手臂再慢慢抬高一點' : '肩膀放輕鬆，手臂收回一點';
  }
  if (name.includes('肘') || name.includes('手')) {
    return direction === 'low' ? '手肘再多彎一點' : '手肘先不要彎太深';
  }
  if (name.includes('髖') || name.includes('腿')) {
    return direction === 'low' ? '腿再慢慢打開一點' : '腿先收回一點，不要硬撐';
  }
  return direction === 'low' ? '再靠近目標一點點' : '先收一點，保持舒服';
}

function formatDeviation(ctx: RehabCoachContext) {
  if (ctx.deviation == null) return '';
  return `差 ${Math.abs(Math.round(ctx.deviation))} 度`;
}

export function buildRehabCoachLine(event: RehabCoachEvent, ctx: RehabCoachContext) {
  switch (event) {
    case 'start':
      return pick([
        `我們開始 ${ctx.exerciseName}，慢慢來，我會看著角度陪你做。`,
        `準備好了就開始，今天先把動作品質顧好，不急著快。`,
        `好，第一組開始。你照自己的節奏，我會提醒你角度。`,
      ]);
    case 'achieved':
      return pick([
        `很好，角度到位，先穩穩停 ${ctx.holdSeconds} 秒。`,
        `這個位置很漂亮，保持住，呼吸不要憋住。`,
        `對，就是這裡。穩定停一下，身體記住這個感覺。`,
      ]);
    case 'tooLow':
      return pick([
        `${getBodyCue(ctx, 'low')}，${formatDeviation(ctx)}就到了。`,
        `再慢慢靠近目標，不用急，差一點點而已。`,
        `${getBodyCue(ctx, 'low')}，速度放慢會更穩。`,
      ]);
    case 'tooHigh':
      return pick([
        `${getBodyCue(ctx, 'high')}，安全比硬撐重要。`,
        `有點超過了，收回一點，讓動作舒服一點。`,
        `很好，有做到，但先不要衝太多，回到目標附近。`,
      ]);
    case 'repComplete':
      return pick([
        `第 ${ctx.currentRep} 下完成，很穩。`,
        `第 ${ctx.currentRep} 下好了，照這個節奏繼續。`,
        `漂亮，完成 ${ctx.currentRep}/${ctx.totalReps} 下。`,
      ]);
    case 'setComplete':
      return pick([
        `第 ${ctx.completedSet} 組完成，先休息 ${ctx.restSeconds} 秒，等等再做第 ${ctx.nextSet} 組。`,
        `這組做完了，肩膀和腿都放鬆一下，${ctx.restSeconds} 秒後繼續。`,
        `很好，第 ${ctx.completedSet} 組收工。現在先喘口氣，不用馬上開始。`,
      ]);
    case 'restDone':
      return pick([
        `休息好了，我們接著第 ${ctx.currentSet} 組，還是一樣慢慢做。`,
        `可以準備下一組了，先站穩，再開始動作。`,
        `下一組開始前先調整呼吸，覺得舒服再動。`,
      ]);
    case 'pause':
      return pick([
        '好，先暫停。身體有不舒服就先休息。',
        '先停一下沒關係，復健重點是穩定，不是硬撐。',
        '暫停了，調整好呼吸再繼續。',
      ]);
    case 'resume':
      return pick([
        '我們繼續，慢慢回到剛剛的節奏。',
        '好，重新開始偵測。先站穩，再做下一下。',
        '可以繼續了，動作放慢一點會更穩。',
      ]);
    case 'complete': {
      const stability =
        ctx.stabilityPercent == null
          ? '這次已經建立新的訓練紀錄。'
          : ctx.stabilityPercent >= 0
            ? `比上次穩定 ${ctx.stabilityPercent}%。`
            : `這次比上次波動多 ${Math.abs(ctx.stabilityPercent)}%，下次我們放慢一點。`;
      return pick([
        `今天完成 ${ctx.totalSets} 組，平均角度 ${ctx.avgAngle ?? '--'} 度，最高 ${ctx.maxAngle ?? '--'} 度，${stability}`,
        `練習完成。今天分數 ${ctx.score ?? '--'} 分，完成 ${ctx.totalSets} 組 ${ctx.totalReps} 下，${stability}`,
        `辛苦了，今天的 ${ctx.exerciseName} 完成了。你有把動作做完，這就是很重要的進步。${stability}`,
      ]);
    }
    default:
      return '慢慢來，我會陪你看角度。';
  }
}

export function getLocalAiCoachLabel() {
  const enabled = import.meta.env.VITE_LOCAL_AI_COACH === 'ollama';
  const model = import.meta.env.VITE_LOCAL_AI_MODEL || 'gemma';
  return enabled ? `本機 AI：${model}` : '智慧陪練';
}

export async function requestLocalAiCoachLine(
  event: RehabCoachEvent,
  ctx: RehabCoachContext
) {
  if (import.meta.env.VITE_LOCAL_AI_COACH !== 'ollama') return null;

  const endpoint = import.meta.env.VITE_LOCAL_AI_ENDPOINT || 'http://127.0.0.1:11434/api/generate';
  const model = import.meta.env.VITE_LOCAL_AI_MODEL || 'gemma';

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        stream: false,
        prompt: [
          '你是一位溫柔、簡短、專業的居家復健陪練。',
          '請用繁體中文，回覆一句 35 字以內的鼓勵或提醒。',
          '不要使用表情符號，不要給醫療診斷，不要叫患者硬撐。',
          `事件：${event}`,
          `動作：${ctx.exerciseName}`,
          `目標角度：${ctx.targetAngle}`,
          `目前角度：${ctx.currentAngle ?? '未知'}`,
          `進度：第 ${ctx.currentSet}/${ctx.totalSets} 組，第 ${ctx.currentRep}/${ctx.totalReps} 下`,
        ].join('\n'),
      }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    const text = typeof data.response === 'string' ? data.response.trim() : '';
    return text.slice(0, 80) || null;
  } catch {
    return null;
  }
}
