/**
 * @jsx React.DOM
 */

import React, {PropTypes} from 'react';
import BaseSelect         from './BaseSelect';
import {VBox}             from './Layout';

/**
 * Select component.
 *
 * @public
 */
export default class Select extends React.Component {

  static propTypes = {
    /**
     * Options.
     *
     * An array of objects with ``id`` and ``title`` attributes which is used as
     * options for a select.
     */
    options: PropTypes.array.isRequired,

    /**
     * Dataset to use.
     *
     * This compliments options and allows to pass dataset fetch from server
     * which will be treated as a set of available options.
     *
     * It should provide a colleciton of objects with ``id`` and ``title``
     * attributes.
     */
    data: PropTypes.object,

    /**
     * Callback which fires when value changes.
     */
    onChange: PropTypes.func,

    /**
     * Currently selected value.
     *
     * This matches against ``id`` of options.
     */
    value: PropTypes.object
  };
  
  render() {
    var {noEmptyValue, data, value, options, onChange,
      titleForEmpty, ...props} = this.props;
    return (
      <VBox {...props}>
        <BaseSelect
          options={options}
          noEmptyValue={noEmptyValue}
          titleForEmpty={titleForEmpty}
          data={data}
          value={value}
          onValue={onChange}
          />
      </VBox>
    );
  }

  componentDidMount() {
    this._checkForAutovalue();
  }

  componentDidUpdate() {
    this._checkForAutovalue();
  }

  _checkForAutovalue() {
    var {value, noEmptyValue, options, onChange} = this.props;
    if (value == null && noEmptyValue && options && options.length > 0) {
      onChange(options[0].id);
    }
  }
}
