/**
 * @copyright 2014-present, Prometheus Research, LLC
 */

import * as React from 'react';
import * as PropTypes from 'prop-types';
import * as ReactUI from '@prometheusresearch/react-ui-0.21';

export default class Toolbar extends React.Component {

  static propTypes = {
    availableLocales: PropTypes.array.isRequired,
    locale: PropTypes.string.isRequired,
    onLocale: PropTypes.func.isRequired,
    mountPoint: PropTypes.string.isRequired,
    recon: PropTypes.object.isRequired,
    onChange: PropTypes.func
  };

  onChangeValue = (option, event) => {
    this.setState({
      [option]: event.target.value
    }, () => {
      if (this.props.onChange) {
        this.props.onChange(this.state);
      }
    });
  };

  onToggle = (option) => {
    this.setState({
      [option]: !this.state[option]
    }, () => {
      if (this.props.onChange) {
        this.props.onChange(this.state);
      }
    });
  };

  render() {
    return (
      <ReactUI.Block padding="small">
        <ReactUI.Block inline>
          <a href={this.props.mountPoint + '/'}>← Go Back</a>
        </ReactUI.Block>
        {this.props.recon.validation_errors &&
          <ReactUI.Block inline marginLeft="medium">
            <ReactUI.ErrorText title={this.props.recon.validation_errors}>
              INVALID CONFIGURATION
            </ReactUI.ErrorText>
          </ReactUI.Block>
        }
        <ReactUI.Block inline marginLeft="medium">
          <ReactUI.Select
            value={this.props.locale}
            onChange={this.props.onLocale}
            title="Changes the locale the Form is rendered in"
            options={this.props.availableLocales.map(locale => ({
              value: locale[0],
              label: locale[1],
            }))}
            />
        </ReactUI.Block>
      </ReactUI.Block>
    );
  }
}
