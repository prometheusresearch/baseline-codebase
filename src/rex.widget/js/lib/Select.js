/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React, {PropTypes} from 'react';
import BaseSelect         from './BaseSelect';
import {VBox}             from '../layout';

/**
 * Renders a <VBox> with a <BaseSelect>.
 *
 * @public
 */
export default class Select extends React.Component {

  static propTypes = {
    /**
     * The list of items to appear in the drop-down before the data.
     * Each object in the list must have an ``id`` and a ``title``.
     */
    options: PropTypes.array.isRequired,

    /**
     * Set to false, if you want an empty value in the drop-down list.
     */
    noEmptyValue: React.PropTypes.bool,

    /**
     * The title of the empty value.
     */
    titleForEmpty: React.PropTypes.string,

    /**
     * This object must have a **data** property which contains
     * the list of items to appear in the drop-down after the options.
     *
     * Each element in the list must have an ``id`` and a ``title``.
     *
     * A dataset fetched from the server can be used here.
     */
    data: PropTypes.object,

    /**
     * This function will be called when the user selects an item.
     * It is called with 2 arguments: id and value.
     * Both id and value will be set to the id of the item the user selected.
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
    let {noEmptyValue, data, value, options, onChange,
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
    let {value, noEmptyValue, options, onChange} = this.props;
    if (value == null && noEmptyValue && options && options.length > 0) { // eslint-disable-line eqeqeq, max-len
      onChange(options[0].id);
    }
  }
}
