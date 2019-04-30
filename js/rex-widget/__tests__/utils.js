/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';
import assert from 'power-assert';

import {
  findWithType as _findWithType,
  findAllWithType as _findAllWithType,
  getMountedInstance,
  findAll,
} from 'react-shallow-testutils';

import {createRenderer as _createRenderer} from 'react-addons-test-utils';

import _inspectElement, {
  inspectReactProp as _inspectReactProp,
} from 'inspect-react-element';

import {isEqual} from 'lodash/lang';
import indent from 'indent-string';

import Sinon from 'sinon';

export {stub, spy, mock} from 'sinon';
export assert from 'power-assert';

class FormDataMock {
  append = Sinon.spy();
}

let originalFormData = global.FormData;

export function mockFormData() {
  global.FormData = FormDataMock;
}

export function unmockFormData() {
  global.FormData = originalFormData;
}

function inspectReactProps(node) {
  return '__originalConfig' in node.props
    ? {...node.props.__originalConfig, children: node.props.children}
    : node.props || {};
}

function inspectReactProp(propName, propValue) {
  if (propName === '__originalConfig' || propName === 'key' || propName === 'ref') {
    return null;
  }
  return _inspectReactProp(propName, propValue);
}

export function inspectElement(node) {
  return _inspectElement(node, {inspectReactProps, inspectReactProp});
}

class ReactShallowRenderer {
  constructor() {
    this._renderer = _createRenderer();
  }

  render(element) {
    return this._renderer.render(element);
  }

  get instance() {
    return getMountedInstance(this._renderer);
  }

  get element() {
    return this._renderer.getRenderOutput();
  }

  findWithType(type) {
    return findWithType(this.element, type);
  }

  findAllWithType(type) {
    return findAllWithType(this.element, type);
  }

  assertElementWithType(type) {
    this.findWithType(type);
  }

  assertNoElementWithType(type) {
    assert(this.findAllWithType(type).length === 0);
  }

  findWithTypeProps(type, props) {
    return findWithTypeProps(this.element, type, props);
  }

  findAllWithTypeProps(type, props) {
    return findAllWithTypeProps(this.element, type, props);
  }

  assertElementWithTypeProps(type, props) {
    this.findWithTypeProps(type, props);
  }

  assertNoElementWithTypeProps(type, props) {
    assert(this.findAllWithTypeProps(type, props).length === 0);
  }

  findWithElement(element) {
    return findWithElement(this.element, element);
  }

  findAllWithElement(element) {
    return findAllWithElement(this.element, element);
  }

  assertElement(element) {
    this.findWithElement(element);
  }

  assertNoElement(element) {
    assert(this.findAllWithElement(element).length === 0);
  }
}

export function createRenderer() {
  return new ReactShallowRenderer();
}

export function findWithType(root, type) {
  let elements = findAll(root, _makeMatchWithType(type));
  if (elements.length !== 1) {
    let displayName = type.displayName || type.name || type;
    throw new Error(
      `Did not find exactly one partial match for element:
${indent(inspectElement(React.createElement(type)), ' ', 7)}
${indent('In the rendered element tree:', ' ', 5)}
${indent(inspectElement(root), ' ', 7)}
    `,
    );
  }
  return elements[0];
}

export function findAllWithType(root, type) {
  return findAll(root, _makeMatchWithType(type));
}

function _makeMatchWithType(type) {
  return function _matchWithType(element) {
    return element &&
      element.type &&
      (element.type === type || element.type.Component === type);
  };
}

export function findWithTypeProps(root, type, props) {
  let elements = findAll(root, _makeMatchWithElement(type, props));
  if (elements.length !== 1) {
    let displayName = type.displayName || type.name || type;
    throw new Error(
      `Did not find exactly one (${elements.length}) partial match for element:
${indent(inspectElement(React.createElement(type, props)), ' ', 7)}
${indent('In the rendered element tree:', ' ', 5)}
${indent(inspectElement(root), ' ', 7)}
    `,
    );
  }
  return elements[0];
}

export function findAllWithTypeProps(root, type, props) {
  return findAll(root, _makeMatchWithElement(type, props));
}

export function findWithElement(root, spec) {
  spec = _normalizeReactElementSpec(spec);
  let {type, props} = spec;
  let elements = findAll(root, _makeMatchWithElement(spec.type, spec.props));
  if (elements.length !== 1) {
    let displayName = type.displayName || type.name || type;
    throw new Error(
      `Did not find exactly one (${elements.length}) partial match for element:
${indent(inspectElement(spec), ' ', 7)}
${indent('In the rendered element tree:', ' ', 5)}
${indent(inspectElement(root), ' ', 7)}
    `,
    );
  }
  return elements[0];
}

export function findAllWithElement(root, spec) {
  spec = _normalizeReactElementSpec(spec);
  return findAll(root, _makeMatchWithElement(spec.type, spec.props));
}

function _makeMatchWithElement(type, props) {
  let matchWithType = _makeMatchWithType(type);

  let matchWithProps = function(element) {
    for (let key in props) {
      if (!props.hasOwnProperty(key)) {
        continue;
      }
      if (!element.props.hasOwnProperty(key)) {
        continue;
      }
      if (key === '__originalConfig') {
        continue;
      }
      if (!isEqual(element.props[key], props[key])) {
        return false;
      }
    }
    return true;
  };
  return function _matchWithElement(element) {
    return element && matchWithType(element) && matchWithProps(element);
  };
}

function _normalizeReactElementSpec(spec) {
  let {type, props: {__originalConfig = null}} = spec;
  if (__originalConfig) {
    return {...spec, props: __originalConfig};
  } else {
    return spec;
  }
}

let _createElement = React.createElement;

function createElement(type, config, ...children) {
  config = {...config, __originalConfig: config || {}};
  let element = _createElement(type, config, ...children);
  return element;
}

React.createElement = createElement;
