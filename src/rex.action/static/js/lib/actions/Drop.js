/**
 * @copyright 2015, Prometheus Research, LL);
 */

import React from 'react';

import {VBox, HBox} from 'rex-widget/layout';
import {forceRefreshData} from 'rex-widget/data';
import * as Stylesheet from 'rex-widget/stylesheet';
import * as ui from 'rex-widget/ui';
import * as CSS from 'rex-widget/css';

import Action from '../Action';

import Title from './Title';

let stylesheet = Stylesheet.create({
  Root: {
    Component: VBox,
    flex: 1,
    background: CSS.rgba(255, 226, 226, 0.4),
    color: CSS.rgb(68, 22, 22),
    paddingBottom: 20,
    paddingTop: 5,
    maxWidth: 400,
    boxShadow: "0px 1px 2px 0px rgb(200, 200, 200)",
  },

  Header: {
    Component: HBox,
    paddingTop: 1,
  },

  Content: {
    Component: VBox,
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingLeft: 20,
  },

  Title: {
    Component: VBox,
    flex: 1,
  },

  MessageBottom: {
    paddingBottom: 10,
    fontSize: '90%',
  },

  Message: {
    fontSize: '90%',
  }
});

export default class Drop extends React.Component {

  static defaultProps = {
    width: 400,
    icon: 'remove',
    confirmDelay: 3,
    kind: 'danger',
  };

  constructor(props) {
    super(props);
    this.state = {
      confirmDelay: this.props.confirmDelay
    };
  }

  render() {
    let {message, entity, onClose, context} = this.props;
    let {confirmDelay} = this.state;
    let title = this.constructor.renderTitle(this.props, context);
    return (
     <Action title={title}>
      <stylesheet.Root>
            {onClose &&
              <ui.QuietButton
                icon="remove"
                onClick={onClose}
                />}
        <stylesheet.Content>
          <stylesheet.Message>
            <p>You are about to delete a {entity.name}.</p>
            <b> This action cannot be undone.</b>
          </stylesheet.Message>
          <stylesheet.MessageBottom>
            {confirmDelay > 0 ?
              <p>
                Wait {confirmDelay} seconds...
              </p> :
              <p>
               Press the button below to permanently delete this record.
              </p>}
          </stylesheet.MessageBottom>
          <ui.DangerButton
            onClick={this.drop}
            disabled={confirmDelay > 0}
            icon="remove">
            Delete {entity.name}
          </ui.DangerButton>
        </stylesheet.Content>
      </stylesheet.Root>
     </Action>
    );
  }

  componentDidMount() {
    this._countdown = setInterval(this.countdown, 1000);
  }

  componentWillUnmount() {
    clearInterval(this._countdown);
  }

  drop = () => {
    let {entity: {name, type}, context} = this.props;
    let entity = context[name];
    this.props.data.delete({[type.name]: {id: entity.id}}).then(() => {
      this.props.onEntityUpdate(entity, null);
      forceRefreshData();
    });
  }

  countdown = () => {
    let confirmDelay = this.state.confirmDelay - 1;
    if (confirmDelay === 0) {
      clearInterval(this._countdown);
    }
    this.setState({confirmDelay});
  }

  static renderTitle({entity, title = `Drop ${entity.name}`}, context) {
    return <Title title={title} context={context} entity={entity} />;
  }

  static getTitle(props) {
    return props.title || `Drop ${props.entity.name}`;
  }
}
