/*
 * Copyright (c) 2016, Prometheus Research, LLC
 */


import React from 'react';

import I18NContexted from './I18NContexted';


@I18NContexted
export default class FormatDecimal extends React.Component {
  render() {
    let number = this.context.RexI18N.formatDecimal(
      this.props.value,
      this.props.options || {}
    );
    let Wrapper = this.props.wrapper || 'span';

    return (
      <Wrapper>{number}</Wrapper>
    );
  }
}


FormatDecimal.propTypes = {
  value: React.PropTypes.number.isRequired,
  options: React.PropTypes.object,
  wrapper: React.PropTypes.element
};

