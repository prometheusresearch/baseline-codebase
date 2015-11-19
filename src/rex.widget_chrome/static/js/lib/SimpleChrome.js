/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

import Chrome from 'rex-widget/lib/Chrome';

var React         = require('react');
var RexWidget     = require('rex-widget');
var {VBox, HBox}   = RexWidget.Layout;
var Navigation    = require('./Navigation');
var Sidebar       = require('./Sidebar');
var PersonalMenu  = require('./PersonalMenu');

var SimpleChrome = React.createClass({

  render() {
    var {applicationTitle,
         applicationLogoutUrl,
         userProfileUrl,
         username,
         applicationBanner,
         applicationHeaderBgcolor,
         applicationHeaderBgcolorHover,
         applicationHeaderTextcolor,
         applicationHeaderTextcolorHover,
         personalMenuLinks,
         ...props} = this.props;
    var contentStyle = {margin: 0};
    var {sidebarOpen, personalMenuOpen} = this.state;
    var locations = this.getLocations();

    return (
      <Chrome {...props}>
        <VBox {...props} className="ra-AppletPage" title={undefined}>
          <Navigation
            applicationTitle={applicationTitle}
            onApplicationTitleClick={this.toggleSidebar}
            username={username}
            onUsernameClick={this.togglePersonalMenu}
            bannerText={applicationBanner}
            title={this.props.title}
            sidebarOpen={sidebarOpen}
            height={50}
            style={{backgroundColor: applicationHeaderBgcolor}}
            styleButton={{color: applicationHeaderTextcolor}}
            styleButtonHover={{
              color: applicationHeaderTextcolorHover,
              backgroundColor: applicationHeaderBgcolorHover
            }}
            styleBanner={{color: applicationHeaderTextcolor}}
            />
          <HBox size={1} {...contentStyle}>
            <VBox size={5}>
              {this.props.content}
            </VBox>
          </HBox>
          {sidebarOpen &&
            <Sidebar
              menu={[]}
              onClickOutside={this.toggleSidebar}
              />}
          {personalMenuOpen &&
            <PersonalMenu
              links={personalMenuLinks}
              />
          }
        </VBox>
      </Chrome>
    );
  },

  getDefaultProps() {
    return {size: 1};
  },

  getInitialState() {
    return {
      sidebarOpen: false,
      personalMenuOpen: false,
    }
  },

  getLocations() {
    return [];
  },

  toggleSidebar() {
    var sidebarOpen = !this.state.sidebarOpen;
    this.setState({sidebarOpen});
  },

  togglePersonalMenu() {
    var personalMenuOpen = !this.state.personalMenuOpen;
    this.setState({personalMenuOpen});
  }


});


module.exports = SimpleChrome;
