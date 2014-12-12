/**
 * @jsx React.DOM
 */
'use strict';

var React              = require('react/addons');
var cx                 = React.addons.classSet;
var Button             = require('../Button');
var ReactForms         = require('react-forms');
var Form               = ReactForms.Form;
var emptyFunction      = require('../emptyFunction');
var {Map}              = require('immutable');
var {Mapping, List, ScalarNode,
      Scalar, Variant} = ReactForms.schema;

class InstrumentID extends ScalarNode {

  constructor(props) {
    var defaultProps = {label: 'Instrument ID'};
    super(Map(defaultProps).merge(props));
  }

  validate(value) {
    if (!/^[a-z0-9-]+$/.test(value)) {
      return new Error('invalid instrument ID');
    }
  }

}

var newInstrumentSchema = Mapping({
  instrument: InstrumentID.create({
    required: true,
    label: 'Instrument ID:'
  }),
  title: Scalar({
    required: true,
    label: 'Title:'
  })
});

var NewInstrumentForm = React.createClass({

  render() {
    return (
      <div className="rfb-new-instrument">
        <Form
          schema={newInstrumentSchema}
          ref="newInstrumentForm"
          onUpdate={this.onUpdate}
          />
        <Button disabled={!this.state.allowCreate}
                onClick={this.onSubmit}>
          Create
        </Button>
      </div>
    );
  },

  getDefaultProps() {
    return {onCreateInstrument: emptyFunction};
  },

  getInitialState() {
    return {
      allowCreate: false,
    };
  },

  onUpdate(_, validation) {
    var allowCreate = validation.isSuccess;
    this.setState({allowCreate});
  },

  onSubmit() {
    var value = this.refs.newInstrumentForm.getValue().toJS();
    this.props.onCreateInstrument(value.instrument, value.title);
  }

});

module.exports = NewInstrumentForm;
