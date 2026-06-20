/**
 * Logic chấm "Mức độ sẵn sàng thị trường Hàn" (0–100) + danh hiệu dí dỏm.
 * Dùng chung cho ứng viên đăng nhập (hồ sơ thật) và khách (mini-quiz).
 *
 * LƯU Ý: bảng danh hiệu theo bậc phải ĐỒNG BỘ với backend
 * `readinessRankTitle()` trong backend/src/share/share.controller.ts.
 */

export interface ReadinessInput {
  topikLevel?: string | null;
  skillCount?: number;
  yearsExperience?: number | null;
  isBrSE?: boolean;
  hasKoreanRole?: boolean; // có target role tiếng Hàn (BrSE/Comtor/...)
}

export interface ReadinessBreakdownItem {
  label: string;
  pct: number; // điểm thành phần 0–100
}

export interface ReadinessResult {
  score: number;   // 0–100
  title: string;   // danh hiệu (khớp backend)
  emoji: string;
  tip: string;
  breakdown: ReadinessBreakdownItem[];
}

const TOPIK_POINTS: Record<string, number> = {
  NONE: 0,
  TOPIK_I_LEVEL_1: 15,
  TOPIK_I_LEVEL_2: 30,
  TOPIK_II_LEVEL_3: 50,
  TOPIK_II_LEVEL_4: 70,
  TOPIK_II_LEVEL_5: 88,
  TOPIK_II_LEVEL_6: 100,
};

/** Danh hiệu + emoji + tip theo bậc điểm */
export function readinessRank(score: number): { title: string; emoji: string; tip: string } {
  if (score >= 85)
    return {
      title: 'Oppa tổng tài đang chờ ký HĐ 🔥',
      emoji: '🔥',
      tip: 'Hồ sơ ngon nghẻ rồi — apply ngay kẻo Oppa nhà người ta hốt mất!',
    };
  if (score >= 70)
    return {
      title: 'Chỉ còn thiếu mỗi vé máy bay ✈️',
      emoji: '✈️',
      tip: 'Chốt thêm một chứng chỉ nữa là bay thẳng Incheon!',
    };
  if (score >= 50)
    return {
      title: 'Tiềm năng làm rể/dâu Hàn Quốc 💪',
      emoji: '💪',
      tip: 'Cày thêm TOPIK và vài kỹ năng nữa là lên hạng liền.',
    };
  if (score >= 30)
    return {
      title: 'Mới thuộc mỗi câu 안녕하세요 😅',
      emoji: '😅',
      tip: 'Bắt đầu cày TOPIK 3–4 để unlock chế độ Oppa nhé.',
    };
  return {
    title: 'Đang ở tập 1 của phim Hàn 🍿',
    emoji: '🍿',
    tip: 'Mới tập 1 thôi, còn nguyên cả series phía trước — 화이팅!',
  };
}

export function computeReadiness(input: ReadinessInput): ReadinessResult {
  const topikPts = TOPIK_POINTS[input.topikLevel ?? 'NONE'] ?? 0;
  const skillPts = Math.min((input.skillCount ?? 0) / 8, 1) * 100;
  const expPts = Math.min((input.yearsExperience ?? 0) / 5, 1) * 100;
  const krPts = input.isBrSE ? 100 : input.hasKoreanRole ? 60 : 0;

  const score = Math.round(0.4 * topikPts + 0.25 * skillPts + 0.2 * expPts + 0.15 * krPts);
  const { title, emoji, tip } = readinessRank(score);

  return {
    score,
    title,
    emoji,
    tip,
    breakdown: [
      { label: 'Tiếng Hàn (TOPIK)', pct: Math.round(topikPts) },
      { label: 'Kỹ năng IT', pct: Math.round(skillPts) },
      { label: 'Kinh nghiệm', pct: Math.round(expPts) },
      { label: 'Vai trò Hàn / BrSE', pct: Math.round(krPts) },
    ],
  };
}
