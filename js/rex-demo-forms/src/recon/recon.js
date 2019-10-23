/**
 * @copyright 2014-present, Prometheus Research, LLC
 */

import * as ReactUI from '@prometheusresearch/react-ui-0.21';
import * as React from 'react';
import * as PropTypes from 'prop-types';

import {TopNav} from '../menu';
import Toolbar from './toolbar';
import Workspace from './workspace';

export default class Recon extends React.Component {

  static propTypes = {
    recon: PropTypes.object.isRequired,
    mountPoint: PropTypes.string.isRequired,
    apiUrls: PropTypes.object.isRequired,
    i18nUrl: PropTypes.string.isRequired,
    initialLocale: PropTypes.string.isRequired,
    availableLocales: PropTypes.array.isRequired
  };

  constructor(props) {
    super(props);
    this.state ={
      options: {
        locale: this.props.initialLocale
      }
    };
  }

  onChangeOptions = (options) => {
    this.setState({options});
  };

  onLocale = (locale) => {
    this.setState({locale});
  };

  render() {
    return (
      <div>
        <TopNav
          mountPoint={this.props.mountPoint}
          demos={this.props.demos}
          recons={this.props.recons}
          />
        <ReactUI.Block
          maxWidth={1024}
          padding="medium"
          marginH="auto"
          marginV={0}>
          <Toolbar
            mountPoint={this.props.mountPoint}
            onChange={this.onChangeOptions}
            locale={this.state.options.locale}
            onLocale={this.onLocale}
            availableLocales={this.props.availableLocales}
            recon={this.props.recon}
            />
          <Workspace
            mountPoint={this.props.mountPoint}
            apiUrls={this.props.apiUrls}
            i18nUrl={this.props.i18nUrl}
            options={this.state.options}
            recon={this.props.recon}
            />
        </ReactUI.Block>
      </div>
    );
  }
}
