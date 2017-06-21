import {transpose} from '../ArrayUtil';

describe('transpose', function() {
  it('transpose onto nothing', function() {
    expect(
      transpose(
        {
          study: [1, 2],
        },
        [],
      ),
    ).toEqual([
      {
        study: [1, 2],
      },
    ]);
  });

  it('transpose one level deep', function() {
    let data = {
      study: [1, 2],
    };
    expect(transpose(data, ['study'])).toEqual([
      {
        __index__: 0,
        study: 1,
      },
      {
        __index__: 0,
        study: 2,
      },
    ]);
  });

  it('transpose two levels deep', function() {
    let data = {
      study: [
        {
          id: 's1',
          protocol: [{id: 's1.p1'}, {id: 's1.p2'}],
        },
        {
          id: 's2',
          protocol: [{id: 's2.p1'}, {id: 's2.p2'}],
        },
      ],
    };
    expect(transpose(data, ['study', 'protocol'])).toEqual([
      {
        __index__: 0,
        study: {
          __index__: 0,
          id: 's1',
          protocol: {
            id: 's1.p1',
          },
        },
      },
      {
        __index__: 1,
        study: {
          __index__: 0,
          id: 's1',
          protocol: {
            id: 's1.p2',
          },
        },
      },
      {
        __index__: 0,
        study: {
          __index__: 0,
          id: 's2',
          protocol: {
            id: 's2.p1',
          },
        },
      },
      {
        __index__: 1,
        study: {
          __index__: 0,
          id: 's2',
          protocol: {
            id: 's2.p2',
          },
        },
      },
    ]);
  });
});
