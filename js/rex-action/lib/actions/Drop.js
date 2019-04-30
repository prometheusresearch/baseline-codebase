/**
 * @copyright 2015-present, Prometheus Research, LL);
 * @noflow
 */

import * as React from "react";
import * as mui from "@material-ui/core";
import * as styles from "@material-ui/styles";
import * as icons from "@material-ui/icons";
import { VBox, Element, css } from "react-stylesheet";

import { forceRefreshData } from "rex-widget/data";
import * as rexui from "rex-ui";
import * as Theme from "rex-ui/Theme";
import * as ui from "rex-widget/ui";

import { type Entity, type Context } from "../model/types";
import Action from "../Action";
import Title from "./Title";

let useStyles = styles.makeStyles((theme: Theme.Theme) => {
  return {
    root: {
      backgroundColor: `${theme.palette.common.white} !important`
    }
  };
});

function DangerPaper(props) {
  let classes = useStyles();
  return <mui.Paper {...props} classes={classes} />;
}

type Props = {
  confirmDelay: number,
  entity: Entity,
  onClose: () => void,
  context: Context,
  title?: string
};

type State = {
  confirmDelay: number,
  isInProgress: boolean
};

export default class Drop extends React.Component<Props, State> {
  state = {
    confirmDelay: this.props.confirmDelay,
    isInProgress: false
  };

  _countdown: ?IntervalID = null;

  static defaultProps = {
    width: 400,
    icon: "remove",
    confirmDelay: 3,
    kind: "danger"
  };

  render() {
    let { entity, onClose, context } = this.props;
    let { confirmDelay, isInProgress } = this.state;
    let title = this.constructor.renderTitle(this.props, context);
    return (
      <Action title={title}>
        <DangerPaper
          style={{ maxWidth: 400, paddingTop: 5, paddingBottom: 20 }}
        >
          {onClose && <rexui.Button icon={<icons.Close />} onClick={onClose} />}
          <VBox
            overflow="visible"
            flexGrow={1}
            alignItems="flex-start"
            justifyContent="center"
            paddingLeft={20}
          >
            <Element fontSize="90%" fontWeight={200} paddingBottom={15}>
              <Element>
                <p>
                  You are about to delete {article(entity.name)}{" "}
                  {String(entity.name)}.
                </p>
              </Element>
              <Element fontWeight={400}>
                <p>This action cannot be undone.</p>
              </Element>
              <Element>
                {confirmDelay > 0 ? (
                  <p>Wait {confirmDelay} seconds...</p>
                ) : (
                  <p>
                    Press the button below to permanently delete this record.
                  </p>
                )}
              </Element>
            </Element>
            <rexui.DangerButton
              onClick={this.drop}
              disabled={isInProgress || confirmDelay > 0}
              icon={<icons.Close />}
            >
              Delete {String(entity.name)}
            </rexui.DangerButton>
          </VBox>
        </DangerPaper>
      </Action>
    );
  }

  componentDidMount() {
    this._countdown = setInterval(this.countdown, 1000);
  }

  componentWillUnmount() {
    if (this._countdown != null) {
      clearInterval(this._countdown);
    }
  }

  drop = () => {
    const {
      entity: { name, type },
      context
    } = this.props;
    // $FlowFixMe: ...
    const entity: string = context[name];
    const inProgressNotification = (
      <ui.Notification kind="info" text={`Removing ${article(name)} ${name}`} />
    );
    const successNotification = (
      <ui.Notification
        kind="success"
        text={`Successfully removed ${article(name)} ${name}`}
      />
    );
    this.setState(state => ({ ...state, isInProgress: true }));
    const inProgressNotificationHandle = ui.showNotification(
      inProgressNotification,
      Infinity
    );
    this.props.data.delete({ [type.name]: { id: entity.id } }).then(() => {
      this.setState(
        state => ({ ...state, isInProgress: false }),
        () => {
          ui.removeNotification(inProgressNotificationHandle);
          ui.showNotification(successNotification);
          this.props.onEntityUpdate(entity, null);
          forceRefreshData();
        }
      );
    });
  };

  countdown = () => {
    let confirmDelay = this.state.confirmDelay - 1;
    if (confirmDelay === 0 && this._countdown != null) {
      clearInterval(this._countdown);
    }
    this.setState({ confirmDelay });
  };

  static renderTitle({ entity, title = `Drop ${entity.name}` }, context) {
    return <Title title={title} context={context} entity={entity} />;
  }

  static getTitle(props) {
    return props.title || `Drop ${props.entity.name}`;
  }
}

function article(name) {
  let article = "a";
  if (["a", "e", "i", "o"].indexOf(name[0]) !== -1) {
    article = "an";
  }
  return article;
}
