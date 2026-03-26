/*Copyright (C) 2023 The Xanado Project https://github.com/cdot/Xanado
  License MIT. See README.md at the root of this distribution for full copyright
  and license information. Author Crawford Currie http://c-dot.co.uk*/
/* eslint-env browser */

import "jquery";
import "jquery-ui";
// See resolution of Banana, below
import "banana-i18n";

/**
 * Support for $.i18n internationalisation using banana-i18n.
 * A reaonably drop-in replacement for jQuery.i18n, which appears
 * unsupported.
 */

/* global Banana */

let debug = () => {};

/**
 * Generate a string id in the current language given arguments
 */
$.i18n = (...args) => {
  const ret = $.banana.i18n.apply($.banana, args);
  return ret;
};

/**
 * Load the messages for the given locale
 * @param {string} locale locale string e.g. en-GB
 */
function loadMessages(locale, data_url) {
  debug("i18n loading", `${data_url}/${locale}.json`);
  return $.getJSON(`${data_url}/${locale}.json`)
  .then(data => $.banana.load(data, locale))
  .catch(e => {
    console.error(`i18n ${locale} load failed`, e);
    if (/-/.test(locale)) {
      locale = locale.replace(/-.*$/, "");
      if ($.banana.messagestore.hasLocale(locale))
        return undefined;
      debug("i18n trying", locale);
      return loadMessages(locale, data_url);
    }
    throw e;
  });
}

/**
 * Initialise translation module
 * @param { string} locale locale identified e.g. "en-GB"
 * @param { string} data_url URL that points to the directory containing
 * translation .json files.
 * @param {function?} dbg debug function e.g. console.debug
 * @return {Promise} promise that results when initialisation is done
 */
$.i18n.init = (locale, data_url, dbg) => {

  if (typeof dbg === "function")
    debug = dbg;

  if (!locale) {
    // Get the language from the browser
    if (window.navigator.languages)
      locale = window.navigator.languages[0];
    else
      locale = window.navigator.userLanguage || window.navigator.language;
  }

  // Load and cache the fallback "en".
  let promises;

  // Load class Banana and instance banana
  if ($.banana)
    promises = Promise.resolve($.banana);
  else {
    // Running in the browser, outside of webpack, the ESM import
    // statement at the head of this module defines a global
    // "Banana". Running in node and in webpack, only loading the module
    // explicitly gives us the symbol.
    const pickBanana = (typeof Banana === "undefined")
          ? import("banana-i18n").then(mod => mod.default)
          : Promise.resolve(Banana);

    promises = pickBanana
    .then(Banana => $.banana = new Banana("en", { finalFallback: "en" }));
  }

  // Load en, the final fallback locale, if needed
  return promises = promises
  .then(() => $.banana.messageStore.hasLocale("en")
        ? undefined
        : loadMessages("en", data_url)
        .catch(e => {
          console.error(`i18n fallback load failed`);
          throw e;
        }))

  .then(() => {
    // Load the requested locale, if necessary
    if ($.banana.messageStore.hasLocale(locale)) {
      debug("i18n using preloaded", locale);
      return $.banana.setLocale(locale);
    }

    debug("i18n loading", locale);
    return loadMessages(locale, data_url)
    .then(() => $.banana.setLocale(locale));
  });
}

/**
 * Get the current locale
 * @return { string} the current locale string
 */
$.i18n.locale = () => $.banana ? $.banana.locale : undefined;

/**
 * jQuery plugin to translate all elements in DOM that have
 * data-i18n attribute. The HTML of the element will be replaced
 * with the translation.
 */
$.fn.i18n = function() {
  this.each(function () {
    const $el = $(this);
    const from = $el.data("i18n");
    if (typeof from !== "undefined") {
      const to = $.banana.i18n(from);
      $el.html(to);
    }
  });
};
