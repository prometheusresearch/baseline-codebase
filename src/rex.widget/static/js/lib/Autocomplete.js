/**
 * @copyright 2015, Prometheus Research, LLC
 */

import autobind               from 'autobind-decorator';
import React                  from 'react';
import AutocompleteBase       from '@prometheusresearch/react-autocomplete/lib/themed/Bootstrap';
import IconButton             from './IconButton';
import {VBox}                 from './Layout';
import * as stylesheet from '../stylesheet';

/**
 * Autocomplete component.
 *
 * @public
 */
@stylesheet.attach
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
    IconButton: {
      Component: IconButton,
      Root: {
        position: 'absolute',
        top: 10,
        right: 10,
      }
    },
    Autocomplete: AutocompleteBase
  });

  static defaultProps = {
    titleAttribute: 'title',
    valueAttribute: 'id'
  };

  constructor(props) {
    super(props);
    this.state = {
      value: null
    };
  }

  render() {
    let {value} = this.props;
    let {IconButton, Autocomplete} = this.stylesheet;
    return (
      <VBox>
        <Autocomplete
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
      </VBox>
    );
  }

  componentWillMount() {
    this._searchTimer = null;
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

  @autobind
  onChange(value) {
    if (value) {
      this.props.onChange(value.id);
      this.setState({value});
    } else {
      this.props.onChange(undefined);
      this.setState({value: null});
    }
  }

  @autobind
  _clear() {
    this.setState({value: null});
    this.props.onChange(null);
  }

  @autobind
  _open() {
    this.refs.underlying.showResults('');
  }

  @autobind
  _onRequestValueComplete(value) {
    this.setState({value});
  }

  @autobind
  _onRequestValueError(err) {
    console.error(err);
  }

  @autobind
  _requestOptions(value) {
    let {titleAttribute, data} = this.props;
    data = data.limit(50);
    if (value) {
      data = data.params({[`*.${titleAttribute}:contains`]: value});
    }
    return data.produce().then(
      this._onRequestOptionsComplete,
      this._onRequestOptionsError);
  }

  @autobind
  _onRequestOptionsComplete(options) {
    return options.map(option => ({
      ...option,
      id: option[this.props.valueAttribute],
      title: option[this.props.titleAttribute]
    }));
  }

  @autobind
  _onRequestOptionsError(err) {
    console.error(err);
  }

  @autobind
  _search(_options, value, cb) {
    if (this._searchTimer !== null) {
      clearTimeout(this._searchTimer);
    }
    this._searchTimer = setTimeout(() => {
      this._requestOptions(value).then(
        result => cb(null, result),
        err => cb(err)
      );
    }, 300);
  }

}
