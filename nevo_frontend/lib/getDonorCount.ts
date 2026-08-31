import type { Pool } from '@/src/store/poolsStore';

export function getDonorCount(pool: Pool): number {
  if (pool.id === '1') return 42;
  if (pool.id === '2') return 87;
  if (pool.id === '3') return 31;
  if (pool.id === '4') return 15;
  if (pool.id === '5') return 5;
  return Math.floor((pool.raised * 7.3) / 100) + 1;
}
