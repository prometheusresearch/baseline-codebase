/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React                       = require('react/addons');
var RexWidget                   = require('rex-widget/lib/modern');
var {VBox, HBox}                = RexWidget.Layout;

var HomeStyle = {
  self: {
    flex: 1,
  },
  title: {
    flex: 1
  },
  header: {
    padding: 10
  },
  content: {
    flex: 1,
    padding: 10
  }
};

var Home = React.createClass({

  render() {
    return (
      <VBox style={HomeStyle.self}>
        <HBox style={HomeStyle.header}>
          <VBox style={HomeStyle.title}>
            <h4>
              {this.props.title}
            </h4>
          </VBox>
        </HBox>
        <VBox style={HomeStyle.content}>
          <div dangerouslySetInnerHTML={{__html: this.props.text}} />
        </VBox>
      </VBox>
    );
  },

  getDefaultProps() {
    return {
      width: 480,
      title: 'Home',
      icon: 'home'
    };
  }
});

module.exports = Home;
