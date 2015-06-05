/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React = require('react');

var TextStyle = {
  self: {
    margin: '15px 0'
  }
};

var Text = React.createClass({

  render() {
    var {text, style, ...props} = this.props;
    return (
      <div
        {...props}
        dangerouslySetInnerHTML={{__html: text}}
        style={{...TextStyle.self, ...style}}
        />
    );
  }
});

module.exports = Text;
