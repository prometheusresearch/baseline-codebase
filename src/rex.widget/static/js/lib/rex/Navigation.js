/**
 * @jsx React.DOM
 */
'use strict';

var React     = require('react');
var cx        = require('react/lib/cx');
var isString  = require('rex-widget/lib/isString');
var Link      = require('rex-widget/lib/Link');

var AppletSwitcher = React.createClass({

  render() {
    var {applets} = this.props;
    return (
      <div className="rw-AppletSwitcher navbar-brand dropdown">
        <span className="caret"></span>
        <ul className="dropdown-menu" role="menu">
          <li><Link unsafe href="/">All applications</Link></li>
          <li className="divider"></li>
          {applets.map((applet) =>
            <li key={applet.name}>
              <a href={applet.href}>{applet.title}</a>
            </li>)}
        </ul>
      </div>
    );
  }
});

var Navigation = React.createClass({

  render() {
    var {active, sitemap, applets, applicationName} = this.props;
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
            <Link unsafe href="/" className="rw-Navigation__title navbar-brand">
              {applets.active ?
                <span>{applicationName} &mdash; {applets.active.title}</span> :
                <span>{applicationName}</span>}
            </Link>
            {applets.applets.length > 0 && <AppletSwitcher applets={applets.applets} />}
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
