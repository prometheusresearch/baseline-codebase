/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React   = require('react');
var Modal   = require('./Modal');
var Button  = require('./Button');
var Layout  = require('./Layout');
var Cell    = require('./Cell');

/**
 * Renders a <VBox> with a <Button> and a <Modal>.
 * When the button is clicked, the modal is activated.
 *
 * @public
 */
var ModalButton = React.createClass({
  mixins: [Cell.Mixin],

  propTypes: {
    /**
     * When true include class rw-Button--quiet. 
     */
    buttonQuiet: React.PropTypes.bool,

    /**
     * When true include class rw-Button--success. 
     */
    buttonSuccess: React.PropTypes.bool,

    /**
     * When true include class rw-Button--danger. 
     */
    buttonDanger: React.PropTypes.bool,

    /**
     * The name of the icon to use.
     */
    buttonIcon: React.PropTypes.string,

    /**
     * One of "small", "extra-small".
     */
    buttonSize: React.PropTypes.string,

    /**
     * The textAlign attribute for the style attribute. 
     */
    buttonAlign: React.PropTypes.string,

    /**
     * The text to appear on the button. 
     */
    buttonText: React.PropTypes.string,
    

    /**
     * When true the height for the modal's children is set to '100%'.
     * otherwise it is set to undefined. 
     */
    modalForceHeight: React.PropTypes.bool,
    
    /**
     * The css style width of the modal.  
     */
    modalWidth: React.PropTypes.string,
    
    /**
     * The css style minimum width of the modal. 
     */
    modalMinWidth: React.PropTypes.string,
    
    /**
     * string css style maximum width of the modal. 
     *
     * The css style maximum width of the modal.
     */
    modalMaxWidth: React.PropTypes.string,
    
    /**
     * The css style height of the modal. 
     */
    modalHeight: React.PropTypes.string,
    
    /**
     * The css style minimum height of the modal.
     */
    modalMinHeight: React.PropTypes.string,
    
    /**
     * The css style maximum height of the modal.
     */
    modalMaxHeight: React.PropTypes.string,
    
    /**
     * The title of the modal.
     */
    modalTitle: React.PropTypes.string,
    
    /**
     * The children to appear inside the modal. 
     */
    children: React.PropTypes.element
  },
  
  render() {
    return (
      <Layout.VBox>
        <Button
          quiet={this.props.buttonQuiet}
          success={this.props.buttonSuccess}
          danger={this.props.buttonDanger}
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
