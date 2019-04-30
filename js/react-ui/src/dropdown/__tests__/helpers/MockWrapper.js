var React = require('react');
var ReactCreateClass = require('create-react-class');
var PropTypes = require('prop-types');

module.exports = ReactCreateClass({
  displayName: 'MockWrapper',

  proptypes: {
    mockManager: PropTypes.object.isRequired,
  },

  childContextTypes: {
    ambManager: PropTypes.object.isRequired,
  },

  getChildContext: function() {
    this.manager = this.props.mockManager;
    return {
      ambManager: this.props.mockManager,
    };
  },

  render: function() {
    return React.DOM.div(null, this.props.children);
  },
});
