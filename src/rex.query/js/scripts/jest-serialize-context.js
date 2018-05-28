const PREV_CONTEXT_REPR = '<PREV CONTEXT>';

module.exports = {
  test(val) {
    return (
      val &&
      val.hasOwnProperty('prev') &&
      val.prev !== PREV_CONTEXT_REPR &&
      val.hasOwnProperty('scope') &&
      val.hasOwnProperty('type') &&
      val.hasOwnProperty('domain')
    );
  },
  print(val, serialize, indent) {
    let scopeNames = Object.keys(val.scope).join(', ');
    val = Object.assign({}, val, {
      prev: PREV_CONTEXT_REPR,
      scope: `<SCOPE ${scopeNames.length > 0 ? scopeNames : '[empty]'}>`,
    });
    return serialize(val);
  },
};
