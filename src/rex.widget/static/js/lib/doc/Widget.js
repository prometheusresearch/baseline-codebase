/**
 * @copyright 2015, prometheus research, llc
 */
'use strict';

var React   = require('react');
var {VBox}  = require('../layout');
var Field   = require('./Field');

var Widget = React.createClass({

  style: {
    overflow: 'auto'
  },

  render() {
    var {widget} = this.props;
    return (
      <VBox style={this.style} size={1}>
        <VBox margin={10}>
          <VBox>
            <h1>{widget.name}</h1>
            <p>{widget.doc}</p>
          </VBox>
          <VBox>
            {widget.fields.map(field =>
              <Field
                key={field.name}
                field={field}
                />
            )}
          </VBox>
        </VBox>
      </VBox>
    );
  }
});

module.exports = Widget;
