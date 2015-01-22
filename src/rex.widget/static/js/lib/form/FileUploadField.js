/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var Promise     = require('bluebird');
var React       = require('react/addons');
var cx          = React.addons.classSet;
var merge       = require('../merge');
var {Box, HBox} = require('../layout');
var Button      = require('../Button');
var Icon        = require('../Icon');
var Hoverable   = require('../Hoverable');
var FieldBase   = require('./FieldBase');

function uploadFile(url, file, onProgress) {
  return new Promise(function(resolve, reject) {
    var data = new FormData();
    data.append('file', file);
    var xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);
    xhr.onload = resolve;
    xhr.onerror = reject;
    if (onProgress) {
      xhr.upload.onprogress = function(e) {
        if (e.lengthComputable) {
          var progress = e.loaded / e.total;
          onProgress(progress);
        }
      };
    }
    xhr.send(data);
  });
}

var Progress = React.createClass({

  style: {
    height: 2,
    background: 'rgb(142, 142, 226)'
  },

  render() {
    var {progress, style, ...props} = this.props;
    progress = progress || 0;
    var style = merge(this.style, style, {
      width: `${progress * 100}%`
    });
    return <Box {...props} style={style} />;
  }
});

var File = React.createClass({
  mixins: [Hoverable],

  style: {
    fontSize: '90%',
    cursor: 'pointer',
    top: 2
  },

  styleIcon: {
    marginRight: 10,
    top: -3
  },

  render() {
    var {file, required, onRemove, progress, ...props} = this.props;
    var {hover} = this.state;
    return (
      <Box {...props}>
        <HBox
          {...this.hoverable}
          size={1}
          style={this.style}
          onClick={!required && !progress && onRemove}>
          <Box centerVertically style={this.styleIcon}>
            {progress ?
              <Icon name="repeat" /> :
              required || !hover ?
              <Icon name="ok" /> :
              <Icon name="remove" />}
          </Box>
          <Box centerVertically>
            {progress || required || !hover ?
              file.name :
              'Remove file'}
          </Box>
        </HBox>
        <Progress progress={progress} />
      </Box>
    );
  }
});

var FileUploadInput = React.createClass({

  styleInput: {
    display: 'none'
  },

  stylePlaceholder: {
    fontSize: '90%',
    color: '#AAAAAA'
  },

  render() {
    var {value, required, ...props} = this.props;
    var {file, progress, error} = this.state;
    return (
      <HBox {...props} storage={undefined} onChange={undefined}>
        <Box>
          <Button disabled={progress} icon="hdd" onClick={this.onClick}>
            Choose file
          </Button>
        </Box>
        {file &&
          <File
            size={1}
            margin="0 0 0 10px"
            required={required}
            progress={progress}
            file={file}
            onRemove={this.onRemove}
            />}
        {!file &&
          <Box centerVertically margin="0 0 0 10px" size={1}>
            <Box style={this.stylePlaceholder}>No file choosen</Box>
          </Box>}
        <input
          ref="underlying"
          style={this.styleInput}
          type="file"
          onChange={this.onChange}
          />
      </HBox>
    );
  },

  getInitialState() {
    return {
      file: null,
      progress: null,
      error: null
    };
  },

  onChange(e) {
    var files = e.target.files;
    var file = files[0];
    this.setState({file});
    uploadFile(this.props.storage, file, this._onUploadProgress)
      .then(response => JSON.parse(response.target.responseText))
      .then(this._onUploadComplete, this._onUploadError);
  },

  onClick() {
    this.refs.underlying.getDOMNode().click()
  },

  onRemove() {
    this.setState(this.getInitialState());
    this.props.onChange(undefined);
  },

  _onUploadProgress(progress) {
    this.setState({progress});
  },

  _onUploadComplete(response) {
    this.setState({progress: null});
    this.props.onChange(response.id);
  },

  _onUploadError(error) {
    this.setState({progress: null, error});
  }
});

var FileUploadField = React.createClass({

  render() {
    var {className, storage, required, ...props} = this.props;
    var input = (
      <FileUploadInput
        storage={storage}
        required={required}
        />
    );
    return (
      <FieldBase
        {...props}
        className={cx('rw-FileUploadField', className)}
        input={input}
        />
    );
  }
});

module.exports = FileUploadField;
