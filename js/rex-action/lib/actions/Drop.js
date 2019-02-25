/**
 * @copyright 2015-present, Prometheus Research, LL);
 * @flow
 */

import * as React from 'react';
import {VBox, Element, css} from 'react-stylesheet';
import * as ReactUI from '@prometheusresearch/react-ui';

import {forceRefreshData} from 'rex-widget/data';
import * as ui from 'rex-widget/ui';

import Action from '../Action';
import Title from './Title';

export default class Drop extends React.Component {
  state: {
    confirmDelay: number,
    isInProgress: boolean,
  } = {
    confirmDelay: this.props.confirmDelay,
    isInProgress: false,
  };

  _countdown: ?number = null;

  static defaultProps = {
    width: 400,
    icon: 'remove',
    confirmDelay: 3,
    kind: 'danger',
  };

  render() {
    let {entity, onClose, context} = this.props;
    let {confirmDelay, isInProgress} = this.state;
    let title = this.constructor.renderTitle(this.props, context);
    return (
      <Action title={title}>
        <VBox
          flexGrow={1}
          background={css.rgba(255, 226, 226, 0.4)}
          color={css.rgb(68, 22, 22)}
          paddingBottom={20}
          paddingTop={5}
          maxWidth={400}
          boxShadow="0px 1px 2px 0px rgb(200, 200, 200)">
          {onClose &&
            <ReactUI.QuietButton icon={<ui.Icon name="remove" />} onClick={onClose} />}
          <VBox
            overflow="visible"
            flexGrow={1}
            alignItems="flex-start"
            justifyContent="center"
            paddingLeft={20}>
            <Element fontSize="90%" fontWeight={200} paddingBottom={15}>
              <Element>
                <p>
                  You are about to delete {article(entity.name)} {entity.name}.
                </p>
              </Element>
              <Element fontWeight={400}>
                <p>
                  This action cannot be undone.
                </p>
              </Element>
              <Element>
                {confirmDelay > 0
                  ? <p>
                      Wait {confirmDelay} seconds...
                    </p>
                  : <p>
                      Press the button below to permanently delete this record.
                    </p>}
              </Element>
            </Element>
            <ReactUI.DangerButton
              onClick={this.drop}
              disabled={isInProgress || confirmDelay > 0}
              icon={<ui.Icon name="remove" />}>
              Delete {entity.name}
            </ReactUI.DangerButton>
          </VBox>
        </VBox>
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
    const {entity: {name, type}, context} = this.props;
    const entity = context[name];
    const inProgressNotification = (
      <ui.Notification
        kind="info"
        ttl={Infinity}
        text={`Removing ${article(name)} ${name}`}
      />
    );
    const successNotification = (
      <ui.Notification
        kind="success"
        text={`Successfully removed ${article(name)} ${name}`}
      />
    );
    this.setState(state => ({...state, isInProgress: true}));
    const inProgressNotificationHandle = ui.showNotification(inProgressNotification);
    this.props.data.delete({[type.name]: {id: entity.id}}).then(() => {
      this.setState(
        state => ({...state, isInProgress: false}),
        () => {
          ui.removeNotification(inProgressNotificationHandle);
          ui.showNotification(successNotification);
          this.props.onEntityUpdate(entity, null);
          forceRefreshData();
        },
      );
    });
  };

  countdown = () => {
    let confirmDelay = this.state.confirmDelay - 1;
    if (confirmDelay === 0 && this._countdown != null) {
      clearInterval(this._countdown);
    }
    this.setState({confirmDelay});
  };

  static renderTitle({entity, title = `Drop ${entity.name}`}, context) {
    return <Title title={title} context={context} entity={entity} />;
  }

  static getTitle(props) {
    return props.title || `Drop ${props.entity.name}`;
  }
}

function article(name) {
  let article = 'a';
  if (['a', 'e', 'i', 'o'].indexOf(name[0]) !== -1) {
    article = 'an';
  }
  return article;
}
