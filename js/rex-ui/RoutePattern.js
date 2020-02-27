/**
 * Matcher code is based on https://github.com/molefrog/wouter/master/matcher.js
 * which is licensed with ISC.
 *
 * @flow
 */

export type pattern = string;
export opaque type compiledPattern = {|
  regexp: RegExp,
  pattern: pattern,
  keys: {| name: string |}[],
|};

export function match(
  pattern: compiledPattern,
  path: string,
): ?{ [name: string]: string } {
  let out = pattern.regexp.exec(path);
  if (out == null) {
    return null;
  } else {
    let params = {};
    for (let i = 0; i < pattern.keys.length; i++) {
      params[pattern.keys[i].name] = out[i + 1]; // 0-index is the whole match
    }
    return params;
  }
}

// escapes a regexp string (borrowed from path-to-regexp sources)
// https://github.com/pillarjs/path-to-regexp/blob/v3.0.0/index.js#L202
let escapeForRegExp = str => str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");

// returns a segment representation in RegExp based on flags
// adapted and simplified version from path-to-regexp sources
let regexpForSegment = (repeat, optional, prefix) => {
  let capture = repeat ? "((?:[^\\/]+?)(?:\\/(?:[^\\/]+?))*)" : "([^\\/]+?)";
  if (optional && prefix) capture = "(?:\\/" + capture + ")";
  return capture + (optional ? "?" : "");
};

export function compile(pattern: string): compiledPattern {
  let groupRx = /:([A-Za-z0-9_]+)([?+*]?)/g;

  let lastIndex = 0;
  let keys = [];
  let result = "";

  while (true) {
    let match = groupRx.exec(pattern);
    if (match == null) {
      break;
    }
    let [_, segment, mod] = match;

    // :foo  [1]      (  )
    // :foo? [0 - 1]  ( o)
    // :foo+ [1 - ∞]  (r )
    // :foo* [0 - ∞]  (ro)
    let repeat = mod === "+" || mod === "*";
    let optional = mod === "?" || mod === "*";
    let prefix = optional && pattern[match.index - 1] === "/" ? 1 : 0;

    let prev = pattern.substring(lastIndex, match.index - prefix);

    keys.push({ name: segment });
    lastIndex = groupRx.lastIndex;

    result +=
      escapeForRegExp(prev) + regexpForSegment(repeat, optional, prefix);
  }

  result += escapeForRegExp(pattern.substring(lastIndex));
  return {
    pattern,
    keys,
    regexp: new RegExp("^" + result + "(?:\\/)?$", "i"),
  };
}

let startSepRegExp = /^\/+/;
let endSepRegExp = /\/+$/;

export function concat(patterns: pattern[]) {
  let pattern = "";
  // eslint-disable-next-line no-unused-vars
  for (let p of patterns) {
    p = p.replace(startSepRegExp, "");
    p = p.replace(endSepRegExp, "");
    pattern = pattern + "/" + p;
  }
  return pattern;
}

export function pathname(
  pattern: compiledPattern,
  params: { [name: string]: string },
): string {
  return pattern.pattern.replace(/:([a-zA-Z0-9]+)/g, (_, name) => {
    return params[name];
  });
}
