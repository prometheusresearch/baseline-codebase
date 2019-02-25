/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';
import {assert, createRenderer, spy} from 'rex-widget/testutils';

import Pick from '../Pick';
import Action from '../../Action';
import {Entity} from '../../../';
import {SearchInput} from 'rex-widget/form';
import {DataTable} from 'rex-widget/datatable';

describe('rex-action/actions', function() {
  describe('Pick', function() {
    let renderer;

    beforeEach(function() {
      renderer = createRenderer();
    });

    it('renders', function() {
      let data = {
        params() {
          return data;
        },
      };
      spy(data, 'params');
      let setActionState = spy();
      let onCommand = spy();
      renderer.render(
        <Pick
          search="ok"
          entity={{type: {name: 'individual'}}}
          context={{individual: Entity.createEntity('individual', 1)}}
          contextTypes={{input: {rows: {}}, output: {rows: {}}}}
          data={data}
          actionState={{search: 'x'}}
          setActionState={setActionState}
          onCommand={onCommand}
        />,
      );
      renderer.assertElementWithTypeProps(Action);
      assert(data.params.callCount === 2);

      let search = renderer.element.props.extraToolbar;
      assert(search.type === SearchInput);
      assert(search.props.onChange);
      assert(search.props.value === 'x');
      search.props.onChange('value');
      assert(setActionState.calledOnce);
      assert.deepEqual(setActionState.firstCall.args[0], {search: 'value'});

      let table = renderer.findWithTypeProps(DataTable);
      assert(table.props.onSelect);
      table.props.onSelect(1, {id: 1});
      assert(onCommand.calledOnce);
      assert.deepEqual(onCommand.firstCall.args, ['default', {id: 1}]);

      assert.deepEqual(
        Pick.commands.default.execute({entity: {name: 'individual'}}, {a: 42}, [{id: 1}]),
        {
          a: 42,
          individual: {id: 1},
        },
      );
      assert.deepEqual(
        Pick.commands.default.execute({entity: {name: 'individual'}}, {a: 42}, [null]),
        {
          a: 42,
        },
      );
    });
  });
});
