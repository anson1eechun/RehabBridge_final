// ============================================================
// 長者端共用 UI 元件（設計系統）
// 大字、高對比、大點擊區、溫暖親和。所有長者頁面共用。
// ============================================================
import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, type LucideIcon } from 'lucide-react';
import { ELDER_COLORS, TILE_THEMES, type TileThemeKey } from './tokens';

// ── 頁面外框：暖奶油底 + 安全區 + 可捲動 ─────────────────────
interface ElderPageShellProps {
  children: React.ReactNode;
  className?: string;
}

export function ElderPageShell({ children, className = '' }: ElderPageShellProps) {
  return (
    <div
      className={`min-h-full w-full ${className}`}
      style={{
        background: `linear-gradient(180deg, ${ELDER_COLORS.pageBg} 0%, #FFFDF9 100%)`,
        color: ELDER_COLORS.ink,
      }}
    >
      {children}
    </div>
  );
}

// ── 頂部列：返回 + 標題 +（可選）右側動作 ────────────────────
interface ElderTopBarProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
}

export function ElderTopBar({ title, subtitle, onBack, right }: ElderTopBarProps) {
  return (
    <div
      className="sticky top-0 z-30 flex items-center gap-3 px-5 pb-4"
      style={{
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1rem)',
        background: 'rgba(251, 244, 234, 0.92)',
        backdropFilter: 'blur(8px)',
        borderBottom: `1px solid ${ELDER_COLORS.border}`,
      }}
    >
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          aria-label="返回上一頁"
          className="flex items-center gap-2 h-14 pl-3 pr-5 rounded-full font-bold shrink-0 transition-transform active:scale-95 focus:outline-none focus-visible:ring-4"
          style={{
            background: ELDER_COLORS.surface,
            color: ELDER_COLORS.primaryDark,
            border: `2px solid ${ELDER_COLORS.border}`,
            fontSize: 19,
          }}
        >
          <ArrowLeft size={26} strokeWidth={2.6} />
          返回
        </button>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="truncate font-black leading-tight" style={{ fontSize: 26 }}>
          {title}
        </h1>
        {subtitle && (
          <p className="truncate font-bold" style={{ fontSize: 16, color: ELDER_COLORS.inkSoft }}>
            {subtitle}
          </p>
        )}
      </div>
      {right}
    </div>
  );
}

// ── 超大主按鈕（開始今天的運動）─────────────────────────────
interface PrimaryCTAProps {
  label: string;
  sublabel?: string;
  icon?: LucideIcon;
  onClick: () => void;
  disabled?: boolean;
  ariaLabel?: string;
}

export function PrimaryCTA({
  label,
  sublabel,
  icon: Icon,
  onClick,
  disabled = false,
  ariaLabel,
}: PrimaryCTAProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel ?? label}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      className="w-full flex items-center justify-center gap-4 rounded-[28px] font-black text-white shadow-lg focus:outline-none focus-visible:ring-4 disabled:opacity-60"
      style={{
        minHeight: 76,
        padding: '1rem 1.5rem',
        background: disabled
          ? '#B9C5C0'
          : `linear-gradient(135deg, ${ELDER_COLORS.primary} 0%, ${ELDER_COLORS.primaryDark} 100%)`,
        boxShadow: disabled ? 'none' : '0 12px 28px rgba(14, 122, 107, 0.35)',
      }}
    >
      {Icon && (
        <span
          className="flex items-center justify-center rounded-full"
          style={{ width: 48, height: 48, background: 'rgba(255,255,255,0.2)' }}
        >
          <Icon size={30} strokeWidth={2.6} />
        </span>
      )}
      <span className="flex flex-col items-start leading-tight">
        <span style={{ fontSize: 25 }}>{label}</span>
        {sublabel && (
          <span style={{ fontSize: 15, fontWeight: 700, opacity: 0.92 }}>{sublabel}</span>
        )}
      </span>
    </motion.button>
  );
}

// ── 大功能格（回憶/紀錄/聊天/成就）──────────────────────────
interface FeatureTileProps {
  theme: TileThemeKey;
  icon: LucideIcon;
  label: string;
  sublabel?: string;
  badge?: string;
  onClick: () => void;
}

export function FeatureTile({
  theme,
  icon: Icon,
  label,
  sublabel,
  badge,
  onClick,
}: FeatureTileProps) {
  const t = TILE_THEMES[theme];
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label={label}
      whileTap={{ scale: 0.96 }}
      className="relative flex w-full flex-col items-start gap-3 rounded-[24px] p-5 text-left focus:outline-none focus-visible:ring-4"
      style={{
        minHeight: 132,
        background: t.bg,
        border: `2px solid ${t.ring}`,
      }}
    >
      {badge && (
        <span
          className="absolute right-4 top-4 flex min-w-7 items-center justify-center rounded-full px-2 font-black text-white"
          style={{ height: 28, background: t.ink, fontSize: 15 }}
        >
          {badge}
        </span>
      )}
      <span
        className="flex items-center justify-center rounded-2xl"
        style={{ width: 56, height: 56, background: ELDER_COLORS.surface, color: t.ink }}
      >
        <Icon size={32} strokeWidth={2.4} />
      </span>
      <span className="leading-tight">
        <span className="block font-black" style={{ fontSize: 21, color: t.ink }}>
          {label}
        </span>
        {sublabel && (
          <span className="block font-bold" style={{ fontSize: 15, color: ELDER_COLORS.inkSoft }}>
            {sublabel}
          </span>
        )}
      </span>
    </motion.button>
  );
}

// ── 白色區塊卡 ──────────────────────────────────────────────
interface SectionCardProps {
  children: React.ReactNode;
  title?: string;
  icon?: LucideIcon;
  className?: string;
}

export function SectionCard({ children, title, icon: Icon, className = '' }: SectionCardProps) {
  return (
    <section
      className={`rounded-[28px] p-5 ${className}`}
      style={{
        background: ELDER_COLORS.surface,
        border: `1px solid ${ELDER_COLORS.border}`,
        boxShadow: '0 6px 20px rgba(140, 120, 90, 0.08)',
      }}
    >
      {title && (
        <div className="mb-4 flex items-center gap-2.5">
          {Icon && <Icon size={24} strokeWidth={2.4} style={{ color: ELDER_COLORS.primary }} />}
          <h2 className="font-black" style={{ fontSize: 21, color: ELDER_COLORS.ink }}>
            {title}
          </h2>
        </div>
      )}
      {children}
    </section>
  );
}

// ── 狀態小標（連續天數 / 今日進度）──────────────────────────
interface StatChipProps {
  icon: LucideIcon;
  label: string;
  tone?: 'primary' | 'amber';
}

export function StatChip({ icon: Icon, label, tone = 'primary' }: StatChipProps) {
  const bg = tone === 'amber' ? ELDER_COLORS.amberSoft : ELDER_COLORS.primarySoft;
  const fg = tone === 'amber' ? ELDER_COLORS.amber : ELDER_COLORS.primaryDark;
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full px-4 font-black"
      style={{ height: 44, background: bg, color: fg, fontSize: 17 }}
    >
      <Icon size={22} strokeWidth={2.6} />
      {label}
    </span>
  );
}
