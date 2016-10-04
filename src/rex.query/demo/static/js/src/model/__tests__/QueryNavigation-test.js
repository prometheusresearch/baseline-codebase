import {getQueryNavigation} from '../QueryNavigation';
import {pipeline, select, navigate} from '../Query';

function stripQuery(nav) {
  if (nav.type === 'column') {
    return {...nav, query: null};
  } else if (nav.type === 'select') {
    return {...nav, select: nav.select.map(stripQuery)};
  } else if (nav.type === 'navigate') {
    return {...nav, navigate: nav.navigate.map(stripQuery)};
  }
}

it('individual', function() {
  let nav = getQueryNavigation(navigate('individual'));
  expect(stripQuery(nav)).toEqual({
    type: 'column',
    path: 'individual',
    title: 'individual',
    query: null
  });
});

it('individual.study', function() {
  let nav = getQueryNavigation(
    pipeline(
      navigate('individual'),
      navigate('study')
    )
  );
  expect(stripQuery(nav)).toEqual({
    type: 'navigate',
    navigate: [
      {
        type: 'column',
        path: 'individual',
        title: 'individual',
        query: null
      },
      {
        type: 'column',
        path: 'study',
        title: 'study',
        query: null
      },
    ]
  });
});

it('individual:select(name,age)', function() {
  let nav = getQueryNavigation(
    pipeline(
      navigate('individual'),
      select({name: navigate('name'), age: navigate('age')}),
    )
  );
  expect(stripQuery(nav)).toEqual({
    type: 'navigate',
    navigate: [
      {
        type: 'column',
        path: 'individual',
        title: 'individual',
        query: null
      },
      {
        type: 'select',
        select: [
          {
            type: 'column',
            path: 'name',
            title: 'name',
            query: null
          },
          {
            type: 'column',
            path: 'age',
            title: 'age',
            query: null
          },
        ]
      },
    ]
  });
});

it('individual:select(name,study:select(title))', function() {
  let nav = getQueryNavigation(
    pipeline(
      navigate('individual'),
      select({
        name: navigate('name'),
        study: pipeline(
          navigate('study'),
          select({title: navigate('title')}),
        )
      }),
    )
  );
  expect(stripQuery(nav)).toEqual({
    type: 'navigate',
    navigate: [
      {
        type: 'column',
        path: 'individual',
        title: 'individual',
        query: null
      },
      {
        type: 'select',
        select: [
          {
            type: 'column',
            path: 'name',
            title: 'name',
            query: null
          },
          {
            type: 'navigate',
            navigate: [
              {
                type: 'column',
                path: 'study',
                title: 'study',
                query: null
              },
              {
                type: 'select',
                select: [
                  {
                    type: 'column',
                    path: 'title',
                    title: 'title',
                    query: null
                  },
                ]
              }
            ]
          },
        ]
      },
    ]
  });
});
