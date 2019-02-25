module.exports = {
  test(val) {
    return val && val.hasOwnProperty('entity') && val.hasOwnProperty('aggregate');
  },
  print(val, serialize, indent) {
    return '<DOMAIN>';
  },
};
