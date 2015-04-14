/**
 * @jsx React.DOM
 */
'use strict';

var React             = require('react');
var invariant         = require('./invariant');
var merge             = require('./merge');
var mergeInto         = require('./mergeInto');
var Reference         = require('./Reference');
var Entity            = require('./Entity');
var runtime           = require('./runtime');
var StateWriter       = require('./StateWriter');
var DataSpecification = require('./modern/DataSpecification');
var Query             = require('./modern/Query');

var Application = React.createClass({

  propTypes: {
    listenTo: React.PropTypes.array,
    ui: React.PropTypes.object.isRequired
  },

  render() {
    return constructComponent(this.props.ui);
  },

  getDefaultProps() {
    return {listenTo: []};
  },

  componentDidMount() {
    this._setupStateListeners(this.props.listenTo);
  },

  componentWillUmount() {
    this._removeStateListeners(this.props.listenTo);
  },

  _removeStateListeners(listenTo) {
    for (var i = 0, len = listenTo.length; i < len; i++) {
      runtime.ApplicationState.off(listenTo[i], this.update);
    }
  },

  _setupStateListeners(listenTo) {
    for (var i = 0, len = listenTo.length; i < len; i++) {
      runtime.ApplicationState.on(listenTo[i], this.update);
    }
  },

  /**
   * Force update of the application UI.
   *
   * The method forceUpdate() isn't automatically bound to a component instance but
   * user-defined methods are. This is why we need to use `this.update` instead
   * of `this.forceUpdate` when registering callbacks.
   */
  update() {
    this.forceUpdate();
  }
});

/**
 * Constructor React Component Descriptor from Rex Widget
 *
 * @private
 *
 * @param {Widget} ui
 * @param {Number|String} key
 * @returns {ReactDescriptor}
 */
function constructComponent(ui, key) {
  if (ui === null) {
    return;
  }

  if (ui.__children__ !== undefined) {
    return flatMapChildren(ui.__children__, function(child, key) {
      return constructComponent(child, key);
    });
  }

  if (ui.__type__ === undefined) {
    throw new Error('ui should have "__type__" attribute');
  }

  if (ui.props === undefined) {
    throw new Error('ui should have "props" attribute');
  }

  var props = {};

  if (key !== undefined) {
    props.key = key;
  }

  for (var name in ui.props) {
    var prop = ui.props[name];
    // Action call
    if (prop !== null && prop.__action__) {
      mkAction(props, name, prop.__action__, prop.params);
    // Action call seq
    } else if (prop !== null && prop.__actions__) {
      mkActionSeq(props, name, prop.__actions__);
    // Widget
    } else if (prop !== null && prop.__type__) {
      mkComponent(props, name, prop, prop.defer);
    // An array of widgets
    } else if (prop !== null && prop.__children__) {
      mkComponentChildren(props, name, prop.__children__, prop.defer);
    // js value reference
    } else if (prop !== null && prop.__reference__) {
      mkReference(props, name, prop.__reference__);
    // Read from state
    } else if (prop !== null && prop.__state_read__) {
      mkStateRead(props, name, prop.__state_read__);
    // Write to state
    } else if (prop !== null && prop.__state_read_write__) {
      mkStateReadWrite(props, name, prop.__state_read_write__);
    // Read from data
    } else if (prop !== null && prop.__data__) {
      mkDataRead(props, name, prop.__data__, prop.wrapper, false);
    } else if (prop !== null && prop.__dataspec__) {
      mkDataSpec(props, name, prop.__dataspec__);
    // Regular prop
    } else {
      mkProp(props, name, prop);
    }
  }

  var Component = __require__(ui.__type__);
  return React.createElement(Component, props);
}

function constructDataSpec(dataSpec) {
  var [type, route, params, kind] = dataSpec;
  var port;
  if (kind === 'port') {
    port = runtime.Storage.createPort(route);
  } else if (kind === 'query') {
    port = new Query(route);
  }
  if (type === 'collection') {
    return new DataSpecification.Collection(port, params);
  } else if (type === 'entity') {
    return new DataSpecification.Entity(port, params);
  } else {
    invariant(
      false,
      'invalid type for data specification: %s', type
    );
  }
}

function mkDataSpec(props, name, dataSpec) {
  props[name] = constructDataSpec(dataSpec);
}

function mkComponent(props, name, desc, defer) {
  if (defer) {
    props[name] = function() {
      return constructComponent(desc);
    };
  } else {
    props[name] = constructComponent(desc);
  }
}

function mkComponentChildren(props, name, descs, defer) {
  if (defer) {
    props[name] = function() {
      return _mkComponentChildren(descs);
    };
  } else {
    props[name] = _mkComponentChildren(descs);
  }
}

function _mkComponentChildren(descs) {
  return flatMapChildren(descs, function(child, key) {
    return constructComponent(child, key);
  });
}

function mkAction(props, name, ref, params) {
  props[name] = __require__(ref)(params);
}

function mkProp(props, name, prop) {
  props[name] = prop;
}

function mkReference(props, name, ref) {
  props[name] = __require__(prop.__reference__);
}

function mkStateRead(props, name, ref) {
  var value = runtime.ApplicationState.get(ref);
  var valueMeta = runtime.ApplicationState.getValue(ref);
  if (value !== null && value.__data__) {
    mkDataRead(props, name, value.__data__, value.wrapper, valueMeta.updating);
  } else {
    props[name] = value;
  }
}

function mkStateReadWrite(props, name, ref) {
  mkStateRead(props, name, ref);
  mkStateWrite(props, name, ref);
}

function mkStateWrite(props, name, ref) {
  var writerName = 'on' + name[0].toUpperCase() + name.slice(1)
  var stateWriter = StateWriter.createStateWriter(ref);
  props[writerName] = stateWriter;
}

function mkDataRead(props, name, ref, wrapper, updating) {
  ref = runtime.Storage.createRef(ref);
  var data = runtime.Storage.resolve(ref);
  if (wrapper) {
    wrapper = __require__(wrapper);
    data = new wrapper(ref, data, updating);
  } else {
    data = new Entity(ref, data, updating);
  }
  props[name] = data;
}

function mkActionSeq(props, name, actions) {
  actions = actions.map(function(action) {
    return __require__(action.__action__)(action.params);
  });
  props[name] = function() {
    for (var i = 0, len = actions.length; i < len; i++) {
      actions[i]();
    }
  }
}

function flatMapChildren(collection, mapper, _key) {
  _key = _key || '/';
  var result = [];
  for (var i = 0, len = collection.length; i < len; i++) {
    var key = _key + i + '/';
    var item = collection[i];
    if (item && item.__children__) {
      result = result.concat(flatMapChildren(item.__children__, mapper, key));
    } else {
      result.push(mapper(item, key));
    }
  }
  return result;
}

module.exports = Application;
module.exports.constructComponent = constructComponent;
module.exports.constructDataSpec = constructDataSpec;
