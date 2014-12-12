/**
 * @jsx React.DOM
 * @copyright 2014 Prometheus Research, LLC
 */
'use strict';

function makeURL(...segments) {
  return `/formbuilder/${segments.join('/')}`;
}

module.exports = makeURL;
