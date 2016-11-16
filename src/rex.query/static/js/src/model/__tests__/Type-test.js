import {
  numberType, textType,
  seqType, optType, regType,
  leastUpperBound, emptyDomain as dom
} from '../Type';

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
