/**
 * @copyright 2015, Prometheus Research, LLC
 */

import * as React from 'react';
import * as ReactUI from '@prometheusresearch/react-ui';
import {css} from '@prometheusresearch/react-ui/stylesheet';
import QuestionIcon from 'react-icons/lib/fa/question-circle';
import CloseIcon from 'react-icons/lib/fa/close';

import {emptyFunction} from 'rex-widget/lang';
import {VBox, HBox} from 'rex-widget/layout';
import * as ui from 'rex-widget/ui';
import * as stylesheet from 'rex-widget/stylesheet';

import {contextTypes} from './ActionContext';
import {
  QuietButton,
  StickyFooterPanel,
  Theme
} from './ui';


export default class Action extends React.Component {

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
    renderFooter: emptyFunction
  };

  static contextTypes = contextTypes;

  static stylesheet = stylesheet.create({
    Header: {
      Component: VBox,
      boxShadow: Theme.shadow.light(),
      padding: '20px',
    },
    Content: {
      Component: VBox,
      padding: 20,
    },
    Toolbar: {
      Component: VBox,
      marginTop: 10,
    },
    Footer: {
      padding: '10px 20px',
      flexShrink: 0,
      sticky: {
        zIndex: 1000,
        boxShadow: Theme.shadow.normal(),
      }
    },
    Title: {
      Component: VBox,
      fontWeight: 'bold',
      flex: 1
    },
    ContentContainer: {
      Component: StickyFooterPanel,
      ContentWrapper: {
        overflow: 'auto',
      }
    },
  });

  constructor(props) {
    super(props);
    this.state = {
      showHelp: false,
    };
  }

  toggleShowHelp = () => {
    this.setState({showHelp: !this.state.showHelp}, () => {
      ui.dispatchResizeEvent();
    });
  };

  render() {
    let {
      Header,
      Content,
      ContentContainer,
      Footer,
      Title,
      Toolbar
    } = this.constructor.stylesheet;

    let {
      children, toolbar, extraToolbar,
      title, help, noContentWrapper, noHeader,
      contentStyle
    } = this.props;

    let {
      showHelp
    } = this.state;

    if (help === undefined) {
      help = this.context.help;
    }

    toolbar = toolbar || this.context.toolbar;
    let footer = this.props.renderFooter();
    if (footer) {
      footer = <Footer>{footer}</Footer>;
    }

    return (
      <HBox flex={1}>
        <VBox flex={1} direction="column-reverse">
          {noContentWrapper ?
            children :
            <ContentContainer mode="sticky" footer={footer}>
              <Content style={contentStyle}>{children}</Content>
            </ContentContainer>}
          {!noHeader &&
            <Header>
              <HBox>
                {title &&
                  <Title>
                    {title}
                  </Title>}
                {help && !showHelp &&
                  <HBox>
                    <ReactUI.QuietButton
                      size="small"
                      onClick={this.toggleShowHelp}
                      icon={<QuestionIcon />}
                      />
                  </HBox>}
              </HBox>
            {toolbar &&
              <Toolbar>{toolbar}</Toolbar>}
            {extraToolbar &&
              <Toolbar>{extraToolbar}</Toolbar>}
            </Header>}
          </VBox>
          {help && showHelp &&
            <ActionHelp help={help} onClose={this.toggleShowHelp} />}
      </HBox>
    );
  }
}

function ActionHelp({help, onClose}) {
  return (
    <ReactUI.VBox
      style={{borderLeft: css.border(1, '#ddd')}}
      height="100%"
      width={300}
      padding="x-small">
      <ReactUI.VBox
        style={{fontSize: '90%'}}
        height="100%">
        <ReactUI.HBox alignItems="center">
          <ReactUI.VBox
            flex={1}
            padding="x-small">
            <ReactUI.LabelText>
              Help
            </ReactUI.LabelText>
          </ReactUI.VBox>
          <VBox>
            <ReactUI.QuietButton
              size="small"
              onClick={onClose}
              icon={<CloseIcon />}
              />
          </VBox>
        </ReactUI.HBox>
        <ReactUI.VBox flex={1} overflow="auto">
          <div dangerouslySetInnerHTML={{__html: help}} />
        </ReactUI.VBox>
      </ReactUI.VBox>
    </ReactUI.VBox>
  );
}
