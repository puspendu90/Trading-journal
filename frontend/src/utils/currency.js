// src/utils/currency.js

const currencyConfig = {
  INR: {
    locale: "en-IN",
    currency: "INR",
  },

  USD: {
    locale: "en-US",
    currency: "USD",
  },

  EUR: {
    locale: "de-DE",
    currency: "EUR",
  },

  GBP: {
    locale: "en-GB",
    currency: "GBP",
  },

  JPY: {
    locale: "ja-JP",
    currency: "JPY",
  },

  AUD: {
    locale: "en-AU",
    currency: "AUD",
  },

  CAD: {
    locale: "en-CA",
    currency: "CAD",
  },

  SGD: {
    locale: "en-SG",
    currency: "SGD",
  },
};

export const formatCurrency = (
  amount,
  currency = "USD"
) => {
  const config =
    currencyConfig[currency] ||
    currencyConfig.USD;

  const numericAmount = Number(amount) || 0;

  return new Intl.NumberFormat(
    config.locale,
    {
      style: "currency",
      currency: config.currency,
      maximumFractionDigits: 2,
    }
  ).format(numericAmount);
};

export const getCurrencySymbol = (
  currency = "USD"
) => {
  const config =
    currencyConfig[currency] ||
    currencyConfig.USD;

  return new Intl.NumberFormat(
    config.locale,
    {
      style: "currency",
      currency: config.currency,
      maximumFractionDigits: 0,
    }
  )
    .formatToParts(0)
    .find(
      (part) => part.type === "currency"
    )?.value || currency;
};

export const supportedCurrencies =
  Object.keys(currencyConfig);

