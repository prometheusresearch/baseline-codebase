/**
 * @jsx React.DOM
 */
'use strict';

var React            = require('react/addons');
var PropTypes        = React.PropTypes;
var Icon             = require('./Icon');
var ApplicationState = require('./ApplicationState');
var Button           = require('./Button');
var merge            = require('./merge');
var $                = require('jquery');

var FileAttachments = React.createClass({
    
  render () {
    var self = this;
    return (
      <div className='rw-FileAttachments'>
        <Button id='addAttachment' onClick={this.onClick} icon='paperclip'>
          Add Attachment
        </Button>
        <input id='rw-attach-file' type="file" onChange={this.onChange} className='rw-FileAttachments__input' />
        <div>
          {this.props.attachments.map((attachment, index) => {
            var key = 'rw-attachment-' + index;
            return (
              <div key={key} className="rw-FileAttachments__file"> 
                <span>{attachment.name}</span>
                <input type='hidden' value={attachment.path} name='path'  className='rw-FileAttachments__path' />
                <Button id={key} onClick={this.onRemove} link={true} icon='remove' />
              </div>
            )
          })}
        </div>  
      </div>
    )
  },


  onClick(event) {
    $('#rw-attach-file').click();
  },

  onChange(event) {
    var file = event.target.files[0];
    var maxSize = this.props.maxSize || 50000000; //50MB
    if (file.size > maxSize) {
      alert('the ' + file.name + ' is too large');
      event.target.value = null;
      event.target.files = null;
      return
    }
    this.props.onChoose(file, event.target.value);
    event.target.value = null;
    event.target.files = null;
  },

  onRemove (id) {
    var attachment = $('#' + id).parent('div').children('input[type=hidden]').val();
    this.props.removeAttachment(attachment);
  }
});

module.exports = FileAttachments;
