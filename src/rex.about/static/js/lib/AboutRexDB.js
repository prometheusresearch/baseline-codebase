/**
 * @copyright 2015, Prometheus Research, LLC
 */

'use strict';

var React = require('react');

var RexWidget = require('rex-widget');
var {Tab, TabList} = require('rex-widget/ui');
var {fetch} = require('rex-widget/lib/fetch');

var PackageList = require('./PackageList');


var AboutRexDB = RexWidget.createWidgetClass({
  getInitialState: function () {
    return {
      activeTab: RexWidget.cell('overview'),
      environment: {}
    };
  },

  componentWillMount: function () {
    fetch(this.props.environmentData)
      .then(res => this.setState({environment: res}));
  },

  getLicense: function() {
    return {
      '__html': this.props.license
    };
  },

  getOverview: function() {
    return {
      '__html': this.props.overview
    };
  },

  render: function () {
    return (
      <div className="about-rexdb">
        <h1>{this.props.heading}</h1>
        <TabList
          selected={this.state.activeTab.value}
          onSelected={this.state.activeTab.update}
          >
          <Tab
            id="overview"
            title="Overview">
            {this.state.environment.application_package &&
              <div className="overview-application">
                <h2>
                  You are using
                  <span className="app-name">
                    {this.state.environment.application_package.name}
                  </span>
                  <span className="app-version">
                    v{this.state.environment.application_package.version}
                  </span>
                </h2>
              </div>
            }
            <div
              dangerouslySetInnerHTML={this.getOverview()}
              className="overview-body"
              />
          </Tab>
          <Tab
            id="rexdb"
            title="RexDB Components">
            <PackageList
              packages={this.state.environment.rex_packages}
              />
          </Tab>
          <Tab
            id="other"
            title="Other Components">
            <PackageList
              packages={this.state.environment.other_packages}
              />
          </Tab>
          <Tab
            id="license"
            title="RexDB License">
            <div
              dangerouslySetInnerHTML={this.getLicense()}
              className="rexdb-license"
              />
          </Tab>
        </TabList>
      </div>
    );
  }
});


module.exports = AboutRexDB;

