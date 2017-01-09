import {
  numberType, textType,
  seqType, optType, regType,
  recordType, entityType,
  leastUpperBound,
  toString,
} from '../Type';
import {emptyDomain as dom} from '../Domain';

it('leastUpperBound()', function() {
  expect(leastUpperBound(textType(dom), textType(dom)))
    .toEqual(textType(dom));
  expect(leastUpperBound(textType(dom), seqType(textType(dom))))
    .toEqual(seqType(textType(dom)));
  expect(leastUpperBound(textType(dom), optType(textType(dom))))
    .toEqual(optType(textType(dom)));

  expect(leastUpperBound(optType(textType(dom)), textType(dom)))
    .toEqual(optType(textType(dom)));
  expect(leastUpperBound(optType(textType(dom)), seqType(textType(dom))))
    .toEqual(seqType(textType(dom)));
  expect(leastUpperBound(optType(textType(dom)), optType(textType(dom))))
    .toEqual(optType(textType(dom)));

  expect(leastUpperBound(seqType(textType(dom)), textType(dom)))
    .toEqual(seqType(textType(dom)));
  expect(leastUpperBound(seqType(textType(dom)), seqType(textType(dom))))
    .toEqual(seqType(textType(dom)));
  expect(leastUpperBound(seqType(textType(dom)), optType(textType(dom))))
    .toEqual(seqType(textType(dom)));
});

it('seqType()', function() {
  expect(seqType(seqType(numberType(dom))))
    .toEqual(seqType(numberType(dom)));
  expect(seqType(optType(numberType(dom))))
    .toEqual(seqType(numberType(dom)));
});

it('optType()', function() {
  expect(optType(optType(numberType(dom))))
    .toEqual(optType(numberType(dom)));
  expect(optType(seqType(numberType(dom))))
    .toEqual(seqType(numberType(dom)));
});

it('regType()', function() {
  expect(regType(optType(numberType(dom))))
    .toEqual(numberType(dom));
  expect(regType(seqType(numberType(dom))))
    .toEqual(numberType(dom));
  expect(regType(numberType(dom)))
    .toEqual(numberType(dom));
});

test('toString()', function() {
  expect(toString(numberType(dom))).toBe('number');
  expect(toString(textType(dom))).toBe('text');
  expect(toString(seqType(textType(dom)))).toBe('[text]');
  expect(toString(optType(textType(dom)))).toBe('?text');
  expect(toString(entityType(dom, 'study'))).toBe('study');
  expect(toString(seqType(entityType(dom, 'study')))).toBe('[study]');
  expect(toString(optType(entityType(dom, 'study')))).toBe('?study');
  expect(toString(recordType(dom, {a: {type: textType(dom)}}))).toBe('{a: text}');
  expect(toString(seqType(recordType(dom, {a: {type: textType(dom)}})))).toBe('[{a: text}]');
  expect(toString(optType(recordType(dom, {a: {type: textType(dom)}})))).toBe('?{a: text}');
});
