/**
 * @copyright Prometheus Research, LLC 2014
 */
'use strict';

var React             = require('react/addons');
var cx                = React.addons.classSet;
var Selectbox         = require('react-selectbox');

var ReactForms        = require('react-forms');
var Element           = require('../layout/Element');
var runtime           = require('../runtime');
var invariant         = require('../invariant');
var FormContextMixin  = require('./FormContextMixin');
var FieldBase         = require('./FieldBase');

var AutocompleteInput = React.createClass({

  render() {
    var {value, data, onChange, titleAttribute, valueAttribute, ...props} = this.props;
    var {valueTitle} = this.state;
    return (
      <Element>
        <Selectbox
          ref="underlying"
          value={{id: value, title: valueTitle}}
          search={this._search}
          onChange={this.onChange}
          />
      </Element>
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


  componentWillUnmount() {
    this._searchTimer = null;
  },

  onChange(value) {
    this.setState({valueTitle: value.title});
    this.props.onChange(value.id);
  },

  _getPort() {
    var {data} = this.props.data;
    return runtime.Storage.createPort(data);
  },

  _requestValue() {
    var {value,} = this.props;
    if (value) {
      var params = {};
      var {refs, data} = this.props.data;
      for (var key in refs) {
        params[key] = ApplicationState.get(refs[key]);
      }
      params['*'] = value;
      this._getPort()
        .produce(params)
        .then(this._onRequestValueComplete, this._onRequestValueError);
    }
  },

  _onRequestValueComplete(response) {
    var {titleAttribute} = this.props;
    var key = Object.keys(response)[0];
    var entity = response[key][0];
    var valueTitle = titleAttribute ? entity[titleAttribute] : entity.title;
    this.setState({valueTitle});
  },

  _onRequestValueError(error) {
    // TODO: handle error properly
    console.error(error);
  },

  _requestOptions(value) {
    var {titleAttribute} = this.props;
    var {refs, data} = this.props.data;
    var params = {
      '*:top': 50
    };
    for (var key in refs) {
      params[key] = ApplicationState.get(refs[key]);
    }
    if (value) {
      params[`*.${titleAttribute}:contains`] = value;
    }
    return this._getPort()
      .produce(params)
      .then(this._onRequestOptionsComplete, this._onRequestOptionsError);
  },

  _onRequestOptionsComplete(data) {
    var keys = Object.keys(data);
    invariant(keys.length === 1);
    var key = keys[0];
    var options = data[key];
    var {valueAttribute, titleAttribute} = this.props;
    options = options.map(option => ({
      id: valueAttribute ? option[valueAttribute] : option.id,
      title: titleAttribute ? option[titleAttribute] : option.title
    }));
    this.setState({options});
    return options;
  },

  _onRequestOptionsError(error) {
    // TODO: handle error properly
    console.error(error);
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

var AutocompleteField = React.createClass({

  render() {
    var {className, data, titleAttribute, valueAttribute, ...props} = this.props;
    var input = (
      <AutocompleteInput
        data={data}
        titleAttribute={titleAttribute}
        valueAttribute={valueAttribute}
        />
    );
    return (
      <FieldBase
        {...props}
        input={input}
        className={cx('rw-AutocompleteField', className)}
        />
    );
  }
});

module.exports = AutocompleteField;
