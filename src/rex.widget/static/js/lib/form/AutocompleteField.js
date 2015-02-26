/**
 * @copyright Prometheus Research, LLC 2014
 */
'use strict';

var React             = require('react/addons');
var cx                = React.addons.classSet;
var Selectbox         = require('react-selectbox');

var ReactForms        = require('react-forms');
var Box               = require('../layout/Box');
var runtime           = require('../runtime');
var merge             = require('../merge');
var Icon              = require('../Icon');
var invariant         = require('../invariant');
var Hoverable         = require('../Hoverable');
var FormContextMixin  = require('./FormContextMixin');
var FieldBase         = require('./FieldBase');


var MutedIcon = React.createClass({
  mixins: [Hoverable],

  style: {
    opacity: '0.2'
  },

  styleOnHover: {
    opacity: '1'
  },

  render() {
    var {style, styleOnHover, ...props} = this.props;
    var {hover} = this.state;
    style = merge(
      this.style, style,
      hover && this.styleOnHover, hover && styleOnHover
    );
    return <Icon {...props} {...this.hoverable} style={style} />;
  }
});


var AutocompleteInput = React.createClass({

  styleIcon: {
    cursor: 'pointer',
    position: 'absolute',
    top: 10,
    right: 10
  },

  render() {
    var {value, data, onChange, required, titleAttribute, valueAttribute, ...props} = this.props;
    var {valueTitle} = this.state;
    if (value === null) {
      valueTitle = null;
    }
    return (
      <Box>
        <Selectbox
          ref="underlying"
          value={{id: value, title: valueTitle}}
          search={this._search}
          onChange={this.onChange}
          />
        {value && !required && <MutedIcon
          name="remove"
          style={this.styleIcon}
          onClick={this._clear}
          />}
      </Box>
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

  _getPort() {
    var {data} = this.props.data;
    return runtime.Storage.createPort(data);
  },

  _requestValue() {
    var {value} = this.props;
    var {valueTitle} = this.state;
    if (value && valueTitle === null) {
      var params = {};
      var {refs, data} = this.props.data;
      for (var key in refs) {
        params[key] = runtime.ApplicationState.get(refs[key]);
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
      params[key] = runtime.ApplicationState.get(refs[key]);
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
    var {className, data, titleAttribute, valueAttribute, value, ...props} = this.props;
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
        value={value}
        key={value.value.get('id')}
        />
    );
  }
});

module.exports = AutocompleteField;
