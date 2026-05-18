import React from 'react';
import { motion } from 'motion/react';
import type { RehabGameConfig, RehabGameVisual } from '../data/rehabGameCatalog';

type AngleStatus = 'below' | 'achieved' | 'above';

interface RehabGamePanelProps {
  game: RehabGameConfig;
  variant?: 'side' | 'hero';
  sessionStarted: boolean;
  sessionComplete: boolean;
  isResting: boolean;
  isHolding: boolean;
  holdCountdown: number;
  holdSeconds: number;
  currentAngle: number;
  hasValidAngle: boolean;
  targetAngle: number;
  tolerance: number;
  angleStatus: AngleStatus;
  currentRep: number;
  totalReps: number;
  currentSet: number;
  totalSets: number;
  safetyStopped: boolean;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function getGameStatusText(props: RehabGamePanelProps) {
  const {
    game,
    variant = 'side',
    sessionStarted,
    sessionComplete,
    isResting,
    isHolding,
    holdCountdown,
    hasValidAngle,
    angleStatus,
    safetyStopped,
  } = props;

  if (safetyStopped) return '疼痛偏高，遊戲先暫停，等醫師或家人確認。';
  if (sessionComplete) return `完成全部關卡，${game.rewardLabel}已記錄。`;
  if (isResting) return '先休息，等等再繼續下一組。';
  if (!sessionStarted) return game.actionCue;
  if (!hasValidAngle) return '站到畫面中央，讓相機看到身體。';
  if (angleStatus === 'achieved' && isHolding) return `很好，穩住 ${holdCountdown} 秒就完成一次${game.rewardLabel}。`;
  if (angleStatus === 'achieved') return game.successCue;
  if (angleStatus === 'below') return game.adjustCue.below;
  return game.adjustCue.above;
}

function GameBall({
  color = '#F8FAFC',
  accent = '#0F172A',
  size = 30,
}: {
  color?: string;
  accent?: string;
  size?: number;
}) {
  return (
    <div
      className="relative rounded-full border-2 border-white shadow-lg"
      style={{
        width: size,
        height: size,
        background: color,
        boxShadow: '0 10px 20px rgba(15,23,42,0.22)',
      }}
    >
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ width: size * 0.38, height: size * 0.38, background: accent }}
      />
      <div
        className="absolute rounded-full"
        style={{ left: size * 0.16, top: size * 0.16, width: size * 0.23, height: size * 0.23, background: accent, opacity: 0.7 }}
      />
      <div
        className="absolute rounded-full"
        style={{ right: size * 0.16, bottom: size * 0.16, width: size * 0.23, height: size * 0.23, background: accent, opacity: 0.7 }}
      />
    </div>
  );
}

function RocketShape({ accent }: { accent: string }) {
  return (
    <div className="relative h-20 w-11">
      <div
        className="absolute left-1/2 top-0 h-0 w-0 -translate-x-1/2"
        style={{
          borderLeft: '18px solid transparent',
          borderRight: '18px solid transparent',
          borderBottom: `24px solid ${accent}`,
        }}
      />
      <div className="absolute left-1/2 top-5 h-11 w-8 -translate-x-1/2 rounded-t-full bg-white shadow-md" />
      <div className="absolute left-1/2 top-9 h-4 w-4 -translate-x-1/2 rounded-full border-2 border-sky-200 bg-sky-400" />
      <div className="absolute bottom-0 left-1 h-0 w-0 border-b-[18px] border-r-[12px] border-b-red-400 border-r-transparent" />
      <div className="absolute bottom-0 right-1 h-0 w-0 border-b-[18px] border-l-[12px] border-b-red-400 border-l-transparent" />
    </div>
  );
}

function renderScene(
  visual: RehabGameVisual,
  props: RehabGamePanelProps,
  motionLevel: number,
  progressPercent: number,
  isHero = false
) {
  const { game, angleStatus, sessionStarted, sessionComplete, isHolding, holdSeconds, holdCountdown } = props;
  const accent = game.theme.accent;
  const isLive = sessionStarted && !sessionComplete;
  const holdProgress = isHolding
    ? clamp((holdSeconds - holdCountdown + 0.4) / Math.max(1, holdSeconds), 0, 1)
    : angleStatus === 'achieved'
      ? 0.45
      : 0;

  if (visual === 'soccer') {
    const ballSize = isHero ? 58 : 30;
    return (
      <div className="relative h-full overflow-hidden rounded-2xl bg-gradient-to-b from-sky-200 to-emerald-300">
        <div
          className="absolute left-1/2 -translate-x-1/2 rounded-t-[2rem] border-4 border-white bg-white/20"
          style={{
            top: isHero ? 48 : 16,
            width: isHero ? 300 : 128,
            height: isHero ? 132 : 64,
          }}
        >
          <div className="grid h-full grid-cols-4 grid-rows-3 opacity-35">
            {Array.from({ length: 12 }).map((_, index) => (
              <div key={index} className="border border-white" />
            ))}
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 bg-emerald-500" style={{ height: isHero ? 150 : 64 }} />
        <motion.div
          className="absolute left-1/2"
          style={{ bottom: isHero ? 76 : 32 }}
          animate={{
            x: angleStatus === 'below' ? (isHero ? -92 : -30) : angleStatus === 'above' ? (isHero ? 92 : 30) : 0,
            y: (isHero ? -250 : -64) * holdProgress - (isHero ? 44 : 16) * motionLevel,
            scale: angleStatus === 'achieved' ? 1.12 : 1,
          }}
          transition={{ type: 'spring', stiffness: 150, damping: 16 }}
        >
          <GameBall size={ballSize} />
        </motion.div>
        <div
          className="absolute rounded-full bg-white/70"
          style={{
            left: isHero ? 72 : 24,
            right: isHero ? 72 : 24,
            bottom: isHero ? 32 : 16,
            height: isHero ? 16 : 12,
          }}
        >
          <div className="h-full rounded-full" style={{ width: `${progressPercent}%`, background: accent }} />
        </div>
      </div>
    );
  }

  if (visual === 'balloon') {
    return (
      <div className="relative h-full overflow-hidden rounded-2xl bg-gradient-to-b from-sky-200 to-white">
        <div className="absolute left-5 top-6 h-8 w-20 rounded-full bg-white/80" />
        <div className="absolute right-4 top-11 h-7 w-24 rounded-full bg-white/70" />
        <motion.div
          className="absolute left-1/2 bottom-5 -translate-x-1/2"
          animate={{ y: -78 * motionLevel, scale: angleStatus === 'achieved' ? 1.06 : 1 }}
          transition={{ type: 'spring', stiffness: 120, damping: 18 }}
        >
          <div className="h-20 w-16 rounded-[45%] border-4 border-white shadow-md" style={{ background: accent }} />
          <div className="mx-auto h-8 w-px bg-slate-400" />
          <div className="mx-auto h-5 w-10 rounded-md bg-amber-700" />
        </motion.div>
        <div className="absolute bottom-4 left-5 right-5 h-2 rounded-full bg-sky-100">
          <div className="h-full rounded-full bg-sky-500" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>
    );
  }

  if (visual === 'windmill') {
    const spinning = angleStatus === 'achieved' && isLive;
    return (
      <div className="relative h-full overflow-hidden rounded-2xl bg-gradient-to-b from-cyan-100 to-lime-200">
        <div className="absolute inset-x-0 bottom-0 h-12 bg-lime-500" />
        <div className="absolute left-1/2 bottom-9 h-24 w-3 -translate-x-1/2 rounded-full bg-slate-200" />
        <motion.div
          className="absolute left-1/2 top-10 h-20 w-20 -translate-x-1/2"
          animate={{ rotate: spinning ? 360 : motionLevel * 120 }}
          transition={{ repeat: spinning ? Infinity : 0, duration: spinning ? 1.2 : 0.5, ease: 'linear' }}
        >
          {[0, 90, 180, 270].map((rotate) => (
            <div
              key={rotate}
              className="absolute left-1/2 top-1/2 h-9 w-4 origin-bottom rounded-full bg-white shadow-sm"
              style={{ transform: `translate(-50%, -100%) rotate(${rotate}deg)`, transformOrigin: '50% 100%' }}
            />
          ))}
        </motion.div>
        <div className="absolute left-1/2 top-[72px] h-6 w-6 -translate-x-1/2 rounded-full border-4 border-white" style={{ background: accent }} />
        <div className="absolute bottom-4 left-5 right-5 h-2 rounded-full bg-white/70">
          <div className="h-full rounded-full" style={{ width: `${progressPercent}%`, background: accent }} />
        </div>
      </div>
    );
  }

  if (visual === 'starReach') {
    return (
      <div className="relative h-full overflow-hidden rounded-2xl bg-gradient-to-b from-indigo-950 to-indigo-500">
        {Array.from({ length: 7 }).map((_, index) => (
          <motion.div
            key={index}
            className="absolute h-3 w-3 rotate-45 rounded-sm bg-yellow-200"
            style={{ left: `${14 + index * 12}%`, top: `${18 + (index % 3) * 17}%` }}
            animate={{ opacity: progressPercent / 100 > index / 7 ? 1 : 0.35, scale: angleStatus === 'achieved' ? [1, 1.25, 1] : 1 }}
            transition={{ duration: 0.8, repeat: angleStatus === 'achieved' ? Infinity : 0 }}
          />
        ))}
        <motion.div
          className="absolute bottom-6 left-1/2 h-16 w-5 origin-bottom -translate-x-1/2 rounded-full bg-white"
          animate={{ rotate: -56 + motionLevel * 70 }}
          transition={{ type: 'spring', stiffness: 120, damping: 16 }}
        >
          <div className="absolute -top-4 left-1/2 h-6 w-6 -translate-x-1/2 rounded-full" style={{ background: accent }} />
        </motion.div>
        <div className="absolute bottom-4 left-5 right-5 h-2 rounded-full bg-white/25">
          <div className="h-full rounded-full" style={{ width: `${progressPercent}%`, background: accent }} />
        </div>
      </div>
    );
  }

  if (visual === 'basketCharge') {
    return (
      <div className="relative h-full overflow-hidden rounded-2xl bg-gradient-to-b from-orange-100 to-amber-200">
        <div className="absolute right-7 top-8 h-16 w-3 rounded-full bg-slate-500" />
        <div className="absolute right-12 top-9 h-9 w-12 rounded-sm border-4 border-white bg-white/30" />
        <div className="absolute right-11 top-[76px] h-3 w-14 rounded-full border-4 border-orange-600" />
        <motion.div
          className="absolute left-9 bottom-8"
          animate={{ x: motionLevel * 126, y: -Math.sin(motionLevel * Math.PI) * 72 }}
          transition={{ type: 'spring', stiffness: 120, damping: 18 }}
        >
          <GameBall color="#F97316" accent="#7C2D12" />
        </motion.div>
        <div className="absolute bottom-4 left-5 right-5 h-2 rounded-full bg-white/70">
          <div className="h-full rounded-full" style={{ width: `${progressPercent}%`, background: '#EA580C' }} />
        </div>
      </div>
    );
  }

  if (visual === 'bowling') {
    return (
      <div className="relative h-full overflow-hidden rounded-2xl bg-gradient-to-b from-slate-200 to-slate-500">
        <div className="absolute left-1/2 top-4 h-6 w-28 -translate-x-1/2 rounded-b-3xl bg-white/70" />
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="absolute top-8 h-8 w-3 rounded-full bg-white shadow"
            style={{ left: `${38 + index * 6}%` }}
          />
        ))}
        <div className="absolute bottom-5 left-5 right-5 h-24 rounded-t-[2rem] bg-white/20" />
        <motion.div
          className="absolute bottom-8 left-8"
          animate={{ x: motionLevel * 168, rotate: motionLevel * 720 }}
          transition={{ type: 'spring', stiffness: 100, damping: 16 }}
        >
          <GameBall color="#312E81" accent="#C7D2FE" />
        </motion.div>
        <div className="absolute bottom-4 left-5 right-5 h-2 rounded-full bg-white/50">
          <div className="h-full rounded-full" style={{ width: `${progressPercent}%`, background: accent }} />
        </div>
      </div>
    );
  }

  if (visual === 'rocket') {
    return (
      <div className="relative h-full overflow-hidden rounded-2xl bg-gradient-to-b from-sky-950 to-sky-500">
        <div className="absolute inset-x-0 bottom-0 h-10 bg-slate-700" />
        <motion.div
          className="absolute left-1/2 bottom-8 -translate-x-1/2"
          animate={{ y: -82 * motionLevel }}
          transition={{ type: 'spring', stiffness: 120, damping: 18 }}
        >
          <RocketShape accent={accent} />
          {angleStatus === 'achieved' && (
            <motion.div
              className="mx-auto mt-1 h-10 w-5 rounded-b-full bg-orange-400"
              animate={{ scaleY: [0.65, 1.05, 0.65], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 0.45, repeat: Infinity }}
            />
          )}
        </motion.div>
        <div className="absolute bottom-4 left-5 right-5 h-2 rounded-full bg-white/25">
          <div className="h-full rounded-full" style={{ width: `${progressPercent}%`, background: accent }} />
        </div>
      </div>
    );
  }

  if (visual === 'elevator') {
    return (
      <div className="relative h-full overflow-hidden rounded-2xl bg-gradient-to-b from-slate-200 to-teal-300">
        <div className="absolute left-1/2 top-6 h-28 w-20 -translate-x-1/2 rounded-xl border-4 border-slate-500 bg-white/35" />
        <motion.div
          className="absolute left-1/2 h-10 w-28 -translate-x-1/2 rounded-xl border-4 border-white shadow-lg"
          style={{ background: accent }}
          animate={{ top: 36 + motionLevel * 66 }}
          transition={{ type: 'spring', stiffness: 120, damping: 18 }}
        >
          <div className="mt-2 text-center text-sm font-black text-slate-900">SAFE</div>
        </motion.div>
        <div className="absolute bottom-4 left-5 right-5 h-2 rounded-full bg-white/70">
          <div className="h-full rounded-full" style={{ width: `${progressPercent}%`, background: '#0F766E' }} />
        </div>
      </div>
    );
  }

  if (visual === 'gate') {
    const open = motionLevel * 42;
    return (
      <div className="relative h-full overflow-hidden rounded-2xl bg-gradient-to-b from-emerald-100 to-teal-400">
        <div className="absolute left-1/2 top-8 h-24 w-36 -translate-x-1/2 overflow-hidden rounded-t-[2rem] border-4 border-teal-900 bg-teal-950">
          <motion.div
            className="absolute bottom-0 left-0 h-full w-1/2 border-r border-white/20"
            style={{ background: accent }}
            animate={{ x: -open }}
          />
          <motion.div
            className="absolute bottom-0 right-0 h-full w-1/2 border-l border-white/20"
            style={{ background: accent }}
            animate={{ x: open }}
          />
        </div>
        <div className="absolute bottom-5 left-1/2 h-8 w-44 -translate-x-1/2 rounded-full bg-teal-800/45" />
        <div className="absolute bottom-4 left-5 right-5 h-2 rounded-full bg-white/70">
          <div className="h-full rounded-full" style={{ width: `${progressPercent}%`, background: accent }} />
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full overflow-hidden rounded-2xl bg-gradient-to-b from-fuchsia-100 to-violet-400">
      <div className="absolute left-4 right-4 top-16 flex items-end justify-between">
        {Array.from({ length: 7 }).map((_, index) => {
          const filled = progressPercent >= ((index + 1) / 7) * 100;
          return (
            <motion.div
              key={index}
              className="h-8 flex-1 rounded-t-xl border-2 border-white"
              style={{
                marginLeft: index === 0 ? 0 : -2,
                background: filled || motionLevel > index / 7 ? accent : 'rgba(255,255,255,0.35)',
                transform: `translateY(${Math.sin(index) * 8}px)`,
              }}
              animate={{ y: angleStatus === 'achieved' ? [0, -4, 0] : 0 }}
              transition={{ duration: 0.8, repeat: angleStatus === 'achieved' ? Infinity : 0, delay: index * 0.05 }}
            />
          );
        })}
      </div>
      <motion.div
        className="absolute bottom-9 left-7 h-9 w-9 rounded-full border-4 border-white"
        style={{ background: '#FFFFFF' }}
        animate={{ x: motionLevel * 155 }}
        transition={{ type: 'spring', stiffness: 120, damping: 18 }}
      />
      <div className="absolute bottom-4 left-5 right-5 h-2 rounded-full bg-white/65">
        <div className="h-full rounded-full" style={{ width: `${progressPercent}%`, background: accent }} />
      </div>
    </div>
  );
}

export function RehabGamePanel(props: RehabGamePanelProps) {
  const {
    game,
    sessionStarted,
    sessionComplete,
    currentAngle,
    hasValidAngle,
    targetAngle,
    tolerance,
    angleStatus,
    currentRep,
    totalReps,
    currentSet,
    totalSets,
  } = props;

  const isHero = variant === 'hero';
  const totalActions = Math.max(1, totalReps * totalSets);
  const completedActions = sessionComplete
    ? totalActions
    : clamp((Math.max(1, currentSet) - 1) * totalReps + currentRep, 0, totalActions);
  const progressPercent = Math.round((completedActions / totalActions) * 100);
  const deviation = hasValidAngle ? Math.abs(currentAngle - targetAngle) : tolerance * 2;
  const angleQuality = hasValidAngle ? clamp(1 - deviation / Math.max(1, tolerance * 2), 0, 1) : 0;
  const motionLevel =
    sessionComplete
      ? 1
      : !sessionStarted
        ? 0.18
        : angleStatus === 'achieved'
          ? 1
          : clamp(angleQuality, 0.08, 0.82);
  const statusText = getGameStatusText(props);

  return (
    <section
      className={`${isHero ? 'h-full min-h-0 rounded-[2rem] border p-5 sm:p-6 flex flex-col shadow-2xl' : 'border-b p-4'}`}
      style={{
        borderColor: isHero ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.06)',
        background: `linear-gradient(145deg, ${game.theme.from}22, ${game.theme.to}18)`,
      }}
      aria-label={`${game.title}復健小遊戲`}
    >
      <div className={`${isHero ? 'mb-4' : 'mb-3'} flex items-start justify-between gap-3`}>
        <div>
          <div
            className={`${isHero ? 'text-sm' : 'text-xs'} font-black uppercase tracking-[0.18em]`}
            style={{ color: 'rgba(255,255,255,0.45)' }}
          >
            Rehab Game
          </div>
          <h3 className={`${isHero ? 'text-4xl sm:text-5xl' : 'text-xl'} mt-1 font-black leading-tight text-white`}>
            {game.title}
          </h3>
          <p
            className={`${isHero ? 'text-xl' : 'text-sm'} mt-1 font-bold leading-snug`}
            style={{ color: 'rgba(255,255,255,0.62)' }}
          >
            {game.levelName}
          </p>
        </div>
        <div
          className={`${isHero ? 'rounded-3xl px-5 py-3 text-2xl' : 'rounded-2xl px-3 py-2 text-sm'} text-center font-black shadow-sm`}
          style={{ background: game.theme.accentSoft, color: game.theme.accent }}
        >
          {progressPercent}%
        </div>
      </div>

      <div className={isHero ? 'min-h-0 flex-1' : 'h-[172px]'}>
        {renderScene(game.visual, props, motionLevel, progressPercent, isHero)}
      </div>

      <div
        className={`${isHero ? 'mt-5 rounded-3xl p-5' : 'mt-3 rounded-2xl p-3'} border border-white/10`}
        style={{ background: 'rgba(15,23,42,0.34)' }}
      >
        <p className={`${isHero ? 'text-2xl' : 'text-base'} font-black leading-snug`} style={{ color: game.theme.accent }}>
          {statusText}
        </p>
        <p
          className={`${isHero ? 'mt-2 text-base' : 'mt-1 text-xs'} font-semibold leading-relaxed`}
          style={{ color: 'rgba(255,255,255,0.62)' }}
        >
          {game.safetyCue}
        </p>
      </div>
    </section>
  );
}
