/**
 * @jsx React.DOM
 */
'use strict';

function capitalized({value}) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : '';
}

function currency({value}) {
  return value ? '$' + value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '';
}

module.exports = {capitalized, currency};
