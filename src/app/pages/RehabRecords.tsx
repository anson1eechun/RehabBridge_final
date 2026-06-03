// ============================================================
// RehabRecords — 長者端「復健紀錄」獨立頁
// 接真實 sessionStore / guidedSessionStore 資料，大字、易讀。
// 從主頁「復健紀錄」功能格進入。
// ============================================================
import React from 'react';
import { useNavigate } from 'react-router';
import {
  Activity, Flame, Trophy, CalendarDays, Star, Timer, Dumbbell,
} from 'lucide-react';

import { mockPatients, mockExercises } from '../data/mockData';
import { useSessionRecords } from '../data/sessionStore';
import { useGuidedSessionRecords } from '../data/guidedSessionStore';
import { buildProgressSummary, getTodayIsoDate, usePatientProgress } from '../data/progressStore';
import { ElderPageShell, ElderTopBar, SectionCard } from '../components/elderly/ElderlyKit';
import { ELDER_COLORS } from '../components/elderly/tokens';

const PATIENT = mockPatients[0];
const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

const exerciseName = (id: string) => mockExercises.find((e) => e.id === id)?.name ?? id;

const pad = (n: number) => String(n).padStart(2, '0');
const toIso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const formatMonthDay = (iso: string) => {
  const [, m, d] = iso.split('-');
  return `${Number(m)}月${Number(d)}日`;
};
const weekdayOf = (iso: string) => WEEKDAYS[new Date(`${iso}T00:00:00`).getDay()];

interface StatCardProps {
  icon: typeof Activity;
  value: string;
  label: string;
  tone: 'primary' | 'amber' | 'rose' | 'blue';
}
function StatCard({ icon: Icon, value, label, tone }: StatCardProps) {
  const palette = {
    primary: { bg: ELDER_COLORS.primarySoft, fg: ELDER_COLORS.primaryDark },
    amber: { bg: ELDER_COLORS.amberSoft, fg: ELDER_COLORS.amber },
    rose: { bg: '#FBE7EA', fg: '#B23A48' },
    blue: { bg: '#E2EEFB', fg: '#1E63A8' },
  }[tone];
  return (
    <div className="flex items-center gap-3 rounded-2xl p-4"
      style={{ background: palette.bg, border: `1px solid ${ELDER_COLORS.border}` }}>
      <span className="flex h-12 w-12 items-center justify-center rounded-xl"
        style={{ background: '#fff', color: palette.fg }}>
        <Icon size={26} strokeWidth={2.4} />
      </span>
      <span className="leading-tight">
        <span className="block font-black" style={{ fontSize: 26, color: palette.fg }}>{value}</span>
        <span className="block font-bold" style={{ fontSize: 15, color: ELDER_COLORS.inkSoft }}>{label}</span>
      </span>
    </div>
  );
}

export default function RehabRecords() {
  const navigate = useNavigate();
  const sessionRecords = useSessionRecords();
  const guidedSessionRecords = useGuidedSessionRecords();
  const progress = usePatientProgress(PATIENT.id);

  const angleSessions = sessionRecords.filter((s) => s.patientId === PATIENT.id);
  const guidedSessions = guidedSessionRecords.filter((s) => s.patientId === PATIENT.id);
  const summary = buildProgressSummary(progress, angleSessions);

  // 最近紀錄（角度 + 引導合併）
  const recent = [
    ...angleSessions.map((s) => ({
      key: s.id, date: s.date, name: exerciseName(s.exerciseId),
      kind: 'angle' as const, score: s.score, maxAngle: s.maxAngle,
    })),
    ...guidedSessions.map((s) => ({
      key: s.id, date: s.date, name: exerciseName(s.exerciseId),
      kind: 'guided' as const, reps: s.completedReps, sets: s.completedSets,
    })),
  ].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 12);

  // 本週 7 天訓練點
  const today = getTodayIsoDate();
  const trainedDates = new Set([...angleSessions, ...guidedSessions].map((s) => s.date));
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(`${today}T00:00:00`);
    d.setDate(d.getDate() - (6 - i));
    const iso = toIso(d);
    return { iso, weekday: WEEKDAYS[d.getDay()], trained: trainedDates.has(iso), isToday: iso === today };
  });

  return (
    <ElderPageShell>
      <ElderTopBar title="復健紀錄" subtitle="看我的進步" onBack={() => navigate('/patient')} />

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-6 pb-10 pt-5">

        {/* ── 數字總覽 ── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard icon={Activity} value={`${summary.totalTrainingSessions}`} label="累計訓練次數" tone="primary" />
          <StatCard icon={Flame} value={`${summary.trainingStreak.days} 天`} label="連續天數" tone="amber" />
          <StatCard icon={Trophy} value={`${summary.bestScore}`} label="最佳分數" tone="rose" />
          <StatCard icon={CalendarDays} value={`${summary.completedTrainingDays} 天`} label="累計訓練天數" tone="blue" />
        </div>

        <div className="grid items-start gap-5 lg:grid-cols-[1fr_1.3fr]">
        {/* ── 本週訓練 ── */}
        <SectionCard title="這一週" icon={CalendarDays}>
          <div className="flex justify-between gap-1.5">
            {last7.map((d) => (
              <div key={d.iso} className="flex flex-1 flex-col items-center gap-2">
                <span className="font-bold" style={{ fontSize: 15, color: ELDER_COLORS.inkSoft }}>{d.weekday}</span>
                <span className="flex items-center justify-center rounded-full font-black"
                  style={{
                    width: 40, height: 40, fontSize: 18,
                    background: d.trained ? ELDER_COLORS.primary : ELDER_COLORS.surfaceSoft,
                    color: d.trained ? '#fff' : ELDER_COLORS.inkFaint,
                    border: `2px solid ${d.isToday ? ELDER_COLORS.amber : (d.trained ? ELDER_COLORS.primary : ELDER_COLORS.border)}`,
                  }}>
                  {d.trained ? '✓' : ''}
                </span>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* ── 最近紀錄 ── */}
        <SectionCard title="最近的訓練" icon={Star}>
          {recent.length === 0 ? (
            <p className="py-6 text-center font-bold" style={{ fontSize: 19, color: ELDER_COLORS.inkSoft }}>
              還沒有紀錄，今天開始第一次訓練吧！
            </p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {recent.map((r) => (
                <li key={r.key} className="flex items-center gap-3 rounded-2xl px-4"
                  style={{ minHeight: 68, background: ELDER_COLORS.surfaceSoft, border: `1px solid ${ELDER_COLORS.border}` }}>
                  <span className="flex flex-col items-center justify-center rounded-xl shrink-0"
                    style={{ width: 56, height: 50, background: '#fff', border: `1px solid ${ELDER_COLORS.border}` }}>
                    <span className="font-black leading-none" style={{ fontSize: 17, color: ELDER_COLORS.primaryDark }}>
                      {formatMonthDay(r.date)}
                    </span>
                    <span className="font-bold leading-none" style={{ fontSize: 12, color: ELDER_COLORS.inkFaint, marginTop: 2 }}>
                      週{weekdayOf(r.date)}
                    </span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-black" style={{ fontSize: 19, color: ELDER_COLORS.ink }}>{r.name}</span>
                    <span className="flex items-center gap-1.5 font-bold" style={{ fontSize: 14, color: ELDER_COLORS.inkSoft }}>
                      {r.kind === 'angle'
                        ? <><Activity size={16} /> 最大角度 {r.maxAngle}°</>
                        : <><Dumbbell size={16} /> 完成 {r.sets} 組 {r.reps} 下</>}
                    </span>
                  </span>
                  {r.kind === 'angle' ? (
                    <span className="flex flex-col items-center rounded-xl px-3 py-1 shrink-0"
                      style={{ background: ELDER_COLORS.primarySoft }}>
                      <span className="font-black leading-none" style={{ fontSize: 22, color: ELDER_COLORS.primaryDark }}>{r.score}</span>
                      <span className="font-bold" style={{ fontSize: 12, color: ELDER_COLORS.primaryDark }}>分</span>
                    </span>
                  ) : (
                    <span className="flex h-9 items-center gap-1 rounded-full px-3 font-black shrink-0"
                      style={{ background: ELDER_COLORS.primarySoft, color: ELDER_COLORS.primaryDark, fontSize: 15 }}>
                      <Timer size={16} /> 完成
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
        </div>
      </div>
    </ElderPageShell>
  );
}
