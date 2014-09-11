/**
 * @jsx React.DOM
 */
'use strict';

var superagent = require('superagent/superagent');
var Promise    = require('bluebird');
var makeURL    = require('./makeURL');
var isString   = require('./isString');

function is2XXStatusCode(statusCode) {
  return /^2[0-9][0-9]$/.exec(String(statusCode));
}

class Request extends superagent.Request {

  query(key, value) {
    value = value === null ? '' : value;
    if (value !== undefined && isString(key)) {
      var query = {};
      query[key] = value;
      return superagent.Request.prototype.query.call(this, query);
    }
    return superagent.Request.prototype.query.call(this, key);
  }

  promise() {
    return new Promise((resolve, reject) =>
      this.end((err, response) => {
        if (err) {
          reject(err);
        } else if (!is2XXStatusCode(response.status)) {
          reject(new Error('invalid response status code'));
        } else {
          resolve(response);
        }
      }));
  }

  end(...args) {
    if (args.length === 0) {
      return this.promise();
    } else {
      return superagent.Request.prototype.end.apply(this, args);
    }
  }

}

function request(method, url) {
  return new Request(method, makeURL(url));
}

module.exports = request;
