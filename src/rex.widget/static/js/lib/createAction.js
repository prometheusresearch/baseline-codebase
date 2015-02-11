/**
 * @copyright 2015 Prometheus Research, LLC
 */
'use strict';

/**
 * Factory for Rex Widget actions.
 *
 * This function exposes Rex Widget actions to JS code which can be useful while
 * creating custom widgets:
 *
 * var ResetSelectionButton = React.createClass({
 *
 *   render() {
 *     var onClick = Rex.Widget.createAction(
 *       'set',
 *       {id: 'table/selected', value: null}
 *     )
 *     return <button onClick={onClick}>Reset selection</button>
 *   }
 * })
 *
 * This function is simple but it shims Rex Widget action implementation
 * mechanism so that we are free to alter it as we need in the future.
 *
 * @param {String} actionName
 * @param {Object} parameters
 */
function createAction(actionName, parameters) {
  var actionCreator = __require__(actionName);
  return actionCreator(parameters);
}

module.exports = createAction;
