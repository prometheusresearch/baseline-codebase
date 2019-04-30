/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';
import {spy, createRenderer, assert} from '../../../testutils';

import {DataTableBase} from '../DataTableBase';
import {DataSet} from '../../data';
import * as Environment from '../../Environment';
import {Column, Table} from 'fixed-data-table-2';

describe('rex-widget', function() {

  describe('<DataTableBase />', function() {

    let renderer;

    beforeEach(function() {
      renderer = createRenderer();
    });

    it('renders to empty container if DOM measurements are not made yet', function() {
      let data = DataSet.fromData([]);
      renderer.render(<DataTableBase data={data} columns={[]} />);
      let root = renderer.findWithElement(<DataTableBase.stylesheet.Root />);
      assert(!root.props.children);
    });

    it('renders data table', function() {
      let data = DataSet.fromData([]);
      renderer.render(
        <DataTableBase
          columns={[
            {valueKey: ['a']},
          ]}
          data={data}
          DOMSize={{widget: 100, height: 100}}
          />
      );
      renderer.assertElement(<Table />);
      renderer.assertElement(<Column dataKey="a" />);
    });

    it('fires onSelect', function() {
      let data = DataSet.fromData([]);
      let onSelect = spy();
      renderer.render(
        <DataTableBase
          columns={[
            {valueKey: ['a']},
          ]}
          onSelect={onSelect}
          data={data}
          DOMSize={{widget: 100, height: 100}}
          />
      );
      let table = renderer.findWithElement(<Table />);
      assert(table.props.onRowClick);
      let event = {};
      let row = {id: 'someid'};
      let rowIndex = 42;
      table.props.onRowClick(event, rowIndex, row);
      assert(onSelect.calledOnce);
      assert.deepEqual(onSelect.firstCall.args, [row.id, row]);
    });

    it('gets row from dataset', function() {
      let data = DataSet.fromData([{id: 'someid'}]);
      renderer.render(
        <DataTableBase
          columns={[
            {valueKey: ['a']},
          ]}
          data={data}
          DOMSize={{widget: 100, height: 100}}
          />
      );
      let table = renderer.findWithElement(<Table />);
      assert(table.props.rowGetter);
      assert.deepEqual(table.props.rowGetter(0), {id: 'someid'});
    });

    it('sets a class on selected row', function() {
      let data = DataSet.fromData([{id: 'someid'}]);
      renderer.render(
        <DataTableBase
          columns={[
            {valueKey: ['a']},
          ]}
          selectedRowClassName="selected"
          selected="someid"
          data={data}
          DOMSize={{widget: 100, height: 100}}
          />
      );
      let table = renderer.findWithElement(<Table />);
      assert(table.props.rowClassNameGetter);
      assert(table.props.rowClassNameGetter(0) === 'selected');
      assert(!table.props.rowClassNameGetter(1));
    });

    it('renders column header', function() {
      let data = DataSet.fromData([{id: 'someid'}]);
      renderer.render(
        <DataTableBase
          columns={[
            {valueKey: ['a']},
          ]}
          selectedRowClassName="selected"
          selected="someid"
          data={data}
          DOMSize={{widget: 100, height: 100}}
          />
      );
      let column = renderer.findWithElement(<Column />);
      assert(column.props.headerRenderer);
      column.props.headerRenderer('Label', 'a', column.props.columnData);
    });

    it('renders column', function() {
      let data = DataSet.fromData([{a: 'val'}]);
      renderer.render(
        <DataTableBase
          columns={[
            {valueKey: ['a']},
          ]}
          data={data}
          DOMSize={{widget: 100, height: 100}}
          />
      );
      let column = renderer.findWithElement(<Column />);
      assert(column.props.cellRenderer);
      column.props.cellRenderer('a', 'val', {a: 'val'}, 0, column.props.columnData);
    });

    it('delegates to scroller on touch devices', function() {
      Environment.isTouchDevice = true;
      let data = DataSet.fromData([{a: 'val'}]);
      renderer.render(
        <DataTableBase
          columns={[
            {valueKey: ['a']},
          ]}
          data={data}
          DOMSize={{width: 100, height: 100}}
          />
      );
      renderer.instance.scroller = {
        setDimensions: spy(),
      };
      let table = renderer.findWithElement(<Table />);
      assert(table.props.onContentHeightChange);
      table.props.onContentHeightChange(200, 200);
      assert(renderer.instance.scroller.setDimensions.calledOnce);
      assert.deepEqual(
        renderer.instance.scroller.setDimensions.firstCall.args,
        [100, 100, 200, 200]
      );
      Environment.isTouchDevice = false;
    });

  });

});

