/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';
import AutocompleteBase from '@prometheusresearch/react-autocomplete';
import {IconButton} from './ui';
import * as layout from '../layout';
import * as css from '../css';
import * as stylesheet from '../stylesheet';

/**
 * Autocomplete component.
 *
 * @public
 */
export default class Autocomplete extends React.Component {

  static propTypes = {
    /**
     * Value.
     */
    value: React.PropTypes.string,

    /**
     * Callback to execute when value changes.
     */
    onChange: React.PropTypes.func,

    /**
     * Data specification from which to fetch options.
     *
     * The filter which would be applied to match against record is
     * ``*.titleAttribute:contains=<term>`` where titleAttribute is passed via
     * ``titleAttribute`` prop.
     */
    data: React.PropTypes.object,

    /**
     * Data specification from which to fetch title for the selected value.
     *
     * If not provided then `data` is used.
     */
    titleData: React.PropTypes.object,

    /**
     * Attribute used as a title of a record.
     *
     * Also used to specify a filter.
     */
    titleAttribute: React.PropTypes.string,

    /**
     * Attribute used as a value of a record.
     */
    valueAttribute: React.PropTypes.string,
  };

  static stylesheet = stylesheet.create({
    Root: {
      Component: layout.HBox,
      alignItems: 'center'
    },
    IconButton: {
      Component: IconButton,
      Root: {
        position: 'absolute',
        top: 7,
        right: 10,
      }
    },
    Autocomplete: {
      Component: AutocompleteBase,
      Root: {
        flex: 1,
      },
      Input: {
        display: 'block',
        width: '100%',
        height: 34,
        padding: css.padding(6, 12),
        fontSize: '14px',
        lineHeight: 1.42857143,
        color: '#000',
        backgroundColor: '#fff',
        backgroundImage: css.none,
        border: css.border(1, '#ccc'),
        borderRadius: 2,
        boxShadow: css.insetBoxShadow(0, 1, 1, css.rgba(0, 0,0 , 0.075)),
        transition: 'border-color ease-in-out .15s,box-shadow ease-in-out .15s',
        error: {
          border: css.border(1, 'red'),
        },
        focus: {
          border: css.border(1, '#888'),
          boxShadow: css.insetBoxShadow(0, 1, 1, css.rgba(0, 0, 0, 0.075)),
          outline: css.none,
        },
      },
      ResultList: {
        Root: {
          margin: 0,
          width: '100%',
          maxHeight: 200,
          overflow: 'auto',
          minWidth: 160,
          padding: css.padding(5, 0),
          fontSize: '14px',
          textAlign: 'left',
          listStyle: css.none,
          backgroundColor: '#fff',
          backgroundClip: 'padding-box',
          border: css.border(1, css.rgba(0, 0, 0, 0.15)),
          borderRadius: 2,
          boxShadow: css.boxShadow(0, 6, 12, css.rgba(0, 0, 0, 0.175)),
          focus: {
            outline: css.none,
          }
        },
        Result: {
          Root: {
            display: 'block',
            padding: css.padding(5, 20),
            clear: 'both',
            fontWeight: '400',
            lineHeight: '1.42857143',
            color: '#333',
            whiteSpace: 'nowrap',
            userSelect: css.none,
            WebkitUserSelect: css.none,
            focus: {
              outline: css.none,
              color: '#262626',
              textDecoration: css.none,
              backgroundColor: '#f5f5f5'
            },
            hover: {
              color: '#262626',
              textDecoration: css.none,
              backgroundColor: '#f5f5f5'
            }
          }
        }
      }
    }
  });

  static defaultProps = {
    titleAttribute: 'title',
    valueAttribute: 'id',
    debounce: 300,
    limit: 50,
  };

  constructor(props) {
    super(props);
    this._searchTimer = null;
    this.state = {
      value: null
    };
  }

  render() {
    let {value, ...props} = this.props;
    let {Root, IconButton, Autocomplete} = this.constructor.stylesheet;
    return (
      <Root>
        <Autocomplete
          {...props}
          ref="underlying"
          value={{...(value === null ? null : this.state.value), id: value}}
          search={this._search}
          onChange={this.onChange}
          />
        {value ?
          <IconButton
            name="remove"
            onClick={this._clear}
            /> :
          <IconButton
            name="triangle-bottom"
            onClick={this._open}
            />}
      </Root>
    );
  }

  componentDidMount() {
    this._requestValue();
  }

  componentDidUpdate() {
    this._requestValue();
  }

  componentWillReceiveProps({value}) {
    if (value !== this.props.value) {
      this.setState({value: null});
    }
  }

  componentWillUnmount() {
    this._searchTimer = null;
  }

  _requestValue() {
    let {value, titleData = this.props.data} = this.props;
    if (value && this.state.value === null) {
      titleData
        .params({'*': value})
        .getSingleEntity()
        .produce()
        .then(
          this._onRequestValueComplete,
          this._onRequestValueError);
    }
  }

  onChange = (value) => {
    if (value) {
      this.props.onChange(value.id);
      this.setState({value});
    } else {
      this.props.onChange(null);
      this.setState({value: null});
    }
  };

  _clear = () => {
    this.setState({value: null});
    this.props.onChange(null);
  };

  _open = () => {
    this.refs.underlying.showResults('');
  };

  _onRequestValueComplete = (value) => {
    this.setState({value});
  };

  _onRequestValueError = (err) => {
    /* istanbul ignore next */
    console.error(err); // eslint-disable-line no-console
  };

  _requestOptions = (value) => {
    let {titleAttribute, data, limit} = this.props;
    if (limit) {
      data = data.limit(limit);
    }
    if (value) {
      data = data.params({[`*.${titleAttribute}:contains`]: value});
    }
    return data.produce().then(
      this._onRequestOptionsComplete,
      this._onRequestOptionsError);
  };

  _onRequestOptionsComplete = (options) => {
    return options.map(option => ({
      ...option,
      id: option[this.props.valueAttribute],
      title: option[this.props.titleAttribute]
    }));
  };

  _onRequestOptionsError = (err) => {
    /* istanbul ignore next */
    console.error(err); // eslint-disable-line no-console
  };

  _search = (_options, value, cb) => {
    if (this._searchTimer !== null) {
      clearTimeout(this._searchTimer);
    }
    this._searchTimer = setTimeout(() => {
      this._requestOptions(value).then(
        result => cb(null, result),
        err => cb(err)
      );
    }, this.props.debounce);
  };

}
