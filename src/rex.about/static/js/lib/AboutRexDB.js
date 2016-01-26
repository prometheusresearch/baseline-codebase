/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React from 'react';

import {Tab, TabList} from 'rex-widget/ui';
import {fetch} from 'rex-widget/lib/fetch';

import PackageList from './PackageList';

export default class AboutRexDB extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      activeTab: 'overview',
      environment: {}
    };
  }

  componentWillMount() {
    fetch(this.props.environmentData)
      .then(res => this.setState({environment: res}));
  }

  getLicense() {
    return {
      '__html': this.props.license
    };
  }

  getOverview() {
    return {
      '__html': this.props.overview
    };
  }

  render() {
    return (
      <div className="about-rexdb">
        <h1>{this.props.heading}</h1>
        <TabList
          selected={this.state.activeTab}
          onSelected={activeTab => this.setState({activeTab})}
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
}
