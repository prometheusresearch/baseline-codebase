/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';
import {spy, stub, createRenderer, assert} from '../../../testutils';

import Form from '../Form';
import Field from '../Field';
import Fieldset from '../Fieldset';
import * as ui from '../../ui';
import * as data from '../../data';
import {delay} from '../../lang';

describe('rex-widget/form', function() {

  describe('<Form />', function() {

    let renderer;

    beforeEach(function() {
      renderer = createRenderer();
    });

    afterEach(function() {
      renderer = null;
    });

    function currentFormValue() {
      let fieldset = renderer.findWithElement(<Fieldset />);
      return fieldset.props.formValue;
    }

    it('renders', function() {
      renderer.render(
        <Form>
          <Field select="a" />
        </Form>
      );

      renderer.assertElement(<Field select="a" />);
      renderer.assertElement(<Fieldset />);
      renderer.assertElement(<ui.SuccessButton>Submit</ui.SuccessButton>);

      let fieldset = renderer.findWithElement(<Fieldset />);
      assert(fieldset.props.formValue);
      assert.deepEqual(fieldset.props.formValue.value, {});
    });

    it('renders with defaultValue', function() {
      renderer.render(
        <Form value={{a: 42}}>
          <Field select="a" />
        </Form>
      );

      let fieldset = renderer.findWithElement(<Fieldset />);
      assert(fieldset.props.formValue);
      assert.deepEqual(fieldset.props.formValue.value, {a: 42});
    });

    it('renders with custom submit button', function() {
      renderer.render(
        <Form submitButton={<ui.DangerButton>OK</ui.DangerButton>}>
          <Field select="a" />
        </Form>
      );

      renderer.assertElement(<ui.DangerButton>OK</ui.DangerButton>);
    });

    it('reacts on value change', async function() {
      renderer.render(
        <Form>
          <Field select="a" />
        </Form>
      );

      let fieldset;
      let formValue;

      fieldset = renderer.findWithElement(<Fieldset />);
      formValue = fieldset.props.formValue;
      assert.deepEqual(formValue.value, {});

      formValue.select('a').update(42);

      await delay();

      fieldset = renderer.findWithElement(<Fieldset />);
      formValue = fieldset.props.formValue;
      assert.deepEqual(formValue.value, {a: 42});
    });

    it('disables button while a submit is in progress', async function() {
      let currentSubmit = null;
      let port = data.port('/path');
      stub(port, 'replace', () => {
        currentSubmit = delay(25).then(() => ({a: 42}));
        return currentSubmit;
      });

      let findSubmitButton = () => renderer.findWithElement(<ui.SuccessButton />);

      renderer.render(
        <Form submitTo={port} value={{a: 0}}>
          <Field select="a" />
        </Form>
      );

      assert(!findSubmitButton().props.disabled);

      renderer.instance.submit();

      await delay(5);

      await currentSubmit;

      assert(!findSubmitButton().props.disabled);
    });

    it('submits data to a port', async function() {
      let currentSubmit = null;
      let port = data.port('/path');
      stub(port, 'replace', () => {
        currentSubmit = delay(5).then(() => ({a: 42}));
        return currentSubmit;
      });

      renderer.render(
        <Form submitTo={port} value={{a: 0}}>
          <Field select="a" />
        </Form>
      );

      renderer.instance.submit();

      await currentSubmit;

      assert(port.replace.callCount === 1);
      let [prev, next] = port.replace.firstCall.args;
      assert.deepEqual(prev, {a: 0});
      assert.deepEqual(next, {a: 0});

    });

    it('submits data to a port (insert mode)', async function() {
      let currentSubmit = null;
      let port = data.port('/path');
      stub(port, 'insert', () => {
        currentSubmit = delay(5).then(() => ({a: 42}));
        return currentSubmit;
      });

      renderer.render(
        <Form submitTo={port} value={{a: 0}} insert>
          <Field select="a" />
        </Form>
      );

      renderer.instance.submit();

      await currentSubmit;

      assert(port.insert.callCount === 1);

      let [value] = port.insert.firstCall.args;
      assert.deepEqual(value, {a: 0});
    });

    it('submits data to a query', async function() {
      let currentSubmit = null;
      let query = data.query('/path');
      stub(query, 'execute', () => {
        currentSubmit = delay(5).then(() => ({a: 42}));
        return currentSubmit;
      });

      renderer.render(
        <Form submitTo={query} value={{a: 0}}>
          <Field select="a" />
        </Form>
      );

      renderer.instance.submit();

      await currentSubmit;

      assert(query.execute.callCount === 1);
      let [value] = query.execute.firstCall.args;
      assert.deepEqual(value, {a: 0});
    });

    it('submits data to a query (insert mode)', async function() {
      let currentSubmit = null;
      let query = data.query('/path');
      stub(query, 'execute', () => {
        currentSubmit = delay(5).then(() => ({a: 42}));
        return currentSubmit;
      });

      renderer.render(
        <Form submitTo={query} value={{a: 0}} insert>
          <Field select="a" />
        </Form>
      );

      renderer.instance.submit();

      await currentSubmit;

      assert(query.execute.callCount === 1);
      let [value] = query.execute.firstCall.args;
      assert.deepEqual(value, {a: 0});
    });

    it('submits data to a request', async function() {
      let currentSubmit = null;
      let request = data.request('/path');
      stub(request, 'produce', () => {
        currentSubmit = delay(5).then(() => ({a: 42}));
        return currentSubmit;
      });

      renderer.render(
        <Form submitTo={request} value={{a: 0}}>
          <Field select="a" />
        </Form>
      );

      renderer.instance.submit();

      await currentSubmit;

      assert(request.produce.callCount === 1);
      let [value] = request.produce.firstCall.args;
      assert.deepEqual(value, {a: 0});
    });

    it('submits data to a request (insert mode)', async function() {
      let currentSubmit = null;
      let request = data.request('/path');
      stub(request, 'produce', () => {
        currentSubmit = delay(5).then(() => ({a: 42}));
        return currentSubmit;
      });

      renderer.render(
        <Form submitTo={request} value={{a: 0}} insert>
          <Field select="a" />
        </Form>
      );

      renderer.instance.submit();

      await currentSubmit;

      assert(request.produce.callCount === 1);
      let [value] = request.produce.firstCall.args;
      assert.deepEqual(value, {a: 0});
    });

    it('submits data to a mutation', async function() {
      let currentSubmit = null;
      let mutation = data.mutation('/path');
      stub(mutation, 'execute', () => {
        currentSubmit = delay(5).then(() => ({a: 42}));
        return currentSubmit;
      });

      renderer.render(
        <Form submitTo={mutation} value={{a: 0}}>
          <Field select="a" />
        </Form>
      );

      renderer.instance.submit();

      await currentSubmit;

      assert(mutation.execute.callCount === 1);
      assert(mutation.execute.firstCall.args.length === 2);
      let [value, prevValue] = mutation.execute.firstCall.args;
      assert.deepEqual(value, {a: 0});
      assert.deepEqual(prevValue, {a: 0});
    });

    it('submits data to a mutation (insert mode)', async function() {
      let currentSubmit = null;
      let mutation = data.mutation('/path');
      stub(mutation, 'execute', () => {
        currentSubmit = delay(5).then(() => ({a: 42}));
        return currentSubmit;
      });

      renderer.render(
        <Form submitTo={mutation} value={{a: 0}} insert>
          <Field select="a" />
        </Form>
      );

      renderer.instance.submit();

      await currentSubmit;

      assert(mutation.execute.callCount === 1);
      assert(mutation.execute.firstCall.args.length === 1);
      let [value] = mutation.execute.firstCall.args;
      assert.deepEqual(value, {a: 0});
    });

    it('prevents submit invalid form', async function() {
      let mutation = data.mutation('/path');
      stub(mutation, 'execute', () => {
        return delay(5).then(() => ({a: 42}));
      });
      let schema = {type: 'object', properties: {a: {type: 'number'}}};

      renderer.render(
        <Form submitTo={mutation} value={{a: 'string'}} schema={schema} />
      );

      assert(!currentFormValue().params.forceShowErrors);

      renderer.instance.submit();

      await delay(0);

      assert(mutation.execute.callCount === 0);
      assert(currentFormValue().params.forceShowErrors);
    });

    it('calls onSubmitError on submit error', async function() {
      let error = new Error('oops');
      let onSubmitError = spy();
      let mutation = data.mutation('/path');
      stub(mutation, 'execute', () => {
        return Promise.reject(error);
      });
      renderer.render(
        <Form submitTo={mutation} onSubmitError={onSubmitError} />
      );

      renderer.instance.submit();

      await delay(0);

      assert(mutation.execute.calledOnce);
      assert(onSubmitError.calledOnce);
      assert(onSubmitError.firstCall.args.length === 1);
      assert.deepEqual(onSubmitError.firstCall.args[0], {error: error});
    });

    it('submits form via submitButton click', function() {
      renderer.render(
        <Form />
      );

      let event = {
        preventDefault: spy(),
        stopPropagation: spy(),
      };

      let button = renderer.findWithElement(<ui.SuccessButton />);
      stub(renderer.instance, 'submit');

      assert(button.props.onClick);
      button.props.onClick(event);

      assert(event.preventDefault.calledOnce);
      assert(event.stopPropagation.calledOnce);
      assert(renderer.instance.submit.calledOnce);
    });

    it('allows passing form context', function() {
      renderer.render(
        <Form context={{a: 42}} />
      );
      assert.deepEqual(currentFormValue().params.context, {a: 42});
      renderer.render(
        <Form context={{a: 43}} />
      );
      assert.deepEqual(currentFormValue().params.context, {a: 43});
    });

    it('allows passing form schema', async function() {
      let schema1 = {type: 'object', properties: {a: {type: 'number'}}};
      let schema2 = {type: 'object', properties: {a: {type: 'string'}}};
      renderer.render(
        <Form schema={schema1} value={{a: 'string'}} />
      );
      assert.deepEqual(currentFormValue().schema, schema1);
      assert(currentFormValue().completeErrorList.length === 1);
      renderer.render(
        <Form schema={schema2} />
      );
      await delay(10);
      assert.deepEqual(currentFormValue().schema, schema2);
      assert(currentFormValue().completeErrorList.length === 0);
    });

  });
});
