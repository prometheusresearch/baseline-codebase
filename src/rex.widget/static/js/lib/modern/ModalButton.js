/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React   = require('react/addons');
var Modal   = require('./Modal');
var Button  = require('./Button');
var Layout  = require('./Layout');
var Cell    = require('./Cell');


var ModalButton = React.createClass({
  mixins: [Cell.Mixin],

  render() {
    return (
      <Layout.VBox>
        <Button
          quiet={this.props.buttonQuiet}
          icon={this.props.buttonIcon}
          size={this.props.buttonSize}
          align={this.props.buttonAlign}
          onClick={this.state.open.toggle}>
          {this.props.buttonText}
        </Button>
        <Modal
          forceHeight={this.props.modalForceHeight}
          width={this.props.modalWidth}
          height={this.props.modalHeight}
          minWidth={this.props.modalMinWidth}
          minHeight={this.props.modalMinHeight}
          maxWidth={this.props.modalMaxWidth}
          maxHeight={this.props.modalMaxHeight}
          title={this.props.modalTitle}
          open={this.state.open.value}
          onClose={this.state.open.toggle}>
          {this.props.children}
        </Modal>
      </Layout.VBox>
    );
  },

  close() {
    if (this.state.open.value) {
      this.state.open.update(false);
    }
  },

  open() {
    if (!this.state.open.value) {
      this.state.open.update(true);
    }
  },

  toggle() {
    if (!this.state.open.value) {
      this.state.open.update(true);
    } else {
      this.state.open.update(false);
    }
  },

  getDefaultProps() {
    return {
      buttonSize: 'small',
      buttonAlign: 'left'
    };
  },

  getInitialState() {
    return {
      open: Cell.cell(false)
    };
  }
});

module.exports = ModalButton;
