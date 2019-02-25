/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React from 'react';

import {Action} from 'rex-action';
import {Tab, TabList} from 'rex-widget/ui';

import PackageList from './PackageList';


export default class AboutRexDB extends React.Component {
  static defaultProps = {
    title: 'About this RexDB Application',
  }

  constructor(props) {
    super(props);
    this.state = {
      activeTab: 'overview',
    };
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
    let {title, onClose} = this.props;

    return (
      <Action title={title} onClose={onClose}>
        <TabList
          selected={this.state.activeTab}
          onSelected={activeTab => this.setState({activeTab})}
          >
          <Tab
            id="overview"
            title="Overview"
            style={{
              width: '100%',
            }}>
            {this.props.environmentPackages.application_package &&
              <div>
                <h2
                  style={{
                    fontWeight: 'normal',
                  }}>
                  You are using
                  <span
                    style={{
                      fontWeight: 'bold',
                      paddingLeft: '0.5ch',
                    }}>
                    {this.props.environmentPackages.application_package.name}
                  </span>
                  <span
                    style={{
                      fontWeight: 'bold',
                      paddingLeft: '0.5ch',
                    }}>
                    v{this.props.environmentPackages.application_package.version}
                  </span>
                </h2>
              </div>
            }
            <div
              dangerouslySetInnerHTML={this.getOverview()}
              style={{
                textAlign: 'justify',
              }}
              />
          </Tab>
          <Tab
            id="rexdb"
            title="RexDB Components">
            <PackageList
              packages={this.props.environmentPackages.rex_packages}
              />
          </Tab>
          <Tab
            id="other"
            title="Other Components"
            style={{
              width: '100%',
            }}>
            <PackageList
              packages={this.props.environmentPackages.other_packages}
              />
          </Tab>
          <Tab
            id="license"
            title="License"
            style={{
              width: '100%',
            }}>
            <div
              dangerouslySetInnerHTML={this.getLicense()}
              style={{
                textAlign: 'justify',
              }}
              />
          </Tab>
        </TabList>
      </Action>
    );
  }
}

