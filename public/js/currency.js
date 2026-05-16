/**
 * Formatage monétaire côté navigateur — franc congolais (CDF)
 */
(function (global) {
  const CURRENCY_CODE = 'CDF';
  const CURRENCY_LOCALE = 'fr-CD';
  const CURRENCY_SYMBOL = 'FC';

  const moneyFormatter = new Intl.NumberFormat(CURRENCY_LOCALE, {
    style: 'currency',
    currency: CURRENCY_CODE,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  function formatMoney(amount, fallback) {
    const value = Number(amount);
    if (!Number.isFinite(value)) {
      return fallback !== undefined ? fallback : '—';
    }
    try {
      return moneyFormatter.format(value);
    } catch {
      return `${value.toLocaleString(CURRENCY_LOCALE)} ${CURRENCY_SYMBOL}`;
    }
  }

  global.CURRENCY_CODE = CURRENCY_CODE;
  global.CURRENCY_LOCALE = CURRENCY_LOCALE;
  global.CURRENCY_SYMBOL = CURRENCY_SYMBOL;
  global.formatMoney = formatMoney;
})(typeof window !== 'undefined' ? window : global);
