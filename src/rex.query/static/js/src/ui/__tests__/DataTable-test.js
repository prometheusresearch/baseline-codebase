import {getColumnConfig} from '../DataTable';
import {pipeline, select, navigate} from '../../model/Query';

function stripQuery(col) {
  if (col.type === 'field') {
    return {
      ...col,
      field: {
        ...col.field,
        data: null,
        cellDataGetter: null,
        cellRenderer: null,
        headerCellRenderer: null,
      }
    };
  } else if (col.type === 'group') {
    return {...col, group: col.group.map(stripQuery)};
  } else if (col.type === 'stack') {
    return {...col, stack: col.stack.map(stripQuery)};
  }
}

it('individual', function() {
  let nav = getColumnConfig(navigate('individual'));
  expect(stripQuery(nav)).toMatchSnapshot();
});

it('individual.study', function() {
  let nav = getColumnConfig(
    pipeline(
      navigate('individual'),
      navigate('study')
    )
  );
  expect(stripQuery(nav)).toMatchSnapshot();
});

it('individual:select(name,age)', function() {
  let nav = getColumnConfig(
    pipeline(
      navigate('individual'),
      select({name: navigate('name'), age: navigate('age')}),
    )
  );
  expect(stripQuery(nav)).toMatchSnapshot();
});

it('individual:select(name,study:select(label))', function() {
  let nav = getColumnConfig(
    pipeline(
      navigate('individual'),
      select({
        name: navigate('name'),
        study: pipeline(
          navigate('study'),
          select({label: navigate('label')}),
        )
      }),
    )
  );
  expect(stripQuery(nav)).toMatchSnapshot();
});
