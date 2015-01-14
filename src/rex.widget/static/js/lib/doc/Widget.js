/**
 * @copyright 2015, prometheus research, llc
 */
'use strict';

var React         = require('react');
var {VBox, HBox}  = require('../layout');
var Icon          = require('../Icon');
var Field         = require('./Field');
var Label         = require('./Label');

var Widget = React.createClass({

  style: {
    overflow: 'auto'
  },

  render() {
    var {widget} = this.props;
    var {showFields} = this.state;
    return (
      <VBox style={this.style} size={1}>
        <VBox margin={10}>
          <VBox>
            <h1>{widget.name}</h1>
            <p>{widget.doc}</p>
          </VBox>
          <HBox>
            <VBox>
              <h4>Fields</h4>
            </VBox>
            <VBox>
              <Label onClick={this._toggleFields}>
                {showFields ? 'hide' : 'show'}
              </Label>
            </VBox>
          </HBox>
          {showFields &&
            <VBox>
              {widget.fields.map(field =>
                <Field
                  key={field.name}
                  field={field}
                  />
              )}
            </VBox>}
        </VBox>
      </VBox>
    );
  },

  getInitialState() {
    return {
      showFields: true
    };
  },

  _toggleFields(e) {
    e.preventDefault();
    var showFields = !this.state.showFields;
    this.setState({showFields});
  }
});

module.exports = Widget;
