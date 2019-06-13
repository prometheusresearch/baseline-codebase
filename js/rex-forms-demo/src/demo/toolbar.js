/**
 * @copyright 2016-present, Prometheus Research, LLC
 */

import * as React from 'react';
import * as PropTypes from 'prop-types';
import * as ReactUI from '@prometheusresearch/react-ui-0.21';
import noop from 'lodash/noop';

import {MODE_ENTRY, MODE_REVIEW, MODE_VIEW} from './constants';

export default class Toolbar extends React.Component {

  static propTypes = {
    logFormEvents: PropTypes.bool.isRequired,
    showAssessment: PropTypes.bool.isRequired,
    showErrors: PropTypes.bool.isRequired,
    mode: PropTypes.string.isRequired,
    locale: PropTypes.string.isRequired,
    availableLocales: PropTypes.array.isRequired,
    mountPoint: PropTypes.string.isRequired,
    demo: PropTypes.object.isRequired,
    onChange: PropTypes.func
  };

  static defaultProps = {
    onChange: noop,
  };

  render() {
    return (
      <ReactUI.Block padding="small">
        <ReactUI.Block inline>
          <a href={this.props.mountPoint + '/'}>← Go Back</a>
        </ReactUI.Block>
        {this.props.demo.validation_errors &&
          <ReactUI.Block inline marginLeft="medium">
            <ReactUI.ErrorText title={this.props.demo.validation_errors}>
              INVALID CONFIGURATION
            </ReactUI.ErrorText>
          </ReactUI.Block>
        }
        <ReactUI.Block inline marginLeft="medium">
          <ReactUI.Block inline marginRight="x-small">
            <ReactUI.Checkbox
              title="Displays the current state of the Assessment"
              label="Show Assessment"
              onChange={this.onShowAssessment}
              value={this.props.showAssessment}
              />
          </ReactUI.Block>
          <ReactUI.Block inline marginRight="x-small">
            <ReactUI.Checkbox
              title="Displays all current validation errors"
              label="Show Errors"
              onChange={this.onShowErrors}
              value={this.props.showErrors}
              />
          </ReactUI.Block>
          <ReactUI.Block inline marginRight="x-small">
            <ReactUI.Checkbox
              title="Logs Form events to the console"
              label="Log Events"
              onChange={this.onLogFormEvents}
              value={this.props.logFormEvents}
              />
          </ReactUI.Block>
          <ReactUI.Block inline marginRight="x-small">
            <ReactUI.Checkbox
              title="Disable pagination"
              label="No Pagination"
              onChange={this.onNoPagination}
              value={this.props.noPagination}
              />
          </ReactUI.Block>
          <ReactUI.Block inline marginRight="x-small">
            <ReactUI.Select
              value={this.props.component}
              onChange={this.onComponent}
              title="Changes the top-level component being used"
              options={[
                {value: 'ENTRY', label: 'FormEntry'},
                {value: 'EDITOR', label: 'FormEditor'},
              ]}
              />
          </ReactUI.Block>
          {this.props.component === 'ENTRY' &&
            <ReactUI.Block inline marginRight="x-small">
              <ReactUI.Select
                value={this.props.mode}
                onChange={this.onMode}
                title="Changes the operational mode of the Form"
                options={[
                  {value: MODE_ENTRY, label: 'Entry Mode'},
                  {value: MODE_REVIEW, label: 'Review Mode'},
                  {value: MODE_VIEW, label: 'View Mode'},
                ]}
                />
            </ReactUI.Block>
          }
          <ReactUI.Block inline>
            <ReactUI.Select
              value={this.props.locale}
              onChange={this.onLocale}
              title="Changes the locale the Form is rendered in"
              options={this.props.availableLocales.map(locale => ({
                value: locale[0],
                label: locale[1],
              }))}
              />
          </ReactUI.Block>
        </ReactUI.Block>
      </ReactUI.Block>
    );
  }

  onLocale = locale => {
    this.props.onChange({locale});
  }

  onMode = mode => {
    this.props.onChange({mode});
  }

  onComponent = component => {
    this.props.onChange({component});
  }

  onShowAssessment = () => {
    let showAssessment = !this.props.showAssessment;
    this.props.onChange({showAssessment});
  };

  onShowErrors = () => {
    let showErrors = !this.props.showErrors;
    this.props.onChange({showErrors});
  };

  onLogFormEvents = () => {
    let logFormEvents = !this.props.logFormEvents;
    this.props.onChange({logFormEvents});
  };

  onNoPagination = () => {
    let noPagination = !this.props.noPagination;
    this.props.onChange({noPagination});
  };
}

