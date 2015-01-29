/** @jsx React.DOM */
'use strict';

var React  = require('react/addons');
var cx     = React.addons.classSet;

var Section = React.createClass({

  getDefaultProps: function () {
    return {
      title: '',
      head: null
    };
  },

  render() {
    var {className, title, head} = this.props;
    className = cx('rfb-Section', className);
    return (
      <div className={className}>
        <div className="rfb-Section__head">
          <span className="rfb-Section__title">{title}</span>
          {head}
        </div>
        <div className="rfb-Section__content">
          {this.props.children}
        </div>
      </div>
    );
  },
});

module.exports = Section;
