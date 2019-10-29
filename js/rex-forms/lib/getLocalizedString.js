/**
 * @copyright 2016, Prometheus Research, LLC
 */

export default function getLocalizedString(lso, i18n, defaultLocale) {
  let locale = i18n.config.locale;
  let baseLanguage = i18n.getLanguage();

  if (typeof lso === "string" || lso instanceof String) {
    return lso;
  } else if (lso[locale]) {
    return lso[locale];
  } else if (lso[baseLanguage]) {
    return lso[baseLanguage];
  } else if (lso[defaultLocale]) {
    return lso[defaultLocale];
  } else {
    return "";
  }
}
