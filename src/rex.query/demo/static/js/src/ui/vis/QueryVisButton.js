/**
 * @flow
 */

import React from 'react';
import {VBox} from '@prometheusresearch/react-box';

import QueryVisButtonHeader from './QueryVisButtonHeader';

type QueryVisButtonProps = {
  children?: React$Element<*>;
  stylesheet: {
    Root: React.Component<*,*,*>;
    Button: React.Component<*,*,*>;
  };
};

export default class QueryVisButton
 extends React.Component<*, QueryVisButtonProps, *> {

  static defaultProps = {
    stylesheet: {
      Root: VBox,
      Button: VBox,
    }
  };

  render() {
    let {children, ...props} = this.props;
    return (
      <VBox>
        <QueryVisButtonHeader
          {...props}
          />
        {children}
      </VBox>
    );
  }

}
