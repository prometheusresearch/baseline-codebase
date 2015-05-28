/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React                       = require('react/addons');
var RexWidget                   = require('rex-widget');
var {VBox, HBox}                = RexWidget.Layout;

var DropStyle = {
  self: {
    flex: 1,
    background: 'rgba(255, 226, 226, 0.4)',
    color: 'rgb(68, 22, 22)'
  },
  title: {
    flex: 1
  },
  header: {
    padding: 10
  },
  content: {
    flex: 1,
    padding: 10
  },
  messageBottom: {
    marginTop: 10,
    fontSize: '90%'
  },
  message: {
    fontSize: '90%'
  }
};

var Drop = React.createClass({

  render() {
    var {width, message, entity} = this.props;
    var {confirmDelay} = this.state;
    var title = this.constructor.getTitle(this.props);
    return (
      <VBox style={{...DropStyle.self, width}}>
        {title &&
          <HBox style={DropStyle.header}>
            <VBox style={DropStyle.title}>
              <h4>
                {title}
              </h4>
            </VBox>
            <RexWidget.Button
              quiet
              icon="remove"
              onClick={this.props.onClose}
              />
          </HBox>}
        <VBox style={DropStyle.content} centerVertically centerHorizontally>
          <VBox style={DropStyle.message}>
            <div dangerouslySetInnerHTML={{__html: message}} />
          </VBox>
          <RexWidget.Button
            onClick={this.drop}
            disabled={confirmDelay > 0}
            danger
            icon="remove">
            Drop
          </RexWidget.Button>
          <VBox style={DropStyle.messageBottom}>
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
  },

  getDefaultProps() {
    return {
      width: 400,
      icon: 'remove',
      confirmDelay: 3
    };
  },

  getInitialState() {
    return {
      confirmDelay: this.props.confirmDelay
    };
  },

  componentDidMount() {
    this._countdown = setInterval(this.countdown, 1000);
  },

  componentWillUnmount() {
    clearTimeout(this._countdown);
  },

  drop() {
    var id = this.props.context[this.props.entity.name];
    var entity = {};
    entity[this.props.entity.type] = {id};
    this.props.data.delete(entity).then(() => {
      RexWidget.forceRefreshData();
      var contextUpdate = {};
      contextUpdate[this.props.entity.name] = undefined;
      this.props.onContext(contextUpdate);
      this.props.onClose()
    });
  },

  countdown() {
    var confirmDelay = this.state.confirmDelay - 1;
    if (confirmDelay === 0) {
      clearTimeout(this._countdown);
    }
    this.setState({confirmDelay});
  },

  statics: {
    getTitle(props) {
      return props.title || `Drop ${props.entity.name}`;
    }
  }
});

module.exports = Drop;

