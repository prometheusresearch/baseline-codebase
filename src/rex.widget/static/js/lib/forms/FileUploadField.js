/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React               = require('react');
var cx                  = require('classnames');
var {Box, HBox}         = require('../Layout');
var Button              = require('../Button');
var {File, StoredFile}  = require('../File');
var resolveURL          = require('../resolveURL');
var Field               = require('./Field');

function uploadFile(url, file, onProgress) {
  url = resolveURL(url);
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
    try {
      xhr.send(data);
    } catch(err) {
      reject(err);
    }
  });
}

function unquote(str) {
  return str.replace(/^'/, '').replace(/'$/, '');
}

function filename(file) {
  var result = unquote(file.name);
  return result.replace(/.*\/([^\/]+)$/i, '$1');
}

var FileUploadInput = React.createClass({

  styleInput: {
    display: 'none'
  },

  stylePlaceholder: {
    fontSize: '90%',
    color: '#AAAAAA'
  },

  styleError: {
    fontSize: '90%',
    color: 'rgb(234, 69, 69)'
  },

  render() {
    var {value, required, download, ownerRecordID, ...props} = this.props;
    var {file, progress, error} = this.state;
    // the case when we need to render a file stored in storage
    var renderStoredFile = !file && value;
    if (renderStoredFile) {
      file = {name: value};
    }
    return (
      <HBox {...props} onChange={undefined} storage={undefined}>
        <Box>
          <Button type="button" disabled={progress} icon="hdd" onClick={this.onClick}>
            Choose file
          </Button>
        </Box>
        {error ?
          <Box centerVertically margin="0 0 0 10px" size={1}>
            <Box style={this.styleError}>{error.message}</Box>
          </Box> :
          renderStoredFile ?
          <StoredFile
            file={file}
            download={download}
            ownerRecordID={ownerRecordID}
            /> :
          file ?
          <File
            size={1}
            margin="0 0 0 10px"
            required={required}
            progress={progress}
            file={file}
            onRemove={this.onRemove}
            /> :
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
    this.setState({
      file,
      error: null
    });
    uploadFile(this.props.storage, file, this._onUploadProgress)
      .then(response => JSON.parse(response.target.responseText))
      .then(this._onUploadComplete, this._onUploadError);
  },

  onClick(e) {
    e.stopPropagation();
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
    this.props.onChange(response.file);
  },

  _onUploadError(error) {
    this.setState({progress: null, error});
  }
});

var FileUploadField = React.createClass({

  render() {
    var {className, storage, download, required, value, ...props} = this.props;
    var input = (
      <FileUploadInput
        ownerRecordID={this._getOwnerRecordID()}
        storage={storage}
        download={download}
        required={required}
        />
    );
    return (
      <Field {...props} className={cx('rw-FileUploadField', className)}>
        {input}
      </Field>
    );
  },

  _getOwnerRecordID() {
    var record = this.props.formValue.parent.value;
    return record ? record.id : undefined;
  }
});

module.exports = FileUploadField;
