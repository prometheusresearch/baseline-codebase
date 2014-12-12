/** @jsx React.DOM */
'use strict';

var React     = require('react/addons');
var Immutable = require('immutable');
var cx        = React.addons.classSet;

var ViewSource = React.createClass({

  render() {
    var {instrumentDefinition, channelConfigurations} = this.props;

    var data = Immutable.OrderedMap({
      instrument: {
        id: 'instrument',
        title: 'Instrument',
        content: jsonPrettyPrint(instrumentDefinition.value)
      }
    })
    .merge(channelConfigurations.map((channel, uid) => {
      if (channel) {
        return {
          id: uid,
          title: uid,
          content: jsonPrettyPrint(channel.value)
        };
      }
    })
    .filter(tab => tab !== undefined));

    var tabs = data.map((tab) => {
      return <button
        className={cx({'rfb-active': tab.id === this.state.active})}
        onClick={this.onTabSelected.bind(this, tab.id)}
        key={tab.id}>
        {tab.title}
      </button>
    }).valueSeq().toJS()

    var content = data.get(this.state.active).content;

    return (
      <div className={cx("rfb-ViewSource", this.props.className)}>
        <pre className="rfb-ViewSource__text">
          {content}
        </pre>
        <div className="rfb-ViewSource__buttons">
          {tabs}
          <button
            className="rfb-ViewSource__close"
            onClick={this.props.onClose}>
            &times;
          </button>
        </div>
      </div>
    );
  },

  getInitialState() {
    return {active: 'instrument'};
  },

  onTabSelected(id) {
    this.setState({active: id});
  },
});

function jsonPrettyPrint(value) {
  if (value && typeof value.toJS === 'function') {
    value = value.toJS();
  }
  return JSON.stringify(value, null, '  ');
}

module.exports = ViewSource;
