import {
  numberType, textType,
  seqType, optType,
  leastUpperBound, atom
} from '../Type';

it('leastUpperBound()', function() {
  expect(leastUpperBound(textType, textType))
    .toEqual(textType);
  expect(leastUpperBound(textType, seqType(textType)))
    .toEqual(seqType(textType));
  expect(leastUpperBound(textType, optType(textType)))
    .toEqual(optType(textType));

  expect(leastUpperBound(optType(textType), textType))
    .toEqual(optType(textType));
  expect(leastUpperBound(optType(textType), seqType(textType)))
    .toEqual(seqType(textType));
  expect(leastUpperBound(optType(textType), optType(textType)))
    .toEqual(optType(textType));

  expect(leastUpperBound(seqType(textType), textType))
    .toEqual(seqType(textType));
  expect(leastUpperBound(seqType(textType), seqType(textType)))
    .toEqual(seqType(textType));
  expect(leastUpperBound(seqType(textType), optType(textType)))
    .toEqual(seqType(textType));
});

it('seqType()', function() {
  expect(seqType(seqType(numberType))).toEqual(seqType(numberType));
  expect(seqType(optType(numberType))).toEqual(seqType(numberType));
});

it('optType()', function() {
  expect(optType(optType(numberType))).toEqual(optType(numberType));
  expect(optType(seqType(numberType))).toEqual(seqType(numberType));
});

it('atom()', function() {
  expect(atom(optType(numberType))).toEqual(numberType);
  expect(atom(seqType(numberType))).toEqual(numberType);
  expect(atom(numberType)).toEqual(numberType);
});
