/**
 * @jsx React.DOM
 */

'use strict';

var React = require('react');


var Menu = React.createClass({
  propTypes: {
    mountPoint: React.PropTypes.string.isRequired,
    demos: React.PropTypes.object.isRequired
  },

  buildMenuItems: function () {
    return Object.keys(this.props.demos).sort((a, b) => {
      var titleA = this.props.demos[a].title.toUpperCase();
      var titleB = this.props.demos[b].title.toUpperCase();

      if (titleA < titleB) {
        return -1;
      }
      if (titleA > titleB) {
        return 1;
      }
      return 0;
    }).map((id) => {
      var demo = this.props.demos[id];
      return (
        <li key={demo.id}>
          <a href={this.props.mountPoint + '/demo/' + demo.id}>{demo.title}</a>
        </li>
      );
    });
  },

  render: function () {
    return (
      <div className='rfd-Menu'>
        <h1>Choose a Form to Test</h1>
        <ul>
          {this.buildMenuItems()}
        </ul>
      </div>
    );
  }
});


module.exports = Menu;

