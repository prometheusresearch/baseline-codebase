/**
 * @copyright 2015, Prometheus Research, LLC
 */

import emptyFunction    from 'empty/functionThatReturnsNull';
import React            from 'react';
import * as Stylesheet  from '@prometheusresearch/react-stylesheet';
import {VBox, HBox}     from '@prometheusresearch/react-box';
import RexWidget        from 'rex-widget';
import * as Style       from 'rex-widget/lib/StyleUtils';
import * as Theme       from './ui/Theme';
import Button           from './ui/QuietButton';

@Stylesheet.styleable
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

  static defaultProps = {
    renderFooter: emptyFunction
  };

  static stylesheet = Stylesheet.createStylesheet({
    Root: {
      Component: VBox,
      flex: 1,
    },
    Header: {
      Component: HBox,
      boxShadow: Theme.shadow.normal(),
      padding: 10,
    },
    Content: {
      Component: VBox,
      padding: 10,
      overflow: Style.auto,
      flex: 1,
      noPadding: {
        padding: 0
      }
    },
    Footer: {
      boxShadow: Theme.shadow.normal(),
      padding: 5,
    },
    Title: {
      Component: VBox,
      flex: 1
    }
  });

  render() {
    let {Root, Header, Content, Footer, Title} = this.stylesheet;
    let {children, title, onClose, noPadding} = this.props;
    let footer = this.props.renderFooter();
    return (
      <Root>
        <Header>
          {title && <Title><h4>{title}</h4></Title>}
          {onClose &&
            <Button
              icon="remove"
              onClick={onClose}
              />}
        </Header>
        <Content state={{noPadding}}>{children}</Content>
        {footer && <Footer>{footer}</Footer>}
      </Root>
    );
  }
}
