/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React         from 'react';
import {Themeable}   from 'rethemeable';
import RexWidget     from 'rex-widget';
import emptyFunction from 'rex-widget/lib/emptyFunction';
import {VBox, HBox}  from 'rex-widget/lib/Layout';
import Style         from './Action.module.css';

@Themeable
export default class Action extends React.Component {

  static propTypes = {
    /**
     * Action title.
     */
    title: React.PropTypes.string,

    /**
     * Content area.
     */
    children: React.PropTypes.node,

    /**
     * Callback which is invoked when close button is clicked.
     */
    onClose: React.PropTypes.func,

    /**
     * Action width.
     */
    width: React.PropTypes.number,

    /**
     * Render callback for footer.
     */
    renderFooter: React.PropTypes.func,
  };

  static defaultTheme = Style;

  static defaultProps = {
    renderFooter: emptyFunction.thatReturnsNull
  };

  render() {
    var {children, title, onClose, width, className} = this.props;
    var footer = this.props.renderFooter();
    return (
      <VBox style={{width}} size={1} className={this.theme.self}>
        <HBox className={this.theme.header}>
          {title &&
            <VBox size={1}>
              <h4>{title}</h4>
            </VBox>}
          {onClose &&
            <RexWidget.Button
              quiet
              icon="remove"
              onClick={onClose}
              />}
        </HBox>
        <VBox size={1} className={this.theme.content}>
          {children}
        </VBox>
        {footer &&
          <VBox className={this.theme.footer}>
            {footer}
          </VBox>}
      </VBox>
    );
  }
}
