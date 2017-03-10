/**
 * @copyright 2015, Prometheus Research, LLC
 */

import escapeRegExp from 'escape-regexp';

export function makeEscape(character) {
  let re = new RegExp(escapeRegExp(character), 'g');

  function escape(string) {
    return String(string).replace(re, '\\$&');
  }

  return escape;
}

export function makeUnescape(character) {
  let unescapeRe = new RegExp('(?:\\\\)' + escapeRegExp(character), 'g');

  function unescape(string) {
    return string.replace(unescapeRe, character);
  }

  return unescape;
}

export function makeSplitBy(character) {
  let splitRe = new RegExp('(?:^|[^\\\\])' + escapeRegExp(character));
  let unescape = makeUnescape(character);

  function splitBy(string) {
    let match;
    let array = [];
    if (string[0] === character) {
      array.push('');
      string = string.substring(1);
    }
    while (match = splitRe.exec(string)) { // eslint-disable-line no-cond-assign
      array.push(string.substring(0, match.index + 1));
      string = string.substring(match.index + 2);
    }
    array.push(string);
    return array.map(unescape);
  }

  return splitBy;
}

export function makeJoinWith(character) {
  let escape = makeEscape(character);

  function joinWith(array) {
    return array.map(escape).join(character);
  }

  return joinWith;
}

export function quote(str) {
  return `'${str}'`;
}

export let joinWithComma = makeJoinWith(',');
export let splitByComma = makeSplitBy(',');

export let joinWithSlash = makeJoinWith('/');
export let splitBySlash = makeSplitBy('/');

export let joinWithEquals = makeJoinWith('=');
export let splitByEquals = makeSplitBy('=');
