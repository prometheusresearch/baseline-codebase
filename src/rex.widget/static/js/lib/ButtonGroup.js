/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React   = require('react/addons');
var {HBox}  = require('./layout');

var ButtonGroup = React.createClass({

  render() {
    var {buttons, ...props} = this.props;
    return (
      <HBox {...props} className="rw-ButtonGroup">
        {buttons}
      </HBox>
    );
  }

});

module.exports = ButtonGroup;
