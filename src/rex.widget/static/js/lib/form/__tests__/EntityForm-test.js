/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React             = require('react');
var TestUtils         = require('react-addons-test-utils');
var PortMock          = require('../../PortMock');
var DataSpecification = require('../../DataSpecification');
var Fieldset          = require('../Fieldset');
var EntityForm        = require('../EntityForm');
var Field             = require('../Field');
var Input             = require('../Input');

function findInputs(form) {
  var inputs = {};
  TestUtils.scryRenderedComponentsWithType(form, Input).forEach(input => {
    inputs[input._owner.props.select] = input;
  });
  return inputs;
}

describe('EntityForm', function() {

  var Form = React.createClass({

    render() {
      return (
        <EntityForm
          {...this.props}
          ref="form"
          entity="individual"
          submitTo={new DataSpecification.Entity(this.port)}
          onSubmitComplete={this.onSubmitComplete}
          />
      );
    },

    componentWillMount() {
      this.port = new PortMock();
    },

    componentDidMount() {
      this.inputs = findInputs(this);
    },

    onSubmitComplete() {
      this.submitted = true;
    },

    submit() {
      this.refs.form.submit();
    }
  });

  it('works in insert mode', function() {
    var schema = {
      type: 'object',
      properties: {
        first_name: {type: 'string'},
        last_name: {type: 'string'}
      }
    }
    var form = TestUtils.renderIntoDocument(
      <Form insert schema={schema}>
        <Field select="first_name" />
        <Field select="last_name" />
      </Form>
    );
    form.inputs.first_name.props.onChange('first');
    form.inputs.last_name.props.onChange('last');
    form.submit();

    waitsFor(function() { return form.submitted; }, 20);

    expect(form.port.replaceCalls.length).toEqual(1);
    var {prevEntity, entity} = form.port.replaceCalls[0];
    expect(prevEntity).toEqual(null);
    expect(entity).toEqual({
      individual: [
        {
          first_name: 'first',
          last_name: 'last'
        }
      ]
    });
  });

  it('works in edit mode', function() {
    var schema = {
      type: 'object',
      properties: {
        first_name: {type: 'string'},
        last_name: {type: 'string'}
      }
    }
    var form = TestUtils.renderIntoDocument(
      <Form value={{first_name: 'x'}} schema={schema}>
        <Field select="first_name" />
        <Field select="last_name" />
      </Form>
    );
    form.inputs.first_name.props.onChange('first');
    form.inputs.last_name.props.onChange('last');
    form.submit();

    waitsFor(function() { return form.submitted; }, 20);

    expect(form.port.replaceCalls.length).toEqual(1);
    var {prevEntity, entity} = form.port.replaceCalls[0];
    expect(prevEntity).toEqual({
      individual: [
        {
          first_name: 'x'
        }
      ]
    });
    expect(entity).toEqual({
      individual: [
        {
          first_name: 'first',
          last_name: 'last'
        }
      ]
    });
  });

  it('creates facets automatically', function() {
    var schema = {
      type: 'object',
      properties: {
        facet: {
          type: 'object',
          properties: {
            first_name: {type: 'string'},
            last_name: {type: 'string'}
          }
        }
      }
    }
    var form = TestUtils.renderIntoDocument(
      <Form value={{id: 'x'}} schema={schema}>
        <Fieldset select="facet">
          <Field select="first_name" />
          <Field select="last_name" />
        </Fieldset>
      </Form>
    );
    form.inputs.first_name.props.onChange('first');
    form.inputs.last_name.props.onChange('last');
    form.submit();

    waitsFor(function() { return form.submitted; }, 20);

    expect(form.port.replaceCalls.length).toEqual(1);
    var {prevEntity, entity} = form.port.replaceCalls[0];
    expect(prevEntity).toEqual({
      individual: [
        {
          id: 'x'
        }
      ]
    });
    expect(entity).toEqual({
      individual: [
        {
          id: 'x',
          facet: {
            first_name: 'first',
            last_name: 'last'
          }
        }
      ]
    });
  });

  it('creates facets automatically', function() {
    var schema = {
      type: 'object',
      properties: {
        facet: {
          type: 'object',
          properties: {
            first_name: {type: 'string'},
            last_name: {type: 'string'}
          }
        }
      }
    }
    var form = TestUtils.renderIntoDocument(
      <Form value={{id: 'x'}} schema={schema}>
        <Fieldset select="facet">
          <Field select="first_name" />
          <Field select="last_name" />
        </Fieldset>
      </Form>
    );
    form.inputs.first_name.props.onChange('first');
    form.inputs.last_name.props.onChange('last');
    form.submit();

    waitsFor(function() { return form.submitted; }, 20);

    expect(form.port.replaceCalls.length).toEqual(1);
    var {prevEntity, entity} = form.port.replaceCalls[0];
    expect(prevEntity).toEqual({
      individual: [
        {
          id: 'x'
        }
      ]
    });
    expect(entity).toEqual({
      individual: [
        {
          id: 'x',
          facet: {
            first_name: 'first',
            last_name: 'last'
          }
        }
      ]
    });
  });

});
