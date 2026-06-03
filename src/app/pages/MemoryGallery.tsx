// ============================================================
// MemoryGallery — 長者端「親子回憶相片館」
// 溫暖親和、大圖、大字、易瀏覽。點相片可放大看，含說明與日期。
// 從主頁「回憶相片館」功能格進入。示範相簿資料內嵌於此檔。
// ============================================================
import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, ChevronRight, Heart, Images, Users } from 'lucide-react';

import { ElderPageShell, ElderTopBar } from '../components/elderly/ElderlyKit';
import { ELDER_COLORS } from '../components/elderly/tokens';

interface MemoryPhoto {
  id: string;
  seed: string; // 對應 picsum 種子圖
  title: string;
  date: string; // YYYY-MM-DD
  people: string[];
}

const MEMORIES: MemoryPhoto[] = [
  { id: 'm1', seed: 'birthday72', title: '我的 72 歲生日，全家一起切蛋糕', date: '2026-01-20', people: ['全家人'] },
  { id: 'm2', seed: 'lunch-meimei', title: '女兒小美回來陪我吃午飯', date: '2026-02-14', people: ['小美'] },
  { id: 'm3', seed: 'grandson', title: '孫子小寶來看阿公', date: '2026-02-28', people: ['小寶'] },
  { id: 'm4', seed: 'park-walk', title: '公園散步，今天天氣真好', date: '2026-03-05', people: ['小美', '小寶'] },
  { id: 'm5', seed: 'beach2025', title: '去年夏天，全家去海邊玩', date: '2025-08-10', people: ['全家人'] },
  { id: 'm6', seed: 'chess', title: '和老張在樹下下棋', date: '2026-03-12', people: ['老張'] },
  { id: 'm7', seed: 'orchid', title: '自己種的蘭花開了', date: '2026-03-18', people: [] },
  { id: 'm8', seed: 'bbq-moon', title: '中秋節，全家一起烤肉', date: '2025-09-29', people: ['全家人'] },
];

const formatYearMonth = (iso: string) => {
  const [y, m] = iso.split('-');
  return `${y} 年 ${Number(m)} 月`;
};

// 暖色降級的相片：載入失敗時顯示溫暖底色 + 圖示，不留醜灰框
function PhotoImg({ seed, alt, radius }: { seed: string; alt: string; radius: number }) {
  const [err, setErr] = useState(false);
  if (err) {
    return (
      <div className="flex h-full w-full items-center justify-center"
        style={{ borderRadius: radius, background: 'linear-gradient(135deg,#FBE7EA,#FBEFD6)' }}>
        <Images size={44} style={{ color: '#C99' }} />
      </div>
    );
  }
  return (
    <img
      src={`https://picsum.photos/seed/${seed}/800/640`}
      alt={alt}
      loading="lazy"
      onError={() => setErr(true)}
      className="h-full w-full object-cover"
      style={{ borderRadius: radius }}
    />
  );
}

export default function MemoryGallery() {
  const navigate = useNavigate();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const open = openIndex !== null ? MEMORIES[openIndex] : null;
  const goPrev = () => setOpenIndex((i) => (i === null ? i : (i + MEMORIES.length - 1) % MEMORIES.length));
  const goNext = () => setOpenIndex((i) => (i === null ? i : (i + 1) % MEMORIES.length));

  return (
    <ElderPageShell>
      <ElderTopBar title="回憶相片館" subtitle="和家人的照片" onBack={() => navigate('/patient')} />

      <div className="mx-auto w-full max-w-6xl px-6 pb-10 pt-5">
        <div className="mb-5 flex items-center gap-2.5 rounded-2xl px-4 py-3"
          style={{ background: '#FBE7EA', border: '1px solid #E9B9C0' }}>
          <Heart size={24} style={{ color: '#B23A48' }} />
          <p className="font-bold" style={{ fontSize: 17, color: '#B23A48' }}>
            點一張照片，就能放大慢慢看
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {MEMORIES.map((photo, idx) => (
            <motion.button
              key={photo.id}
              type="button"
              onClick={() => setOpenIndex(idx)}
              whileTap={{ scale: 0.97 }}
              aria-label={`${photo.title}，${formatYearMonth(photo.date)}`}
              className="flex flex-col overflow-hidden rounded-[24px] text-left focus:outline-none focus-visible:ring-4"
              style={{ background: ELDER_COLORS.surface, border: `1px solid ${ELDER_COLORS.border}`, boxShadow: '0 6px 18px rgba(140,120,90,0.1)' }}
            >
              <div className="aspect-[5/4] w-full overflow-hidden">
                <PhotoImg seed={photo.seed} alt={photo.title} radius={0} />
              </div>
              <div className="px-3.5 py-3">
                <p className="font-black leading-snug" style={{ fontSize: 17, color: ELDER_COLORS.ink }}>
                  {photo.title}
                </p>
                <p className="mt-1 font-bold" style={{ fontSize: 14, color: ELDER_COLORS.inkFaint }}>
                  {formatYearMonth(photo.date)}
                </p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* ── 放大檢視 ── */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setOpenIndex(null)} className="fixed inset-0 z-[70] bg-black/60" />
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
              className="fixed inset-x-4 top-1/2 z-[80] mx-auto flex max-h-[88%] w-auto max-w-xl -translate-y-1/2 flex-col overflow-hidden rounded-[28px]"
              style={{ background: ELDER_COLORS.surface }}>
              <div className="relative w-full" style={{ aspectRatio: '5 / 4' }}>
                <PhotoImg seed={open.seed} alt={open.title} radius={0} />
                <button type="button" onClick={() => setOpenIndex(null)} aria-label="關閉照片"
                  className="absolute right-3 top-3 flex h-12 w-12 items-center justify-center rounded-full"
                  style={{ background: 'rgba(0,0,0,0.5)', color: '#fff' }}>
                  <X size={26} />
                </button>
              </div>
              <div className="flex items-center gap-3 px-5 py-4">
                <button type="button" onClick={goPrev} aria-label="上一張"
                  className="flex h-14 w-14 items-center justify-center rounded-full shrink-0 active:scale-95"
                  style={{ background: ELDER_COLORS.surfaceSoft, border: `2px solid ${ELDER_COLORS.border}`, color: ELDER_COLORS.primaryDark }}>
                  <ChevronLeft size={30} strokeWidth={2.6} />
                </button>
                <div className="min-w-0 flex-1 text-center">
                  <p className="font-black leading-snug" style={{ fontSize: 21, color: ELDER_COLORS.ink }}>{open.title}</p>
                  <p className="mt-1 flex items-center justify-center gap-2 font-bold" style={{ fontSize: 16, color: ELDER_COLORS.inkSoft }}>
                    <span>{formatYearMonth(open.date)}</span>
                    {open.people.length > 0 && (
                      <span className="flex items-center gap-1"><Users size={16} /> {open.people.join('、')}</span>
                    )}
                  </p>
                </div>
                <button type="button" onClick={goNext} aria-label="下一張"
                  className="flex h-14 w-14 items-center justify-center rounded-full shrink-0 active:scale-95"
                  style={{ background: ELDER_COLORS.surfaceSoft, border: `2px solid ${ELDER_COLORS.border}`, color: ELDER_COLORS.primaryDark }}>
                  <ChevronRight size={30} strokeWidth={2.6} />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </ElderPageShell>
  );
}
