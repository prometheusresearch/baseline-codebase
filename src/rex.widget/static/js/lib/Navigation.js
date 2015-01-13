/**
 * @jsx React.DOM
 */
'use strict';

var React     = require('react/addons');
var cx        = React.addons.classSet;
var isString  = require('rex-widget/lib/isString');
var Link      = require('rex-widget/lib/Link');
var Element   = require('./layout/Element');

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
    var {active, menu, sitemap, applets, applicationName} = this.props;
    var navBarClassName = cx({
      'collapse': this.state.collapse,
      'navbar-collapse': true
    });
    return (
      <Element className="rw-Navigation navbar navbar-default" role="navigation">
        <div className="rw-Navigation__container container-fluid">
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
            <NavigationBar menu={menu} sitemap={sitemap} active={active} />
          </div>
        </div>
      </Element>
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
    var {menu, sitemap: {pages, locations}, active, ...props} = this.props;
    if (!menu) {
      return null;
    }
    var links = menu.map((item) => {
      if (isString(item)) {
        item = {id: item};
      }
      var className = cx({
        'rw-NavigationBar__item': true,
        'active': active === item.id
      });
      var page = pages[item.id];
      return (
        <li className={className} key={item.id}>
          {page && <Link to={item.id}>{item.title || page.title}</Link>}
        </li>
      );
    });
    return (
      <ul {...props} className="rw-NavigationBar nav navbar-nav">
        {links}
      </ul>
    );
  }
});

module.exports = Navigation;
