/**
 * @copyright 2016-present, Prometheus Research, LLC
 */

import * as React from 'react';
import * as ReactUI from '@prometheusresearch/react-ui';

import {TopNav} from '../menu';
import Toolbar from './toolbar';
import Workspace from './workspace';

function readOptions() {
  let options = window.location.hash.slice(1) || '{}';
  try {
    return JSON.parse(options);
  } catch (err) {
    return {};
  }
}

function updateOptions(options) {
  window.location.hash = '#' + JSON.stringify(options);
}

export default class Demo extends React.Component {

  static propTypes = {
    demo: React.PropTypes.object.isRequired,
    mountPoint: React.PropTypes.string.isRequired,
    apiUrls: React.PropTypes.object.isRequired,
    i18nUrl: React.PropTypes.string.isRequired,
    initialLocale: React.PropTypes.string.isRequired,
    availableLocales: React.PropTypes.array.isRequired
  };

  constructor(props) {
    super(props);
    this.state = {
      options: {
        ...{
          locale: props.initialLocale,
          mode: 'entry',
          component: 'ENTRY',
          noPagination: false,
        },
        ...readOptions()
      }
    };
  }

  onChangeOptions = (options) => {
    this.setState({
      options: {
        ...this.state.options,
        ...options
      }
    });
  };

  render() {
    let {
      locale,
      mode,
      component,
      showAssessment = false,
      showErrors = false,
      logFormEvents = false,
      noPagination = false,
    } = this.state.options;
    return (
      <div>
        <TopNav
          mountPoint={this.props.mountPoint}
          demos={this.props.demos}
          recons={this.props.recons}
          />
        <ReactUI.Block marginV={0} marginH="auto" padding="medium" maxWidth={1024}>
          <Toolbar
            mountPoint={this.props.mountPoint}
            onChange={this.onChangeOptions}
            locale={locale}
            noPagination={noPagination}
            mode={mode}
            component={component}
            logFormEvents={logFormEvents}
            showAssessment={showAssessment}
            showErrors={showErrors}
            availableLocales={this.props.availableLocales}
            demo={this.props.demo}
            />
          <Workspace
            mountPoint={this.props.mountPoint}
            apiUrls={this.props.apiUrls}
            i18nUrl={this.props.i18nUrl}
            options={this.state.options}
            demo={this.props.demo}
            />
        </ReactUI.Block>
      </div>
    );
  }

  componentDidUpdate() {
    updateOptions(this.state.options);
  }
}
