/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React         from 'react';
import RexWidget     from 'rex-widget';
import  {VBox, HBox} from 'rex-widget/lib/Layout';
import Style         from './Drop.module.css';

export default class Drop extends React.Component {

  static defaultProps = {
    width: 400,
    icon: 'remove',
    confirmDelay: 3
  };

  constructor(props) {
    super(props);
    this.state = {
      confirmDelay: this.props.confirmDelay
    };
  }

  render() {
    let {width, message, entity, onClose} = this.props;
    let {confirmDelay} = this.state;
    let title = this.constructor.getTitle(this.props);
    return (
      <VBox size={1} className={Style.self} style={{width}}>
        {title &&
          <HBox className={Style.header}>
            <VBox size={1} className={Style.title}>
              <h4>
                {title}
              </h4>
            </VBox>
            {onClose &&
              <RexWidget.Button
                quiet
                icon="remove"
                onClick={onClose}
                />}
          </HBox>}
        <VBox size={1} centerVertically centerHorizontally className={Style.content}>
          <VBox className={Style.message}>
            <div dangerouslySetInnerHTML={{__html: message}} />
          </VBox>
          <RexWidget.Button
            onClick={this.drop}
            disabled={confirmDelay > 0}
            danger
            icon="remove">
            Drop
          </RexWidget.Button>
          <VBox style={Style.messageBottom}>
            {confirmDelay > 0 ?
              <p>
                Wait {confirmDelay} seconds
              </p> :
              <p>
                Press button above to drop {entity.name}
              </p>}
          </VBox>
        </VBox>
      </VBox>
    );
  }

  componentDidMount() {
    this._countdown = setInterval(this.countdown, 1000);
  }

  componentWillUnmount() {
    clearTimeout(this._countdown);
  }

  drop = () => {
    let {entity, context, onContext, onClose} = this.props;
    let id = context[entity.name].id;
    this.props.data.delete({[entity.type.name]: {id}}).then(() => {
      RexWidget.forceRefreshData();
      this.props.onContext({[entity.name]: undefined});
      this.props.onClose()
    });
  }

  countdown = () => {
    let confirmDelay = this.state.confirmDelay - 1;
    if (confirmDelay === 0) {
      clearTimeout(this._countdown);
    }
    this.setState({confirmDelay});
  }

  static getTitle(props) {
    return props.title || `Drop ${props.entity.name}`;
  }
}
