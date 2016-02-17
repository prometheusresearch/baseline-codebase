/**
 * @copyright 2015, Prometheus Research, LLC
 */


import applyContext from '../applyContext';

function makeCrossID(context, input) {
  let [first, second] = Object.keys(input.rows);
  return `${context[first].id}.${context[second].id}`;
}

export default function fetchCrossEntity({data, context, contextTypes}) {
  let id = makeCrossID(context, contextTypes.input);
  data = data.params({'*': id}).getSingleEntity();
  data = applyContext(data, contextTypes.input, context);
  return {entity: data};
}

