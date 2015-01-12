/**
 * Sitemap for Rex Widget applications.
 *
 * @jsx React.DOM
 */
'use strict';

var invariant = require('./invariant');
var merge     = require('./merge');
var makeURL   = require('./makeURL');
var runtime   = require('./runtime');

var Sitemap = {

  SITEMAP: 'SITEMAP',

  /**
   * Get entire sitemap structure.
   */
  getSitemap() {
    var sitemap = runtime.ApplicationState.getValues()[this.SITEMAP];
    if (sitemap === undefined) {
      return null;
    }
    return sitemap;
  },

  /**
   * Get location configuration by `url`.
   */
  getLocation(url) {
    var sitemap = this.getSitemap();
    if (sitemap === null) {
      return null;
    }
    var params = sitemap.value.locations[url];
    if (sitemap === undefined) {
      return null;
    }
    return {url, params};
  },

  /**
   * Get page configuration by `id`.
   */
  getPage(id) {
    var sitemap = this.getSitemap();
    if (sitemap === null) {
      return null;
    }
    var page = sitemap.value.pages[id];
    if (page === undefined) {
      return null;
    }
    var params = sitemap.value.locations[page.location];
    invariant(params !== undefined, 'inconsistent sitemap');
    return merge(page, {id, location: {url: page.location, params}});
  },

  /**
   * Generate link to page by `id`.
   */
  linkTo(id, params, options) {
    var page = this.getPage(id);
    invariant(
      page !== null,
      'Cannot find page "%s", probably URL mapping misconfiguration', id
    );
    return this.link(page.location.url, params, options);
  },

  /**
   * Generate link to location by `url`.
   */
  link(url, params, options) {
    var location = this.getLocation(url);

    invariant(
      location !== null,
      'URL "%s" is invalid for the current configuration', url
    );

    if (params && location.params !== null) {
      for (var name in params) {
        if (params.hasOwnProperty(name)) {
          invariant(
            location.params[name],
            'invalid param "%s" for url "%s"', name, url
          );
        }
      }
    }

    return makeURL(url, params, options);
  },

  /**
   * Unsafe version of `link(url, params)` which doesn't do any validations
   * against configuration.
   */
  linkUnsafe: makeURL
};

module.exports = Sitemap;
