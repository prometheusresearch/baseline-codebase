/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React        = require('react/addons');
var Action       = require('../Action');

var Page = React.createClass({

  render() {
    var {width, title, text, onClose} = this.props;
    return (
      <Action title={title} onClose={onClose} width={width}>
        <div dangerouslySetInnerHTML={{__html: text}} />
      </Action>
    );
  },

  getDefaultProps() {
    return {
      width: 480,
      title: 'Page',
      icon: 'file'
    };
  }
});

module.exports = Page;
