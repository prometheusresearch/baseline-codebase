/**
 * @flow
 */

import {parseReplaceReference} from '../parseInstruction';

describe('parseReplaceReference()', function() {
  test('./', function() {
    let replace = parseReplaceReference('./');
    expect(replace).toEqual({
      type: 'replace',
      traverseBack: 0,
      traverse: [],
    });
  });

  test('../', function() {
    let replace = parseReplaceReference('../');
    expect(replace).toEqual({
      type: 'replace',
      traverseBack: 1,
      traverse: [],
    });
  });

  test('.././', function() {
    let replace = parseReplaceReference('.././');
    expect(replace).toEqual({
      type: 'replace',
      traverseBack: 1,
      traverse: [],
    });
  });

  test('../../', function() {
    let replace = parseReplaceReference('../../');
    expect(replace).toEqual({
      type: 'replace',
      traverseBack: 2,
      traverse: [],
    });
  });

  test('a', function() {
    let replace = parseReplaceReference('a');
    expect(replace).toEqual({
      type: 'replace',
      traverseBack: 0,
      traverse: [{actionName: 'a', contextUpdate: {}}],
    });
  });

  test('../a', function() {
    let replace = parseReplaceReference('../a');
    expect(replace).toEqual({
      type: 'replace',
      traverseBack: 1,
      traverse: [{actionName: 'a', contextUpdate: {}}],
    });
  });

  test('../a/b', function() {
    let replace = parseReplaceReference('../a/b');
    expect(replace).toEqual({
      type: 'replace',
      traverseBack: 1,
      traverse: [
        {actionName: 'a', contextUpdate: {}},
        {actionName: 'b', contextUpdate: {}},
      ],
    });
  });

  test('../a?a=b', function() {
    let replace = parseReplaceReference('../a?a=b');
    expect(replace).toEqual({
      type: 'replace',
      traverseBack: 1,
      traverse: [{actionName: 'a', contextUpdate: {a: 'b'}}],
    });
  });

  test('../a?a=b/x', function() {
    let replace = parseReplaceReference('../a?a=b/x');
    expect(replace).toEqual({
      type: 'replace',
      traverseBack: 1,
      traverse: [
        {actionName: 'a', contextUpdate: {a: 'b'}},
        {actionName: 'x', contextUpdate: {}},
      ],
    });
  });

  test('../a?a=b/x?z=42', function() {
    let replace = parseReplaceReference('../a?a=b/x?z=42');
    expect(replace).toEqual({
      type: 'replace',
      traverseBack: 1,
      traverse: [
        {actionName: 'a', contextUpdate: {a: 'b'}},
        {actionName: 'x', contextUpdate: {z: '42'}},
      ],
    });
  });
});
