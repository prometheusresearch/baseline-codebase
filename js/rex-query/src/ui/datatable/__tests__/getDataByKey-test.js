/**
 * @flow
 */

import getDataByKey from '../getDataByKey';
import {transpose} from '../../../ArrayUtil';

test('plain list', function() {
  const data = {
    record: [{a: 1}, {a: 2}],
  };
  const focus = ['record'];
  const transposedData = transpose(data, focus);
  expect(getDataByKey(transposedData[0], ['record', 'a'])).toEqual(1);
  expect(getDataByKey(transposedData[1], ['record', 'a'])).toEqual(2);
});

test('plain list / accessing unknown key', function() {
  const focus = ['record'];
  const data = {
    record: [{a: 1}, {a: 2}],
  };
  const transposedData = transpose(data, focus);
  expect(getDataByKey(transposedData[0], ['xxx'], focus)).toEqual(undefined);
  expect(getDataByKey(transposedData[0], ['record', 'xxx'], focus)).toEqual(undefined);
});

test('plain list with nested record', function() {
  const focus = ['record'];
  const data = {
    record: [{a: 1, b: {c: 11}}, {a: 2, b: {c: 21}}],
  };
  const transposedData = transpose(data, focus);
  expect(getDataByKey(transposedData[0], ['record'], focus)).toEqual(data.record[0]);
  expect(getDataByKey(transposedData[0], ['record', 'a'], focus)).toEqual(1);
  expect(getDataByKey(transposedData[0], ['record', 'b'], focus)).toEqual(
    data.record[0].b,
  );
  expect(getDataByKey(transposedData[0], ['record', 'b', 'c'], focus)).toEqual(11);
  expect(getDataByKey(transposedData[1], ['record'], focus)).toEqual(data.record[1]);
  expect(getDataByKey(transposedData[1], ['record', 'a'], focus)).toEqual(2);
  expect(getDataByKey(transposedData[1], ['record', 'b'], focus)).toEqual(
    data.record[1].b,
  );
  expect(getDataByKey(transposedData[1], ['record', 'b', 'c'], focus)).toEqual(21);
});

describe('nested list', function() {
  const data = {
    record: [
      {
        a: 1,
        b: [{c: 11}, {c: 12}],
      },
      {
        a: 2,
        b: [{c: 21}, {c: 22}],
      },
    ],
  };
  const keyPathSet = [['record', 'a'], ['record', 'b', 'c']];

  describe('focus: record', function() {
    const focus = ['record'];
    const transposedData = transpose(data, focus);
    test('row 0', function() {
      const row = transposedData[0];
      const values = keyPathSet.map(keyPath => getDataByKey(row, keyPath, focus));
      expect(values).toEqual([1, undefined]);
    });
    test('row 1', function() {
      const row = transposedData[1];
      const values = keyPathSet.map(keyPath => getDataByKey(row, keyPath, focus));
      expect(values).toEqual([2, undefined]);
    });
  });

  describe('focus: record.b', function() {
    const focus = ['record', 'b'];
    const transposedData = transpose(data, focus);
    test('row 0', function() {
      const row = transposedData[0];
      const values = keyPathSet.map(keyPath => getDataByKey(row, keyPath, focus));
      expect(values).toEqual([1, 11]);
    });
    test('row 1', function() {
      const row = transposedData[1];
      const values = keyPathSet.map(keyPath => getDataByKey(row, keyPath, focus));
      expect(values).toEqual([undefined, 12]);
    });
    test('row 2', function() {
      const row = transposedData[2];
      const values = keyPathSet.map(keyPath => getDataByKey(row, keyPath, focus));
      expect(values).toEqual([2, 21]);
    });
    test('row 3', function() {
      const row = transposedData[3];
      const values = keyPathSet.map(keyPath => getDataByKey(row, keyPath, focus));
      expect(values).toEqual([undefined, 22]);
    });
  });
});

describe('double nested list', function() {
  const data = {
    record: [
      {
        a: 1,
        b: [
          {
            c: 11,
            d: [{e: 111}, {e: 112}],
          },
          {
            c: 12,
            d: [{e: 121}, {e: 122}],
          },
        ],
      },
      {
        a: 2,
        b: [
          {
            c: 21,
            d: [{e: 211}, {e: 212}],
          },
          {
            c: 22,
            d: [{e: 221}, {e: 222}],
          },
        ],
      },
    ],
  };
  const keyPathSet = [['record', 'a'], ['record', 'b', 'c'], ['record', 'b', 'd', 'e']];

  describe('focus: record', function() {
    const focus = ['record'];
    const transposedData = transpose(data, focus);

    test('row 0', function() {
      const row = transposedData[0];
      const values = keyPathSet.map(keyPath => getDataByKey(row, keyPath, focus));
      expect(values).toEqual([1, undefined, undefined]);
    });
    test('row 1', function() {
      const row = transposedData[1];
      const values = keyPathSet.map(keyPath => getDataByKey(row, keyPath, focus));
      expect(values).toEqual([2, undefined, undefined]);
    });
  });

  describe('focus: record.b', function() {
    const focus = ['record', 'b'];
    const transposedData = transpose(data, focus);

    test('row 0', function() {
      const row = transposedData[0];
      const values = keyPathSet.map(keyPath => getDataByKey(row, keyPath, focus));
      expect(values).toEqual([1, 11, undefined]);
    });
    test('row 1', function() {
      const row = transposedData[1];
      const values = keyPathSet.map(keyPath => getDataByKey(row, keyPath, focus));
      expect(values).toEqual([undefined, 12, undefined]);
    });
    test('row 2', function() {
      const row = transposedData[2];
      const values = keyPathSet.map(keyPath => getDataByKey(row, keyPath, focus));
      expect(values).toEqual([2, 21, undefined]);
    });
    test('row 3', function() {
      const row = transposedData[3];
      const values = keyPathSet.map(keyPath => getDataByKey(row, keyPath, focus));
      expect(values).toEqual([undefined, 22, undefined]);
    });
  });

  describe('focus: record.b.d', function() {
    const focus = ['record', 'b', 'd'];
    const transposedData = transpose(data, focus);
    const keyPathSet = [['record', 'a'], ['record', 'b', 'c'], ['record', 'b', 'd', 'e']];

    test('row 0', function() {
      const row = transposedData[0];
      const values = keyPathSet.map(keyPath => getDataByKey(row, keyPath, focus));
      expect(values).toEqual([1, 11, 111]);
    });

    test('row 1', function() {
      const row = transposedData[1];
      const values = keyPathSet.map(keyPath => getDataByKey(row, keyPath, focus));
      expect(values).toEqual([undefined, undefined, 112]);
    });

    test('row 2', function() {
      const row = transposedData[2];
      const values = keyPathSet.map(keyPath => getDataByKey(row, keyPath, focus));
      expect(values).toEqual([undefined, 12, 121]);
    });

    test('row 3', function() {
      const row = transposedData[3];
      const values = keyPathSet.map(keyPath => getDataByKey(row, keyPath, focus));
      expect(values).toEqual([undefined, undefined, 122]);
    });

    test('row 4', function() {
      const row = transposedData[4];
      const values = keyPathSet.map(keyPath => getDataByKey(row, keyPath, focus));
      expect(values).toEqual([2, 21, 211]);
    });

    test('row 5', function() {
      const row = transposedData[5];
      const values = keyPathSet.map(keyPath => getDataByKey(row, keyPath, focus));
      expect(values).toEqual([undefined, undefined, 212]);
    });

    test('row 6', function() {
      const row = transposedData[6];
      const values = keyPathSet.map(keyPath => getDataByKey(row, keyPath, focus));
      expect(values).toEqual([undefined, 22, 221]);
    });

    test('row 7', function() {
      const row = transposedData[7];
      const values = keyPathSet.map(keyPath => getDataByKey(row, keyPath, focus));
      expect(values).toEqual([undefined, undefined, 222]);
    });
  });
});
