/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

/**
 * Object which represents dataset along with data lifecycle oriented metadata.
 */
class DataSet {

  constructor(data, loading, error) {
    this.data = data || null;
    this.loading = loading || false;
    this.error = error || null;
  }

  get loaded() {
    return !this.loading && this.data != null;
  }

  findByID(id) {
    if (id == null || this.data == null) {
      return null;
    }
    for (var i = 0, len = this.data.length; i < len; i++) {
      var item = this.data[i];
      if (item.id == id) {
        return item;
      }
    }
    return null;
  }

}

// Constant value for empty dataset
DataSet.EMPTY_DATASET = new DataSet(null, false, null);

// Constant value for empty dataset which is loading
DataSet.EMPTY_UPDATING_DATASET = new DataSet(null, true, null);

module.exports = DataSet;
