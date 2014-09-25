/**
 * @jsx React.DOM
 */
'use strict';

var React = require('react');
var Link  = require('rex-widget/lib/Link');
var Icon  = require('rex-widget/lib/Icon');

var NavigationListItem = React.createClass({

  render() {
    var {icon, to, label, description} = this.props;
    return (
      <Link className="rw-NavigationListItem" to={to}>
        {icon && <Icon name="user" className="rw-NavigationListItem__icon" />}
        <div className="rw-NavigationListItem__text">
          <div className="rw-NavigationListItem__link">{label}</div>
          {description && <div className="rw-NavigationListItem__desc">{description}</div>}
        </div>
      </Link>
    );
  }
});

var NavigationList = React.createClass({

  render() {
    var items = this.props.items.map((item) =>
      <li key={item.to}>
        <NavigationListItem
          icon={item.icon}
          to={item.to}
          label={item.label}
          description={item.description}
          />
      </li>
    );
    return this.transferPropsTo(
      <ul className="rw-NavigationList nav nav-list">
        {items}
      </ul>
    );
  }
});

module.exports = NavigationList;
