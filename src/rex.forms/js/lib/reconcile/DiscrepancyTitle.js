/**
 * @copyright 2014-present, Prometheus Research, LLC
 */

import * as React from 'react';
import * as ReactUI from '@prometheusresearch/react-ui';
import CheckIcon from 'react-icons/lib/fa/check';

import Label from '../form/Label';
import Error from '../form/Error';

export default class DiscrepancyTitle extends  React.Component {

  static propTypes = {
    title: React.PropTypes.oneOfType([
      React.PropTypes.string,
      React.PropTypes.object
    ]),
    required: React.PropTypes.bool,
    complete: React.PropTypes.bool
  };

  static defaultProps = {
    required: false,
    complete: false
  };

  render() {
    let {title, subtitle, complete, required} = this.props;
    return (
      <ReactUI.Block>
        {complete &&
          <ReactUI.Block
            top={1}
            right={8}
            position="absolute">
            <CheckIcon style={{fontSize: '22pt'}} />
          </ReactUI.Block>}
        <ReactUI.Block>
          <Label text={title} />
          {required && <Error>{' *'}</Error>}
        </ReactUI.Block>
        {subtitle &&
          <ReactUI.Block>
            <ReactUI.Text fontSize="x-small">
              {subtitle}
            </ReactUI.Text>
          </ReactUI.Block>}
      </ReactUI.Block>
    );
  }
}
