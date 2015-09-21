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

/**
 * Renders a <div> with the given text and style.
 */
var Text = React.createClass({

  propTypes: {
    /**
     * string
     *
     * The text to display.
     */
    text: React.PropTypes.string,
    
    /**
     * object
     *
     * css style object.
     */
    style: React.PropTypes.object
  },
  
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
