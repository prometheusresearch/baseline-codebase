/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';
import {createRenderer, assert, spy} from '../../../testutils';

import {DataTable, DataSpec} from '../DataTable';
import DataTableBase from '../DataTableBase';
import {DataSet, port} from '../../data';

describe('rex-widget/datatable', function() {

  describe('<DataTable />', function() {

    let renderer;

    beforeEach(function() {
      renderer = createRenderer();
    });

    it('renders', async function() {
      renderer.render(
        <DataTable
          dataParams={{pagination: {top: 10, skip: 0}}}
          fetched={{data: {data: 'data'}}}
          />
      );
      renderer.assertElement(<DataTableBase />);
    });

    it('onPagination updates data params', async function() {
      let setDataParams = spy();
      renderer.render(
        <DataTable
          dataParams={{pagination: {top: 10, skip: 0}}}
          setDataParams={setDataParams}
          fetched={{data: {data: 'data'}}}
          />
      );
      let table = renderer.findWithElement(<DataTableBase />);
      assert(table.props.onPagination);
      table.props.onPagination('nextPagination');
      assert(setDataParams.calledOnce);
      assert.deepEqual(setDataParams.firstCall.args, [{pagination: 'nextPagination'}]);
    });

    it('onSort updates data params', async function() {
      let setDataParams = spy();
      renderer.render(
        <DataTable
          pagination={{top: 10, skip: 0}}
          dataParams={{pagination: {top: 10, skip: 0}}}
          setDataParams={setDataParams}
          fetched={{data: {data: 'data'}}}
          />
      );
      let table = renderer.findWithElement(<DataTableBase />);
      assert(table.props.onSort);
      table.props.onSort('nextSort');
      assert(setDataParams.calledOnce);
      assert.deepEqual(
        setDataParams.firstCall.args,
        [{pagination: {top: 10, skip: 0}, sort: 'nextSort'}]);
    });

    it('data updates invalidates pagination', async function() {
      let setDataParams = spy();
      renderer.render(
        <DataTable
          pagination={{top: 10, skip: 0}}
          dataParams={{pagination: {top: 10, skip: 10}}}
          setDataParams={setDataParams}
          fetched={{data: {data: 'data'}}}
          data={port('/path')}
          />
      );
      let table = renderer.findWithElement(<DataTableBase />);
      assert.deepEqual(table.props.pagination, {top: 10, skip: 10});
      renderer.render(
        <DataTable
          pagination={{top: 10, skip: 0}}
          dataParams={{pagination: {top: 10, skip: 10}}}
          setDataParams={setDataParams}
          fetched={{data: {data: 'data'}}}
          data={port('/path').params({a: 12})}
          />
      );
      assert(setDataParams.calledOnce);
      assert.deepEqual(
        setDataParams.firstCall.args,
        [{pagination: {top: 10, skip: 0}}]);
    });

  });

  describe('DataSpec', function() {

    it('fetches dataset', function() {
      assert(
        DataSpec.fetch({
          data: port('/path'),
          pagination: {top: 10, skip: 0},
          sort: {valueKey: 'a', asc: true}
        }).data.equals(
          port('/path').sort('a', true).limit(10, 0)
        )
      );
      assert(
        DataSpec.fetch({
          data: port('/path'),
          pagination: {top: 10, skip: 0},
          sort: {valueKey: null, asc: true}
        }).data.equals(
          port('/path').limit(10, 0)
        )
      );
    });

    it('updates dataset', function() {
      let data;
      let prevData;

      data = DataSet.fromData([1, 2]);
      prevData = null;
      assert(
        DataSpec.update({pagination: {skip: 0}}, data, prevData).data,
        [1, 2]
      );

      data = DataSet.fromData([3, 4]);
      prevData = DataSet.fromData([1, 2]);
      assert.deepEqual(
        DataSpec.update({pagination: {skip: 2}}, data, prevData).data,
        [1, 2, 3, 4]
      );

      data = DataSet.fromData([]);
      prevData = DataSet.fromData([1, 2]);
      assert(
        !DataSpec.update({pagination: {skip: 2}}, data, prevData).hasMore
      );
    });
 
  });

});

