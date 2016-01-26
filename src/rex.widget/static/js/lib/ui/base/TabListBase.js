/**
 * @copyright 2015, Prometheus Research, LLC
 */

import autobind from 'autobind-decorator';
import emptyFunction from 'empty/function';
import React, {PropTypes} from 'react';
import {VBox, HBox} from '../../../layout';
import * as Stylesheet from '../../../stylesheet';
import * as CSS from '../../../css';

export default class TabListBase extends React.Component {

  static propTypes = {
    children: PropTypes.oneOfType([
      PropTypes.array,
      PropTypes.element
    ]).isRequired,
    selected: PropTypes.any.isRequired,
    onSelected: PropTypes.func,
    position: PropTypes.oneOf(['left', 'right', 'top', 'bottom']),
  };

  static defaultProps = {
    position: 'top',
    onSelected: emptyFunction,
  };

  static stylesheet = Stylesheet.create({
    Root: {
      Component: VBox,
      positionTop: {
        flexDirection: 'column'
      },
      positionBottom: {
        flexDirection: 'column-reverse'
      },
      positionLeft: {
        flexDirection: 'row'
      },
      positionRight: {
        flexDirection: 'row-reverse'
      }
    },
    Content: {
      Component: VBox,
      positionTop: {
        flexDirection: 'row'
      },
      positionBottom: {
        flexDirection: 'row'
      },
      positionLeft: {
        flexDirection: 'column'
      },
      positionRight: {
        flexDirection: 'column'
      }
    },
    ButtonList: {
      Component: 'div',
    },
    Button: {
      Component: 'a',
      position: CSS.position.relative,
      positionTop: {
        display: CSS.display.inlineBlock,
      },
      positionBottom: {
        display: CSS.display.inlineBlock,
      },
      positionLeft: {
        display: CSS.display.block,
      },
      positionRight: {
        display: CSS.display.block,
      }
    }
  });

  render() {
    let  {
      children, size, className, selected,
      position, ...props
    } = this.props;
    let {Button, Content, ButtonList, Root} = this.constructor.stylesheet;
    let variant = {
      positionTop: position === 'top',
      positionRight: position === 'right',
      positionBottom: position === 'bottom',
      positionLeft: position === 'left',
    };
    let buttonList = children.map(tab =>
      <Button
        role="presentation"
        key={tab.props.id}
        variant={{
          ...variant,
          selected: tab.props.id === selected,
          notSelected: tab.props.id !== selected,
          disabled: tab.props.disabled
        }}
        onClick={this.onClick.bind(null, tab.props.id)}>
        {tab.props.title || tab.props.id}
      </Button>
    );
    let content = children.filter(tab => tab.props.id === selected)[0];
    return (
      <Root {...props} flex={1} variant={variant}>
        <ButtonList variant={variant}>
          {buttonList}
        </ButtonList>
        <Content variant={variant} overflow="auto" flex={1}>
          {content}
        </Content>
      </Root>
    );
  }

  @autobind
  onClick(id, e) {
    e.preventDefault();
    this.props.onSelected(id);
  }
}
