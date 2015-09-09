/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React                  from 'react';
import AutocompleteBase       from '@prometheusresearch/react-autocomplete/lib/themed/Bootstrap';
import IconButton             from './IconButton';
import DS                     from './DataSpecification';
import {VBox}                 from './Layout';
import Style                  from './Autocomplete.module.css';

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
    dataSpec: React.PropTypes.object,

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

  static defaultProps = {
    titleAttribute: 'title',
    valueAttribute: 'id'
  };

  constructor(props) {
    super(props);
    this.state = {
      valueTitle: null
    };
  }

  render() {
    let {value, onChange, required} = this.props;
    let {valueTitle} = this.state;
    if (value === null) {
      valueTitle = null;
    }
    return (
      <VBox>
        <AutocompleteBase
          ref="underlying"
          value={{id: value, title: valueTitle}}
          search={this._search}
          onChange={this.onChange}
          />
        {value && !required ?
          <IconButton
            name="remove"
            className={Style.icon}
            onClick={this._clear}
            /> :
          <IconButton
            name="triangle-bottom"
            className={Style.icon}
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
      this.setState({valueTitle: null});
    }
  }

  componentWillUnmount() {
    this._searchTimer = null;
  }

  _requestValue() {
    let {value, dataSpec} = this.props;
    let {valueTitle} = this.state;
    if (value && valueTitle === null) {
      let params = dataSpec.produceParams().toJS();
      params['*'] = value;
      dataSpec.port
        .produceEntity(params)
        .then(this._onRequestValueComplete);
    }
  }

  onChange = (value) => {
    if (value) {
      this.props.onChange(value.id);
      this.setState({valueTitle: value.title});
    } else {
      this.props.onChange(undefined);
      this.setState({valueTitle: null});
    }
  }

  _clear = () => {
    this.setState({valueTitle: null});
    this.props.onChange(null);
  }

  _open = () => {
    this.refs.underlying.showResults('');
  }

  _onRequestValueComplete = (result) => {
    let valueTitle = result[this.props.titleAttribute];
    this.setState({valueTitle});
  }

  _requestOptions = (value) => {
    let {titleAttribute, dataSpec} = this.props;
    let params = dataSpec.produceParams().toJS();
    params['*:top'] = 50;
    if (value) {
      params[`*.${titleAttribute}:contains`] = value;
    }
    return dataSpec.port
      .produceCollection(params)
      .then(this._onRequestOptionsComplete);
  }

  _onRequestOptionsComplete = (options) => {
    return options.map(option => ({
      id: option[this.props.valueAttribute],
      title: option[this.props.titleAttribute]
    }));
  }

  _search = (_options, value, cb) => {
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
