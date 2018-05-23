/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';
import {assert, createRenderer, spy, stub} from '../../../testutils';

import EntityForm from '../EntityForm';
import Form from '../Form';
import * as data from '../../data';

describe('rex-widget/form', function() {

  let renderer;

  let value = {a: 1};
  let schema = {
    type: 'object',
    properties: {
      a: {type: 'number'},
    }
  };

  beforeEach(function() {
    renderer = createRenderer();
  });

  describe('<EntityForm />', function() {

    it('renders a form', function() {
      renderer.render(
        <EntityForm value={value} schema={schema} entity="entity" />
      );
      let form = renderer.findWithElement(<Form />);
      assert.deepEqual(
        form.props.schema,
        {
          type: 'object',
          properties: {
            entity: {
              type: 'array',
              items: schema,
            }
          },
          required: ['entity'],
        }
      );
      assert.deepEqual(
        form.props.value,
        {
          entity: [value]
        }
      );
    });

    it('delegates submit to form', function() {
      renderer.render(
        <EntityForm value={value} schema={schema} entity="entity" />
      );
      let form = renderer.findWithElement(<Form />);
      let formInstanceStub = {submit: spy()};
      form.ref(formInstanceStub);
      renderer.instance.submit();
      assert(formInstanceStub.submit.calledOnce);
    });

    it('provides correct value onSubmitComplete (port)', function() {
      let form;
      let onSubmitComplete = spy();
      renderer.render(
        <EntityForm
          value={value}
          schema={schema}
          entity="entity"
          onSubmitComplete={onSubmitComplete}
          submitTo={data.port('/path')}
          />
      );
      form = renderer.findWithElement(<Form />);
      assert(form.props.onSubmitComplete);
      form.props.onSubmitComplete({entity: ['data']});
      assert(onSubmitComplete.callCount === 1);
      assert(onSubmitComplete.firstCall.args[0] === 'data');
    });

    it('provides correct value onSubmitComplete (mutation)', function() {
      let form;
      let onSubmitComplete = spy();
      renderer.render(
        <EntityForm
          value={value}
          schema={schema}
          entity="entity"
          onSubmitComplete={onSubmitComplete}
          submitTo={data.mutation('/path')}
          />
      );
      form = renderer.findWithElement(<Form />);
      assert(form.props.onSubmitComplete);
      form.props.onSubmitComplete({entity: ['data']});
      assert(onSubmitComplete.callCount === 1);
      assert(onSubmitComplete.firstCall.args[0] === 'data');
    });

    it('provides correct value onSubmitComplete (query)', function() {
      let form;
      let onSubmitComplete = spy();
      renderer.render(
        <EntityForm
          value={value}
          schema={schema}
          entity="entity"
          onSubmitComplete={onSubmitComplete}
          submitTo={data.query('/path')}
          />
      );
      form = renderer.findWithElement(<Form />);
      assert(form.props.onSubmitComplete);
      form.props.onSubmitComplete('data');
      assert(onSubmitComplete.callCount === 1);
      assert(onSubmitComplete.firstCall.args[0] === 'data');
    });

    it('refreshes components onSubmitComplete', function() {
      let form;
      renderer.render(
        <EntityForm
          value={value}
          schema={schema}
          entity="entity"
          submitTo={data.query('/path')}
          />
      );

      stub(data, 'forceRefreshData');

      form = renderer.findWithElement(<Form />);

      assert(!data.forceRefreshData.calledOnce);
      form.props.onSubmitComplete('data');
      assert(data.forceRefreshData.calledOnce);

      data.forceRefreshData.restore();

    });

    it('transforms value on submit (custom prop)', function() {
      let transformValueOnSubmit = stub().returns('tr-data');
      renderer.render(
        <EntityForm
          value={value}
          schema={schema}
          entity="entity"
          submitTo={data.query('/path')}
          transformValueOnSubmit={transformValueOnSubmit}
          />
      );
      let form = renderer.findWithElement(<Form />);
      assert(form.props.transformValueOnSubmit);
      assert(form.props.transformValueOnSubmit('data') === 'tr-data');
      assert(transformValueOnSubmit.calledOnce);
      assert(transformValueOnSubmit.firstCall.args[0] === 'data');
    });

    it('transforms value on submit (query)', function() {
      renderer.render(
        <EntityForm
          value={value}
          schema={schema}
          entity="entity"
          submitTo={data.query('/path')}
          />
      );
      let form = renderer.findWithElement(<Form />);
      assert(form.props.transformValueOnSubmit);
      assert(form.props.transformValueOnSubmit('data') === 'data');
    });

    it('transforms value on submit (port)', function() {
      renderer.render(
        <EntityForm
          value={value}
          schema={schema}
          entity="entity"
          submitTo={data.port('/path')}
          />
      );
      let form = renderer.findWithElement(<Form />);
      assert(form.props.transformValueOnSubmit);
      assert(form.props.transformValueOnSubmit({entity: ['data']}) === 'data');
    });

    it('transforms value on submit (mutation)', function() {
      renderer.render(
        <EntityForm
          value={value}
          schema={schema}
          entity="entity"
          submitTo={data.mutation('/path')}
          />
      );
      let form = renderer.findWithElement(<Form />);
      assert(form.props.transformValueOnSubmit);
      assert(form.props.transformValueOnSubmit({entity: ['data']}) === 'data');
    });

  });

});

