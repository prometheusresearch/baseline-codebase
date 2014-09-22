/**
 * @jsx React.DOM
 */
'use strict';

var React     = require('react');
var cx        = require('react/lib/cx');
var isString  = require('rex-widget/lib/isString');
var Link      = require('rex-widget/lib/Link');

var Navigation = React.createClass({

  render() {
    var {active, sitemap} = this.props;
    var navBarClassName = cx({
      'collapse': this.state.collapse,
      'navbar-collapse': true
    });
    return (
      <nav className="rw-Navigation navbar navbar-default" role="navigation">
        <div className="container-fluid">
          <div className="navbar-header">
            <button
              onClick={this.toggleNavbar}
              type="button"
              className="navbar-toggle collapsed">
              <span className="sr-only">Toggle navigation</span>
              <span className="icon-bar" />
              <span className="icon-bar" />
              <span className="icon-bar" />
            </button>
            <Link className="rw-Navigation__title navbar-brand" to="dashboard">
              {this.props.applicationName}
            </Link>
          </div>
          <div className={navBarClassName}>
            <NavigationBar sitemap={sitemap} active={active} />
          </div>
        </div>
      </nav>
    );
  },

  getInitialState() {
    return {collapse: true};
  },

  toggleNavbar() {
    var collapse = !this.state.collapse;
    this.setState({collapse});
  }
});

var NavigationBar = React.createClass({

  render() {
    var {sitemap: {menu, pages, locations}} = this.props;
    var links = this.props.sitemap.menu.map((item) => {
      if (isString(item)) {
        item = {id: item};
      }
      var className = cx({
        'rw-NavigationBar__item': true,
        'active': this.props.active === item.id
      });
      var page = pages[item.id];
      return (
        <li className={className} key={item.id}>
          <Link to={item.id}>{item.title || page.title}</Link>
        </li>
      );
    });
    return (
      <ul className="rw-NavigationBar nav navbar-nav">
        {links}
      </ul>
    );
  }
});

module.exports = Navigation;
