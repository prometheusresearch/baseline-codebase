/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React                       = require('react/addons');
var RexWidget                   = require('rex-widget');
var {VBox, HBox}                = RexWidget.Layout;

var PageStyle = {
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

var Page = React.createClass({

  render() {
    var {width, title, text, onClose} = this.props;
    return (
      <VBox style={{...PageStyle.self, width}}>
        {title &&
          <HBox style={PageStyle.header}>
            <VBox style={PageStyle.title}>
              <h4>
                {title}
              </h4>
            </VBox>
            {onClose &&
              <RexWidget.Button
                quiet
                icon="remove"
                onClick={onClose}
                />}
          </HBox>}
        <VBox style={PageStyle.content}>
          <div dangerouslySetInnerHTML={{__html: text}} />
        </VBox>
      </VBox>
    );
  },

  getDefaultProps() {
    return {
      width: 480,
      title: 'Page',
      icon: 'file'
    };
  }
});

module.exports = Page;
