export const sign = (value: number): (-1 | 0 | 1) => value > 0 ? 1: (value < 0 ? -1 : 0);

export const between = (min, max, value) => Math.max(min, Math.min(max, value));