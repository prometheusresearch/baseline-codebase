/**
 * @copyright 2015, prometheus research, llc
 */
'use strict';

var React   = require('react');
var {VBox}  = require('../layout');

var Placeholder = React.createClass({

    style: {
      color: '#ccc'
    },

    render() {
      return (
        <VBox size={1} centerHorizontally centerVertically>
          <VBox style={this.style}>
            Choose widget from the sidebar at the left
          </VBox>
        </VBox>
      );
    }
});

module.exports = Placeholder;
