/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React             = require('react/addons');
var RexWidget         = require('rex-widget');
var {VBox, HBox}      = RexWidget.Layout;
var NavigationButton  = require('./NavigationButton');
var NavigationBanner  = require('./NavigationBanner');

var Navigation = React.createClass({

  style: {
    background: '#000000'
  },

  styleApplicationTitle: {
    color: '#FFFFFF',
    fontSize: '120%',
    fontWeight: 'bold',
    cursor: 'pointer'
  },

  render() {
    var {
      title,
      onApplicationTitleClick, applicationTitle,
      applicationLogoutUrl,
      userProfileUrl,
      onUsernameClick, username, sidebarOpen, bannerText,
      locations, style,
      styleButton, styleButtonHover, styleBanner,
      ...props
    } = this.props;
    return (
      <HBox {...props} style={{...this.style, ...style}}>
        <NavigationButton
          key="logo"
          style={{...this.styleApplicationTitle, ...styleButton}}
          styleHover={styleButtonHover}
          onClick={onApplicationTitleClick}
          icon={sidebarOpen ? 'menu-down' : 'menu-right'}>
          {applicationTitle}
        </NavigationButton>
        <NavigationButton
          style={styleButton}
          styleHover={{background: 'inherit'}}
          key="title"
          padding={5}
          margin="0 40px"
        >
        {title}
        </NavigationButton>
        <HBox aligned="right">
          <NavigationButton
              icon="user"
              style={styleButton}
              styleHover={styleButtonHover}
              onClick={onUsernameClick}>
            {username}
          </NavigationButton>
          {bannerText &&
            <NavigationBanner
                style={styleBanner}>
              {bannerText}
            </NavigationBanner>}
        </HBox>
      </HBox>
      )
  }
});

module.exports = Navigation;
