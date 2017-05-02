/**
 * @copyright 2015-present, Prometheus Research, LLC
 * @flow
 */

import * as React from 'react';
import * as ReactUI from '@prometheusresearch/react-ui';
import {VBox, HBox, Element, css} from 'react-stylesheet';
import QuestionIcon from 'react-icons/lib/fa/question-circle';
import CloseIcon from 'react-icons/lib/fa/close';

import {emptyFunction} from 'rex-widget/lang';
import * as ui from 'rex-widget/ui';

import {contextTypes} from './ActionContext';
import {StickyFooterPanel, Theme} from './ui';

export default class Action extends React.Component {
  state: {showHelp: boolean} = {showHelp: false};

  static propTypes = {
    /**
     * Action title.
     */
    title: React.PropTypes.node,

    /**
     * Content area.
     */
    children: React.PropTypes.node,

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
    renderFooter: emptyFunction,
  };

  static contextTypes = contextTypes;

  toggleShowHelp = () => {
    this.setState({showHelp: !this.state.showHelp}, () => {
      ui.dispatchResizeEvent();
    });
  };

  render() {
    let {
      children,
      toolbar,
      extraToolbar,
      title,
      help,
      noContentWrapper,
      noHeader,
      contentStyle,
    } = this.props;

    let {
      showHelp,
    } = this.state;

    if (help === undefined) {
      help = this.context.help;
    }

    toolbar = toolbar || this.context.toolbar;
    let footer = this.props.renderFooter();
    if (footer) {
      footer = <Element padding="10px 20px" flexShrink={0}>{footer}</Element>;
    }

    return (
      <HBox flexGrow={1} flexShrink={1} height="100%">
        <VBox flexGrow={1} flexShrink={1} height="100%" overflow="auto">
          {!noHeader &&
            <VBox boxShadow={Theme.shadow.light()} padding={20}>
              <HBox>
                {title &&
                  <VBox flexGrow={1} fontWeight="bold">
                    {title}
                  </VBox>}
                {help &&
                  !showHelp &&
                  <HBox>
                    <ReactUI.QuietButton
                      size="small"
                      onClick={this.toggleShowHelp}
                      icon={<QuestionIcon />}
                    />
                  </HBox>}
              </HBox>
              {toolbar && <VBox marginTop={10}>{toolbar}</VBox>}
              {extraToolbar && <VBox marginTop={10}>{extraToolbar}</VBox>}
            </VBox>}
          {noContentWrapper
            ? children
            : <StickyFooterPanel
                contentWrapperStyle={{overflow: 'auto'}}
                mode="sticky"
                footer={footer}>
                <VBox padding={20} style={contentStyle}>{children}</VBox>
              </StickyFooterPanel>}
        </VBox>
        {help && showHelp && <ActionHelp help={help} onClose={this.toggleShowHelp} />}
      </HBox>
    );
  }
}

function ActionHelp({help, onClose}) {
  return (
    <VBox borderLeft={css.border(1, '#ddd')} height="100%" width={300} padding="x-small">
      <VBox fontSize="90%" height="100%">
        <HBox alignItems="center">
          <VBox flexGrow={1} padding="x-small">
            <ReactUI.LabelText>
              Help
            </ReactUI.LabelText>
          </VBox>
          <VBox>
            <ReactUI.QuietButton size="small" onClick={onClose} icon={<CloseIcon />} />
          </VBox>
        </HBox>
        <VBox flexGrow={1} overflow="auto">
          <div dangerouslySetInnerHTML={{__html: help}} />
        </VBox>
      </VBox>
    </VBox>
  );
}
