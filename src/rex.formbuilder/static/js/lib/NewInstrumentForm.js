/**
 * @jsx React.DOM
 */
'use strict';

var React              = require('react');
var cx                 = React.addons.classSet;
var Button             = require('./Button');
var ReactForms         = require('react-forms');
var Form               = ReactForms.Form;
var {Mapping, List,
      Scalar, Variant} = ReactForms.schema;

var NewInstrumentForm = React.createClass({

  getInitialState: function () {
    return {
      allowCreate: false,
    };
  },

  NewInstrumentSchema: function (props) {
    var validator = function (v) {
      if (!/^[a-z0-9-]+$/.test(v)) {
        return new Error('invalid instrument ID');
      }
    };
    return Mapping({}, {
      instrument: Scalar({
        label: 'Instrument ID:',
        validate: validator,
        required: true
      }),
      title: Scalar({
        label: 'Title:',
        required: true
      })
    });
  },

  onNewInstrumentFormChanged: function (val, result) {
    this.setState({
      allowCreate: result.isSuccess
    });
  },

  onCreateClicked: function () {
    var value = this.refs.newInstrumentForm.getValue();
    if (this.props.onCreateInstrument)
      this.props.onCreateInstrument(value.instrument, value.title);
  },

  render: function() {
    var schema = this.NewInstrumentSchema({});
    return (
      <div className="rfb-new-instrument">
        <Form
          schema={schema}
          ref="newInstrumentForm"
          onUpdate={this.onNewInstrumentFormChanged}
          />
        <Button disabled={!this.state.allowCreate}
                onClick={this.onCreateClicked}>
          Create
        </Button>
      </div>
    );
  }

});

module.exports = NewInstrumentForm;
