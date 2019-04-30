/**
 * @copyright 2016, Prometheus Research, LLC
 * @flow
 */

import * as React from "react";
import * as rexui from "rex-ui";

type Props = {|
  /**
   * Value.
   */
  value: string,

  /**
   * Callback to execute when value changes.
   */
  onChange: (?string) => void,

  /**
   * If autocomplete should signify an error.
   */
  error: boolean,

  /**
   * Data specification from which to fetch options.
   *
   * The filter which would be applied to match against record is
   * ``*.titleAttribute:contains=<term>`` where titleAttribute is passed via
   * ``titleAttribute`` prop.
   */
  data: Object,

  /**
   * Data specification from which to fetch title for the selected value.
   *
   * If not provided then `data` is used.
   */
  titleData?: Object,

  /**
   * Attribute used as a title of a record.
   *
   * Also used to specify a filter.
   */
  titleAttribute: string,

  /**
   * Attribute used as a value of a record.
   */
  valueAttribute?: string,

  debounce: number,

  limit: number,

  renderSuggestion?: rexui.AutocompleteRenderSuggestion,
  renderInput?: rexui.AutocompleteRenderInput
|};

type Value =
  | {
      type: "value",
      value: ?rexui.AutocompleteItem
    }
  | {
      type: "initial-value",
      id: string
    };

type State = {
  value: Value
};

/**
 * Autocomplete component.
 *
 * @public
 */
export default class Autocomplete extends React.Component<Props, State> {
  static propTypes = {};

  static defaultProps = {
    titleAttribute: "title",
    valueAttribute: "id",
    debounce: 300,
    limit: 50
  };

  _searchTimer: ?TimeoutID = null;
  _mounted: boolean = true;

  constructor(props: Props) {
    super(props);
    let value = { type: "initial-value", id: props.value };
    this.state = { value };
  }

  static getDerivedStateFromProps(props: Props, state: State) {
    if (props.value != null) {
      // props.value (which is id) is not null, we need to fetch record
      if (state.value.value != null && state.value.value.id != props.value) {
        // fetching
        let value = { type: "initial-value", id: props.value };
        return { value };
      } else {
        // ok, we have something in state and it has the same id, skipping
        // fetching then
        return null;
      }
    } else {
      // props.value (which is id) is null so we just set init value to null
      let value = { type: "value", value: null };
      return { value };
    }
  }

  render() {
    let {
      value: _value,
      debounce: _debounce,
      valueAttribute: _valueAttribute,
      titleAttribute: _titleAttribute,
      titleData: _titleData,
      limit: _limit,
      error,
      renderSuggestion,
      renderInput,
      ...props
    } = this.props;

    let { value } = this.state;

    if (value.type === "initial-value") {
      return <rexui.AutocompleteLoading />;
    } else if (value.type === "value") {
      return (
        <rexui.Autocomplete
          value={value.value}
          search={this._search}
          onChange={this.onChange}
          error={error}
          renderSuggestion={renderSuggestion}
          renderInput={renderInput}
        />
      );
    } else {
      throw new Error("shouldn't happen");
    }
  }

  componentDidMount() {
    this._requestValue();
  }

  componentDidUpdate() {
    this._requestValue();
  }

  componentWillUnmount() {
    this._mounted = false;
    if (this._searchTimer !== null) {
      clearTimeout(this._searchTimer);
      this._searchTimer = null;
    }
  }

  _requestValue() {
    let { value, titleData = this.props.data } = this.props;
    if (value != null && this.state.value.type === "initial-value") {
      titleData
        .params({ "*": value })
        .getSingleEntity()
        .produce()
        .then(this._onRequestValueComplete, this._onRequestValueError);
    }
  }

  _onRequestValueComplete = (value: rexui.AutocompleteItem) => {
    if (this._mounted) {
      this.setState({ value: { type: "value", value } });
    }
  };

  _onRequestValueError = (err: Error | string) => {
    console.error(err); // eslint-disable-line no-console
  };

  onChange = (value: ?rexui.AutocompleteItem) => {
    if (value != null) {
      this.setState({ value: { type: "value", value } });
      this.props.onChange(value.id);
    } else {
      this.setState({ value: { type: "value", value: null } });
      this.props.onChange(null);
    }
  };

  _clear = () => {
    this.props.onChange(null);
  };

  _open = () => {
    this.refs.underlying.showResults("");
  };

  _requestOptions = (value: ?string) => {
    let { titleAttribute, data, limit } = this.props;
    if (limit) {
      data = data.limit(limit);
    }
    if (value) {
      data = data.params({ [`*.${titleAttribute}:contains`]: value });
    }
    return data
      .produce()
      .then(this._onRequestOptionsComplete, this._onRequestOptionsError);
  };

  _onRequestOptionsComplete = (options: Object[]) => {
    return options.map<rexui.AutocompleteItem>(option => ({
      ...option,
      id: option[this.props.valueAttribute],
      title: option[this.props.titleAttribute]
    }));
  };

  _onRequestOptionsError = (err: Error | string) => {
    throw err;
  };

  _search = (
    params: rexui.AutocompleteSearchParams,
    cb: rexui.AutocompleteSearchCallback
  ) => {
    if (this._searchTimer !== null) {
      clearTimeout(this._searchTimer);
    }
    this._searchTimer = setTimeout(() => {
      this._requestOptions(params.value).then(
        result => cb(null, result),
        err => cb(err)
      );
    }, this.props.debounce);
  };
}
