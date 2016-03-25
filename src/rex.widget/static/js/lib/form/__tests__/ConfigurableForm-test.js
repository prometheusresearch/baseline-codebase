/**
 * @copyright 2016, Prometheus Research, LLC
 */

import Sinon from 'sinon';
import assert from 'power-assert';
import React from 'react';
import TestUtils from 'react-addons-test-utils';
import {getMountedInstance} from 'react-shallow-testutils';

import ConfigurableForm from '../ConfigurableForm';
import Form from '../Form';

describe('<ConfigurableForm />', function() {

  it('renders', function() {
    let fields = [
      {type: 'string', valueKey: 'a'},
    ];
    let onChange = Sinon.spy();
    let renderer = TestUtils.createRenderer();
    renderer.render(
      <ConfigurableForm
        entity="obj"
        fields={fields}
        onChange={onChange}
        />
    );
    let root = renderer.getRenderOutput();
    assert(root.type === Form);
    assert(root.props.onChange);
    root.props.onChange({obj: [{a: 42}]}, {});
    assert(onChange.calledOnce);
  });


  it('delegates submit to underlying form', function() {
    let fields = [
      {type: 'string', valueKey: 'a'},
    ];
    let onChange = Sinon.spy();
    let renderer = TestUtils.createRenderer();
    renderer.render(
      <ConfigurableForm
        entity="obj"
        fields={fields}
        onChange={onChange}
        />
    );
    let root = renderer.getRenderOutput();
    let form = getMountedInstance(renderer);
    let underlyingFormMock = {submit: Sinon.spy()};
    root.ref(underlyingFormMock);
    form.submit();
    assert(underlyingFormMock.submit.calledOnce);
  });


  it('recomputes schema on fields change', function() {
    let prevFields = [
      {type: 'string', valueKey: 'a'},
    ];
    let nextFields = [
      {type: 'string', valueKey: 'b'},
    ];
    let renderer = TestUtils.createRenderer();
    renderer.render(
      <ConfigurableForm
        entity="obj"
        fields={prevFields}
        />
    );
    let root = renderer.getRenderOutput();
    let prevSchema = root.props.schema;
    renderer.render(
      <ConfigurableForm
        entity="obj"
        fields={nextFields}
        />
    );
    root = renderer.getRenderOutput();
    assert(prevSchema !== root.props.schema);
  });
});


