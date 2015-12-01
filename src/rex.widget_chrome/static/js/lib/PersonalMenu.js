/**
 * @copyright 2015, Prometheus Research, LLC
 */

'use strict';


var React = require('react/addons');
var RexWidget = require('rex-widget');
var {VBox} = RexWidget.Layout;


var PersonalMenu = React.createClass({
  styleMenu: {
    position: 'absolute',
    zIndex: 1000,
    top: 50,
    right: 0,
    background: 'white',
    boxShadow: '1px 0 5px 0px #ddd'
  },

  render: function () {
    var {links, ...props} = this.props;

    links = links.map((link, idx) => {
      return (
        <li key={idx}>
          <a href={link.url}>{link.label}</a>
        </li>
      );
    });

    return (
      <VBox {...props}
        flex={1}
        style={this.styleMenu}
        className="ra-AppletPage-personalMenu">
        <ul className="nav nav-pills nav-stacked">
          {links}
        </ul>
      </VBox>
    );
  }
});


module.exports = PersonalMenu;

