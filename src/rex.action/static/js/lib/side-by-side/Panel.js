/**
 * @copyright 2015, Prometheus Research, LLC
 */

import cx           from 'classnames';
import autobind     from 'autobind-decorator';
import React        from 'react';
import {Themeable}  from 'rethemeable';
import RexWidget    from 'rex-widget';
import {VBox, HBox} from 'rex-widget/lib/Layout';
import Style        from './Panel.style';

@Themeable
export default class Panel extends React.Component {

  static defaultTheme = Style;

  render() {
    var {children, active, style, className, sidebar} = this.props;
    return (
      <HBox>
        {sidebar &&
          <VBox className={this.theme.sidebar}>
            {sidebar}
          </VBox>}
        <VBox className={cx(className, this.theme.self)} style={style}>
          {children}
          {!active &&
            <VBox
              className={this.theme.shim}
              onClick={this.onFocus}
              />}
        </VBox>
      </HBox>
    );
  }

  @autobind
  onFocus() {
    this.props.onFocus(this.props.action);
  }
}
