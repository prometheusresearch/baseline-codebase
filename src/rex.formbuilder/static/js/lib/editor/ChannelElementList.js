/**
 * @jsx React.DOM
 */
'use strict';

var React               = require('react/addons');
var Reflux              = require('reflux');
var ReactForms          = require('react-forms');
var cx                  = React.addons.classSet;
var {Combobox, Option}  = require('react-autocomplete');
var Immutable           = require('immutable');
var Icon                = require('../Icon');
var RepeatingFieldset   = require('./RepeatingFieldset');
var InstrumentStore     = require('./InstrumentStore');
var ChannelStore        = require('./ChannelStore');

var RecordAutocomplete = React.createClass({
  mixins: [
    Reflux.connect(InstrumentStore, 'instrument'),
    Reflux.connect(ChannelStore, 'channels')
  ],

  render() {
    var {className, ...props} = this.props;
    var options = this._inactiveRecordIDs().map(id =>
      <Option key={id} value={id}>{id}</Option>);
    return (
      <Combobox {...props}
        className={cx("rfb-RecordAutocomplete", className)}
        autocomplete="both">
        {options}
      </Combobox>
    );
  },

  /**
   * Record IDs which have a question element in an active channel.
   */
  _activeRecordIDs() {
    var {channels, active} = this.state.channels;
    if (!active) {
      return Immutable.Set();
    }
    var channel = channels.get(active).configuration;
    return channel.value
      .get('pages')
      .flatMap(page =>
        page.get('elements', Immutable.List())
          .map(element => element.getIn(['options', 'fieldId'])))
      .toSet();
  },

  /**
   * Record IDs which don't have a question element in an active channel.
   */
  _inactiveRecordIDs() {
    var activeRecordIDs = this._activeRecordIDs();
    return this.state.instrument.definition.value
      .get('record')
      .map(record => record.get('id'))
      .filter(recordID => recordID !== undefined && !activeRecordIDs.contains(recordID))
      .toJS();
  }
});

var ChannelElementListToolbar = React.createClass({

  render() {
    var {className, ...props} = this.props;
    return (
      <div className={cx('rfb-ChannelElementListToolbar', className)}>
        <button
          className="rfb-ChannelElementListToolbar__button"
          onClick={this.onClick.bind(null, 'header')}>
          <Icon name="plus" />
          Add header
        </button>
        <button
          className="rfb-ChannelElementListToolbar__button"
          onClick={this.onClick.bind(null, 'text')}>
          <Icon name="plus" />
          Add text
        </button>
        <button
          className="rfb-ChannelElementListToolbar__button"
          onClick={this.onClick.bind(null, 'divider')}>
          <Icon name="plus" />
          Add divider
        </button>
      </div>
    );
  },

  onSelect(fieldId) {
    this.props.onAdd(Immutable.fromJS({
      type: 'question',
      options: {fieldId}
    }));
  },

  onClick(type) {
    this.props.onAdd(Immutable.fromJS({type}));
  }
});

var ChannelElementList = React.createClass({

  render() {
    var {className, value, ...props} = this.props;
    return (
      <div {...props} className={cx("rfb-ChannelElementList", className)}>
        <ReactForms.Label
          className="rfb-ChannelElementList__label"
          label={value.node.props.get('label')}
          />
        <ChannelElementListToolbar
          onAdd={this.onAdd}
          className="rfb-ChannelElementList__toolbar"
          />
        <RepeatingFieldset
          shouldRenderRemoveButton={this.shouldRenderRemoveButton}
          noLabel
          showTopButton={false}
          showBottomButton={false}
          value={value}
          itemClassName="rfb-ChannelElementList__fieldsetItem"
          className="rfb-ChannelElementList__fieldset"
          buttonCaption="Add new element"
          />
      </div>
    );
  },

  shouldRenderRemoveButton({value}) {
    return value.get('type') !== 'question';
  },

  onAdd(item) {
    this.props.value.transform(value => value.push(item));
  }
});

module.exports = ChannelElementList;
