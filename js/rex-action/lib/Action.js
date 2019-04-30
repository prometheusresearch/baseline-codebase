/**
 * @copyright 2015-present, Prometheus Research, LLC
 * @flow
 */

import * as React from "react";

import * as styles from "@material-ui/styles";
import * as mui from "@material-ui/core";
import * as icons from "@material-ui/icons";

import PropTypes from "prop-types";
import { VBox, HBox, Element, css } from "react-stylesheet";
import QuestionIcon from "react-icons/lib/fa/question-circle";
import CloseIcon from "react-icons/lib/fa/close";

import { emptyFunction } from "rex-widget/lang";
import * as ui from "rex-widget/ui";
import * as rexui from "rex-ui";

import { contextTypes } from "./ActionContext";
import { Theme } from "./ui";

type Props = {|
  /**
   * Action title.
   */
  title?: React.Node,

  /**
   * Content area.
   */
  children?: React.Node,

  /**
   * Action width.
   */
  width?: ?number,

  help?: string,

  /**
   * Render callback for footer.
   */
  renderFooter?: () => React.Node,

  toolbar?: React.Node,
  extraToolbar?: React.Node,

  noHeader?: boolean,
  noContentWrapper?: boolean,
  contentStyle?: Object
|};

type State = {
  showHelp: boolean
};

export default class Action extends React.Component<Props, State> {
  state = { showHelp: false };

  static defaultProps = {
    renderFooter: emptyFunction
  };

  static contextTypes = contextTypes;

  toggleShowHelp = () => {
    this.setState({ showHelp: !this.state.showHelp });
  };

  render() {
    let {
      children,
      renderFooter,
      toolbar,
      extraToolbar,
      title,
      help,
      noContentWrapper,
      noHeader,
      contentStyle
    } = this.props;

    let { showHelp } = this.state;

    if (help === undefined) {
      help = this.context.help;
    }

    toolbar = toolbar || this.context.toolbar;

    let footer = null;
    if (renderFooter != null) {
      footer = renderFooter();
      if (footer) {
        footer = (
          <Element padding="10px 20px" flexShrink={0}>
            {footer}
          </Element>
        );
      }
    }

    return (
      <HBox flexGrow={1} flexShrink={1}>
        <VBox flexGrow={1} flexShrink={1}>
          {!noHeader && (
            <mui.Paper square={true} style={{ padding: 20 }}>
              <HBox>
                {title && (
                  <VBox flexGrow={1} fontWeight="bold">
                    {title}
                  </VBox>
                )}
                {help && !showHelp && (
                  <HBox>
                    <rexui.IconButton
                      size="small"
                      icon={<icons.HelpOutline />}
                      onClick={this.toggleShowHelp}
                    />
                  </HBox>
                )}
              </HBox>
              {toolbar && <VBox marginTop={10}>{toolbar}</VBox>}
              {extraToolbar && <VBox marginTop={10}>{extraToolbar}</VBox>}
            </mui.Paper>
          )}
          {noContentWrapper ? (
            children
          ) : (
            <VBox flexGrow={1} flexShrink={1}>
              <Element
                flexGrow={1}
                flexShrink={1}
                overflow="auto"
                padding={20}
                style={contentStyle}
              >
                {children}
              </Element>
              {footer && <mui.Paper style={{ zIndex: 1 }}>{footer}</mui.Paper>}
            </VBox>
          )}
        </VBox>
        {help && showHelp && (
          <ActionHelp help={help} onClose={this.toggleShowHelp} />
        )}
      </HBox>
    );
  }
}

function ActionHelp({ help, onClose }) {
  let style = React.useMemo(() => ({
    overflow: "unset",
    width: 300,
    zIndex: 1,
    display: "flex",
    flexDirection: "column",
    flexGrow: 1,
    flexShrink: 0,
  }));
  let contentStyle = React.useMemo(() => ({
    overflow: "auto",
    display: "flex",
    flexDirection: "column",
    flexGrow: 1,
    flexShrink: 1,
  }));
  return (
    <mui.Card square={true} style={style}>
      <mui.CardHeader
        title="Help"
        action={
          <rexui.IconButton
            size="small"
            onClick={onClose}
            icon={<icons.Close />}
          />
        }
      />
      <mui.CardContent style={contentStyle}>
        <div dangerouslySetInnerHTML={{ __html: help }} />
      </mui.CardContent>
    </mui.Card>
  );
}
