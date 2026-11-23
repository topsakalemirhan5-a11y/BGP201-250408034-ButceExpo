export const toKurus = (tl: number) => Math.round(tl * 100);

export const formatTL = (kurus: number) =>
  new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
  }).format(kurus / 100);