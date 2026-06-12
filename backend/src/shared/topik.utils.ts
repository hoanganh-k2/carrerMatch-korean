import { TopikLevel } from '@prisma/client';

export const TOPIK_ORDER: Record<TopikLevel, number> = {
  NONE: 0,
  TOPIK_I_LEVEL_1: 1,
  TOPIK_I_LEVEL_2: 2,
  TOPIK_II_LEVEL_3: 3,
  TOPIK_II_LEVEL_4: 4,
  TOPIK_II_LEVEL_5: 5,
  TOPIK_II_LEVEL_6: 6,
};

export function getTopikOrder(level: TopikLevel): number {
  return TOPIK_ORDER[level] ?? 0;
}

export function meetsTopikRequirement(
  candidateLevel: TopikLevel,
  requiredLevel: TopikLevel,
): boolean {
  return getTopikOrder(candidateLevel) >= getTopikOrder(requiredLevel);
}

/** Trả về tất cả TopikLevel có thứ tự <= level (dùng cho range filter trong search) */
export function getLevelsUpTo(level: TopikLevel): TopikLevel[] {
  const maxOrder = getTopikOrder(level);
  return (Object.entries(TOPIK_ORDER) as [TopikLevel, number][])
    .filter(([, order]) => order <= maxOrder)
    .map(([lvl]) => lvl);
}
