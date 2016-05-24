/**
 * @jsx React.DOM
 */

'use strict';

var React = require('react');


var Menu = React.createClass({
  propTypes: {
    mountPoint: React.PropTypes.string.isRequired,
    demos: React.PropTypes.object.isRequired,
    recons: React.PropTypes.object.isRequired
  },

  buildMenuItems: function (items, urlPrefix) {
    return Object.keys(items).sort((a, b) => {
      var titleA = items[a].title.toUpperCase();
      var titleB = items[b].title.toUpperCase();

      if (titleA < titleB) {
        return -1;
      }
      if (titleA > titleB) {
        return 1;
      }
      return 0;
    }).map((id) => {
      var item = items[id];
      return (
        <li className='rfd-MenuItem' key={item.id}>
          <a href={urlPrefix + item.id}>{item.title}</a>
          {item.validation_errors &&
            <span className='rfd-MenuItem__invalid' title={item.validation_errors}>INVALID</span>
          }
        </li>
      );
    });
  },

  render: function () {
    return (
      <div className='rfd-Menu'>
        <div className='rfd-Menu-Demos'>
          <h1>Choose a Form to Test</h1>
          <ul>
            {this.buildMenuItems(this.props.demos, this.props.mountPoint + '/demo/')}
          </ul>
        </div>
        <div className='rfd-Menu-Recons'>
          <h1>Choose a Reconciliation to Test</h1>
          <ul>
            {this.buildMenuItems(this.props.recons, this.props.mountPoint + '/recon/')}
          </ul>
        </div>
      </div>
    );
  }
});


module.exports = Menu;

