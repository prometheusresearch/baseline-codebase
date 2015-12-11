/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

import React from 'react';
import RexWidget from 'rex-widget';
import Chrome       from 'rex-widget/lib/Chrome';
import {VBox, HBox} from '@prometheusresearch/react-box';


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
    var contentStyle = {
      margin: 0
    };
    var {sidebarOpen, personalMenuOpen, itemOpen} = this.state;
    var locations = this.getLocations();

    return (
      <Chrome {...props}>
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
        <HBox flex="1" {...contentStyle}>
          {this.props.content}
        </HBox>
        {sidebarOpen &&
          <Sidebar
            menu={[]}
            itemOpen={itemOpen}
            onToggleItem={this.toggleItem}
            onClickOutside={this.toggleSidebar}
            />}
        {personalMenuOpen &&
          <PersonalMenu
            links={personalMenuLinks}
            />
        }
      </Chrome>
    );
  },

  getDefaultProps() {
    return {flex: 1};
  },

  getInitialState() {
    return {
      sidebarOpen: false,
      personalMenuOpen: false,
      itemOpen: LocalStorage.getStorage().get('itemOpen', {})
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
  },

  toggleItem(itemId) {
    var itemOpen = {};
    itemOpen[itemId] = !this.state.itemOpen[itemId];
    itemOpen = {...this.state.itemOpen, ...itemOpen};
    LocalStorage.getStorage().set('itemOpen', itemOpen);
    this.setState({itemOpen: itemOpen});
  }


});


module.exports = SimpleChrome;
