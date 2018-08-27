/**
 * @copyright 2014-present, Prometheus Research, LLC
 */

import * as React from 'react';
import * as ReactUI from '@prometheusresearch/react-ui';

export default class Toolbar extends React.Component {

  static propTypes = {
    availableLocales: React.PropTypes.array.isRequired,
    locale: React.PropTypes.string.isRequired,
    onLocale: React.PropTypes.func.isRequired,
    mountPoint: React.PropTypes.string.isRequired,
    recon: React.PropTypes.object.isRequired,
    onChange: React.PropTypes.func
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
