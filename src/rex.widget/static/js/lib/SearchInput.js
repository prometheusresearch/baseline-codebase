/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React                           = require('react');
var {VBox}                          = require('./Layout');
var emptyFunction                   = require('./emptyFunction');
var {border, insetBoxShadow, rgba}  = require('./StyleUtils');
var Focusable                       = require('./Focusable');
var Hoverable                       = require('./Hoverable');
var Icon                            = require('./Icon');
var TimeoutMixin                    = require('./TimeoutMixin');

var SearchInputStyle = {
  input: {
    display: 'block',
    width: '100%',
    height: 34,
    padding: '6px 12px',
    fontSize: 14,
    lineHeight: 1.42857143,
    color: '#555',
    backgroundColor: '#fff',
    backgroundImage: 'none',
    border: border(1, 'solid', '#ccc'),
    borderRadius: 4,
    boxShadow: insetBoxShadow(0, 1, 1, 0, rgba(0, 0, 0, 0.075))
  },
  icon: {
    position: 'absolute',
    top: 11,
    right: 8
  },
  onFocus: {
    input: {
      borderColor: '#66afe9',
      outline: 0,
      boxShadow: insetBoxShadow(0, 1, 1, 0, rgba(0, 0, 0, 0.075))
    }
  }
};

var IconButtonStyle = {
  self: {
    fontSize: '9pt',
    cursor: 'pointer',
    color: '#ddd'
  },
  onHover: {
    self: {
      color: '#333'
    }
  }
};

var IconButton = React.createClass({

  render() {
    var {style, hover, ...props} = this.props;
    style = {
      ...IconButtonStyle.self,
      ...style,
      ...(hover ? IconButtonStyle.onHover.self : null)
    };
    return (
      <Icon
        {...props}
        style={style}
        />
    );
  }
});

IconButton = Hoverable(IconButton);

var Input = React.createClass({

  render() {
    var {style, styleOnFocus, focus, ...props} = this.props;
    style = {
      ...style,
      ...(focus ? styleOnFocus : null)
    };
    return (
      <input
        {...props}
        style={style}
        />
    );
  }
});

Input = Focusable(Input);

var SearchInput = React.createClass({
  mixins: [TimeoutMixin],

  render() {
    var {value, placeholder, disabled, focus, style, ...props} = this.props;
    if (this.state.value !== undefined) {
      value = this.state.value;
    }
    if (value == null) {
      value = '';
    }
    return (
      <VBox {...props} style={style.self} onChange={undefined}>
        <Input
          type="search"
          style={{...SearchInputStyle.input, ...style.input}}
          styleOnFocus={SearchInputStyle.onFocus.input}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          onChange={this._onChange}
          />
        {value !== '' &&
          <IconButton
            style={SearchInputStyle.icon}
            name="remove"
            onClick={this._remove}
            />}
      </VBox>
    );
  },

  getDefaultProps() {
    return {
      onChange: emptyFunction,
      placeholder: 'Search...',
      style: {}
    };
  },

  getInitialState() {
    return {
      value: undefined
    };
  },

  componentWillMount() {
    this._timeout = null;
  },

  componentWillReceiveProps(nextProps) {
    if (this.state.value !== undefined && nextProps.value !== this.state.value) {
      if (this._timeout === null) {
        this.setState({value: undefined});
      } else {
        this.clearTimeout();
      }
    }
  },

  _clearTimeout() {
    this.clearTimeout(this._timeout);
    this._timeout = null;
    this.setState({value: undefined});
  },

  _onChange(e) {
    var value = e.target.value;
    if (value === '') {
      value = null;
    }
    if (this.props.throttleOnChange) {
      this.clearTimeout(this._timeout);
      this.setState({value});
      this._timeout = this.setTimeout(() => {
        this.props.onChange(value);
        this._clearTimeout();
      }, this.props.throttleOnChange);
    } else {
      this.props.onChange(value);
    }
  },

  _remove() {
    this.props.onChange(null);
  }
});

module.exports = SearchInput;
