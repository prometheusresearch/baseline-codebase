/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var Promise           = require('bluebird');
var React             = require('react/addons');
var cx                = React.addons.classSet;
var merge             = require('../merge');
var {Box, HBox}       = require('../layout');
var Button            = require('../Button');
var Icon              = require('../Icon');
var Hoverable         = require('../Hoverable');
var FieldBase         = require('./FieldBase');
var FormContextMixin  = require('./FormContextMixin');

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
    marginRight: 5,
    marginLeft: 5,
    top: -2
  },

  render() {
    var {file, icon, required, children, onRemove, progress, ...props} = this.props;
    var {hover} = this.state;
    return (
      <Box {...props}>
        <HBox
          {...this.hoverable}
          size={1}
          style={this.style}
          onClick={!required && !progress && onRemove}>
          <Box centerVertically style={this.styleIcon}>
            {icon ?
              <Icon name={icon} /> :
              progress ?
              <Icon name="repeat" /> :
              required || !hover ?
              <Icon name="ok" /> :
              <Icon name="remove" />}
          </Box>
          <Box centerVertically>
            {progress || required || !hover ?
              children || file.name :
              'Remove file'}
          </Box>
        </HBox>
        <Progress progress={progress} />
      </Box>
    );
  }
});

var StoredFile = React.createClass({

  render() {
    var {download, file, ownerRecordID, ...props} = this.props;
    return (
      <File icon="download" required {...props} file={file}>
        <a href={`${download}?${ownerRecordID}`}>
          {filename(file)}
        </a>
      </File>
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
          <Button disabled={progress} icon="hdd" onClick={this.onClick}>
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
    this.props.onChange(response.file);
  },

  _onUploadError(error) {
    this.setState({progress: null, error});
  }
});

var FileUploadField = React.createClass({
  contextTypes: FormContextMixin.contextTypes,

  render() {
    var {className, storage, download, required, ...props} = this.props;
    var input = (
      <FileUploadInput
        ownerRecordID={this._getOwnerRecordID()}
        storage={storage}
        download={download}
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
  },

  _getOwnerRecordID() {
    var valueKey = this.context && this.context.valueKey ?
      this.context.valueKey.concat(this.props.valueKey) :
      [];
    valueKey.pop();
    var record = this.props.value.value.getIn(valueKey);
    return record ? record.get('id') : undefined;
  }
});

module.exports = FileUploadField;
