/**
 * @copyright 2016-present, Prometheus Research, LLC
 */

import * as React from 'react';
import * as ReactUI from '@prometheusresearch/react-ui';
import toString from 'lodash/toString';

import {InjectI18N} from 'rex-i18n';


@InjectI18N
export default class ViewValue extends React.Component {
  static defaultProps = {
    stylesheet: {
      Root: (props) => <ReactUI.Block marginStart="small" {...props} />
    }
  }

  getValueString() {
    if (this.props.formValue.value) {
      return toString(this.props.formValue.value);
    }
    return null;
  }

  render() {
    let {noValueText = this._('No Value')} = this.props;
    let {Root} = this.props.stylesheet;
    let valueString = this.getValueString();

    return (
      <Root>
        {valueString === null ?
          <ReactUI.Text color="#888">{noValueText}</ReactUI.Text> :
          <ReactUI.Text>{valueString}</ReactUI.Text>}
      </Root>
    );
  }
}

