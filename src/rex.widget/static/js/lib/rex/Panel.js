/**
 * @jsx React.DOM
 */
'use strict';

var React     = require('react/addons');
var PropTypes = React.PropTypes;
var cx        = React.addons.classSet;

var Panel = React.createClass({

  propTypes: {
    title: PropTypes.string,
    toolbar: PropTypes.renderable,
    children: PropTypes.renderable
  },

  render() {
    var className = cx(
      'rw-Panel',
      this.props.className
    )
    return (
      <div className={className}>
        <div className="rw-Panel__header">
          <h3 className="rw-Panel__title">
            {this.props.title}
          </h3>
          {this.props.toolbar &&
            <div className="rw-Panel__toolbar">
              {this.props.toolbar}
            </div>}
        </div>
        <div className="rw-Panel__children">
          {this.props.children}
        </div>
      </div>
    );
  }
});

module.exports = Panel;
