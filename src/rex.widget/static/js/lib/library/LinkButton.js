/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React           = require('react');
var Button          = require('../Button');
var populateParams  = require('./populateParams');

/**
 * Renders a <Button>
 *
 * The ``params`` are populated from the ``context``.
 * and the `text` is passed as a child and is the text of the link.
 *
 * @public
 * @deprecated
 */
var LinkButton = React.createClass({

  propTypes: {
    /**
     * href attribute contains the url to link to.
     */
    href: React.PropTypes.string.isRequired,

    /**
     * This object is populated from the context
     * and represents the query string which 
     * will be appended to the href url.
     *
     * See static/js/lib/library/populateParams.js
     */
    params: React.PropTypes.object,

    /**
     * This object represents the context.  @ask-andrey.
     */
    context: React.PropTypes.object,

    /**
     * The text of the link.
     */
    text: React.PropTypes.string
  },

  render() {
    var {href, params, context, text, ...props} = this.props;
    params = populateParams(params || {}, context);
    return (
      <Button
        {...this.props}
        href={href}
        params={params}>
        {text}
      </Button>
    );
  },

  getDefaultProps() {
    return {
      quiet: true,
      align: 'left'
    };
  }
});

module.exports = LinkButton;
