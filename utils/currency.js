/**
 * Devise par défaut : franc congolais (CDF)
 * Configurable via .env : CURRENCY_CODE, CURRENCY_LOCALE
 */
const CURRENCY_CODE = process.env.CURRENCY_CODE || 'CDF';
const CURRENCY_LOCALE = process.env.CURRENCY_LOCALE || 'fr-CD';
const CURRENCY_LABEL = process.env.CURRENCY_LABEL || 'franc congolais';
const CURRENCY_SYMBOL = process.env.CURRENCY_SYMBOL || 'FC';

const moneyFormatter = new Intl.NumberFormat(CURRENCY_LOCALE, {
  style: 'currency',
  currency: CURRENCY_CODE,
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

function formatMoney(amount, options = {}) {
  const value = Number(amount);
  if (!Number.isFinite(value)) {
    return options.fallback ?? '—';
  }

  if (options.raw) {
    return value;
  }

  try {
    if (options.minimumFractionDigits != null || options.maximumFractionDigits != null) {
      return new Intl.NumberFormat(CURRENCY_LOCALE, {
        style: 'currency',
        currency: CURRENCY_CODE,
        minimumFractionDigits: options.minimumFractionDigits ?? 0,
        maximumFractionDigits: options.maximumFractionDigits ?? 2,
      }).format(value);
    }
    return moneyFormatter.format(value);
  } catch {
    return `${value.toLocaleString(CURRENCY_LOCALE)} ${CURRENCY_SYMBOL}`;
  }
}

module.exports = {
  CURRENCY_CODE,
  CURRENCY_LOCALE,
  CURRENCY_LABEL,
  CURRENCY_SYMBOL,
  formatMoney,
};
