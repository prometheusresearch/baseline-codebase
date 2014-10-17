/** @jsx React.DOM */
'use strict';


var React = require('react');
var Button = require('./Button');
var ButtonGroup = require('./ButtonGroup');
var cx = React.addons.classSet;

var DropdownButton = React.createClass({

  getDefaultProps: function () {
    return {
      title: null,
      align: 'left'
    };
  },

  checkClickArea: function () {
    this.hide();
  },

  componentDidUpdate: function () {
    if (this.state.menuShown) {
      window.addEventListener('click', this.checkClickArea);
    } else {
      window.removeEventListener('click', this.checkClickArea);
    }
  },

  getInitialState: function () {
    return {
      menuShown: false
    };
  },

  show: function () {
    this.setState({menuShown: true}, function () {
      // this.updateMenuPosition();
    });
  },

  hide: function () {
    this.setState({menuShown: false});
  },

  toggle: function () {
    if (this.state.menuShown) {
      this.hide();
    } else {
      this.show();
    }
  },

  handleClick: function (event) {
    event.stopPropagation();
    this.toggle();
  },

  render: function () {
    var groupClasses = {
      'open': this.state.menuShown
    };
    var menuClasses = {
      'dropdown-menu': true,
      'pull-left': this.props.align === 'left',
      'pull-right': this.props.align === 'right'
    };
    return (
      <ButtonGroup className={cx(groupClasses)}>
        <Button className="dropdown-toggle"
                onClick={this.handleClick}>
          {this.props.title}
          <span className="caret"></span>
        </Button>
        <ul className={cx(menuClasses)} role="menu">
          {this.props.children}
        </ul>
      </ButtonGroup>
    );
  }
});

module.exports = DropdownButton;
