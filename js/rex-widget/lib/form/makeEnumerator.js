/**
 * @copyright 2016, Prometheus Research, LLC
 */
/* eslint-disable quotes */

import generateFunction from 'generate-function';
import {isArray} from '../lang';

/**
 * Make value enumerator for a given `pattern`.
 */
export default function makeEnumerator(pattern) {
  if (!isArray(pattern)) {
    pattern = pattern.split('.').filter(Boolean);
  }
  let sym = {};
  function symgen(name) {
    let idx = sym[name] || 1;
    sym[name] = idx + 1;
    return `${name}_${idx}`;
  }
  let codegen = generateFunction();
  codegen(`function enumerate(value) {`);
  codegen(`var result  = [];`);
  codegen(`var keyPath = [];`);
  _makeEnumeratorCodegen(
    codegen,
    'value',
    'null',
    symgen,
    pattern,
  );
  codegen(`return result;`);
  codegen(`}`);
  return codegen.toFunction({});
}

function _makeEnumeratorCodegen(codegen, value, parentValue, symgen, pattern) {
  let segment = pattern[0];

  let nextValue = symgen('value');
  let nextPattern = pattern.slice(1);

  codegen(`if (${value} != null) {`);
  if (segment === undefined) {
    codegen(`result.push({
      value: ${value},
      parentValue: ${parentValue},
      keyPath: keyPath.slice(0)
    });`);
  } if (segment === '*') {
    let idx = symgen('i');
    codegen(`for (var ${idx} = 0; ${idx} < ${value}.length; ${idx}++) {`);
    codegen(`var ${nextValue} = ${value}[${idx}];`);
    codegen(`keyPath.push(${idx});`);
    if (pattern.length > 1) {
      _makeEnumeratorCodegen(codegen, nextValue, value, symgen, nextPattern);
    } else {
      codegen(`result.push({
        value: ${value}[${idx}],
        parentValue: ${value},
        keyPath: keyPath.slice(0)
      });`);
    }
    codegen(`keyPath.pop();`);
    codegen(`}`);
  } else if (segment !== undefined) {
    codegen(`var ${nextValue} = ${value}["${segment}"];`);
    codegen(`keyPath.push("${segment}");`);
    _makeEnumeratorCodegen(codegen, nextValue, value, symgen, nextPattern);
    codegen(`keyPath.pop();`);
  }
  codegen(`}`);
}
