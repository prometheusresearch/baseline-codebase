/**
 * @copyright 2016, Prometheus Research, LLC
 */

import * as React from 'react';
import * as ReactUI from '@prometheusresearch/react-ui';
import * as ReactForms from 'react-forms/reactive';

import {InjectI18N} from 'rex-i18n';

import QuestionLabel from './QuestionLabel';
import TextArea from './widget/TextArea';


@InjectI18N
@ReactForms.reactive
export default class Explanation extends React.Component {

  state = {show: false};

  onShow = () => this.setState({show: true});

  onHide = () => {
    this.setState({show: false});
    this.props.formValue.update(null);
  }

  render() {
    let {required, disabled, formValue, readOnly} = this.props;
    let {show} = this.state;
    if (readOnly) {
      return (
        <ReactUI.Block>
          {formValue.value == null ?
            <ReactUI.Text color="#888">{this._('No explanation')}</ReactUI.Text> :
            <ReactUI.Block>
              <QuestionLabel text={this._('Explanation:')} />
              <ReactUI.Text>{formValue.value}</ReactUI.Text>
            </ReactUI.Block>}
        </ReactUI.Block>
      );
    } else {
      return (
        <ReactUI.Block>
          {(show || required) ?
            <ReactUI.Block>
              <QuestionLabel
                text={this._('Explanation:')}
                required={required}
                />
              <TextArea disabled={disabled} formValue={formValue} />
              {!required &&
                <ReactUI.Block marginTop="xx-small">
                  <ReactUI.QuietButton
                    disabled={disabled}
                    size="small"
                    onClick={this.onHide}>
                    {this._('I don\'t want to provide this information.')}
                  </ReactUI.QuietButton>
                </ReactUI.Block>}
            </ReactUI.Block> :
            <ReactUI.QuietButton
              tabIndex={-1}
              disabled={disabled}
              size="small"
              onClick={this.onShow}>
              {this._('I would like to explain my response to this question.')}
            </ReactUI.QuietButton>}
        </ReactUI.Block>
      );
    }
  }
}
