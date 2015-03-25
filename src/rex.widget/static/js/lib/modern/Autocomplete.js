/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React                   = require('react');
var Selectbox               = require('react-selectbox');
var IconButton              = require('./IconButton');
var DataSpecificationMixin  = require('./DataSpecificationMixin');
var DS                      = require('./DataSpecification');
var {VBox}                  = require('./Layout');

var AutocompleteStyle = {
  icon: {
    position: 'absolute',
    top: 10,
    right: 10
  }
};

var Autocomplete = React.createClass({

  render() {
    var {value, onChange, required} = this.props;
    var {valueTitle} = this.state;
    if (value === null) {
      valueTitle = null;
    }
    return (
      <VBox>
        <Selectbox
          ref="underlying"
          value={{id: value, title: valueTitle}}
          search={this._search}
          onChange={this.onChange}
          />
        {value && !required &&
          <IconButton
            name="remove"
            style={{self: AutocompleteStyle.icon}}
            onClick={this._clear}
            />}
      </VBox>
    );
  },

  getDefaultProps() {
    return {
      titleAttribute: 'title',
      valueAttribute: 'id'
    };
  },

  getInitialState() {
    return {
      valueTitle: null
    };
  },

  componentWillMount() {
    this._searchTimer = null;
  },

  componentDidMount() {
    this._requestValue();
  },

  componentDidUpdate() {
    this._requestValue();
  },

  componentWillReceiveProps({value}) {
    if (value !== this.props.value) {
      this.setState({valueTitle: null});
    }
  },

  componentWillUnmount() {
    this._searchTimer = null;
  },

  onChange(value) {
    this.setState({valueTitle: value.title});
    this.props.onChange(value.id);
  },

  _clear() {
    this.setState({valueTitle: null});
    this.props.onChange(null);
  },

  _requestValue() {
    var {value, dataSpec} = this.props;
    var {valueTitle} = this.state;
    if (value && valueTitle === null) {
      var params = dataSpec.produceParams().toJS();
      params['*'] = value;
      dataSpec.port
        .produceEntity(params)
        .then(this._onRequestValueComplete);
    }
  },

  _onRequestValueComplete(result) {
    var valueTitle = result[this.props.titleAttribute];
    this.setState({valueTitle});
  },

  _requestOptions(value) {
    var {titleAttribute, dataSpec} = this.props;
    var params = dataSpec.produceParams().toJS();
    params['*:top'] = 50;
    if (value) {
      params[`*.${titleAttribute}:contains`] = value;
    }
    return dataSpec.port
      .produceCollection(params)
      .then(this._onRequestOptionsComplete);
  },

  _onRequestOptionsComplete(options) {
    return options.map(option => ({
      id: option[this.props.valueAttribute],
      title: option[this.props.titleAttribute]
    }));
  },

  _search(_options, value, cb) {
    if (this._searchTimer !== null) {
      clearTimeout(this._searchTimer);
    }
    this._searchTimer = setTimeout(() => {
      this._requestOptions(value).nodeify(cb)
    }, 300);
  }

});

module.exports = Autocomplete;
