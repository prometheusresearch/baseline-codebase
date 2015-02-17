/**
 * @jsx React.DOM
 */
'use strict';

var React         = require('react/addons');
var cx            = React.addons.classSet;
var PropTypes     = React.PropTypes;

var RstPage = React.createClass({

  propTypes: {
    content: PropTypes.string.isRequired,
    preformatted: PropTypes.bool
  },

  getDefaultProps() {
    return {
      preformatted: false
    };
  },

  getInitialState() {
    return {};
  },

  render() {
    var {className, preformatted, content, ...props} = this.props;
    if (preformatted) {
      return (
        <div className={cx("rf-RstPage", className)}
             dangerouslySetInnerHTML={{__html: content}}>
        </div>
      );
    }
    return (
      <div className={cx("rf-RstPage", className)}>
        {content}
      </div>
    );
  },

});

module.exports = RstPage;
