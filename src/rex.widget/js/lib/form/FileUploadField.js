/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';
import ReactDOM from 'react-dom';
import {VBox, HBox} from '../../layout';
import {Button, Icon} from '../../ui';
import File from './File';
import StoredFile from './StoredFile';
import FileDownload from './FileDownload';
import Field from './Field';
import ReadOnlyField from './ReadOnlyField';
import {withFormValue} from 'react-forms';
import uploadFile from '../upload';
import './animation.css';

export let FileUploadInput = React.createClass({

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

  styleNote: {
    color: '#8e8ee2',
    fontSize: '90%',
    fontWight: '400',
    marginRight: '10px'
  },

  styleIconAnimation: {
    display: 'inline-block',
    marginLeft: '5px',
    animation: 'spin .7s infinite linear',
    webkitAnimation: 'spin2 0.9s infinite linear'
  },

  getDefaultProps() {
    return {uploadFile};
  },

  render() {
    let {value, required, download, ownerRecordID, ...props} = this.props;
    let {file, progress, error} = this.state;
    // the case when we need to render a file stored in storage
    let renderStoredFile = !file && value;
    if (renderStoredFile) {
      file = {name: value};
    }
    return (
      <HBox {...props} onChange={undefined} storage={undefined}>
        <VBox>
          {progress ? 
            <span style={this.styleNote}>
              Loading
              <Icon name="refresh" style={this.styleIconAnimation} />
            </span> : 
            <Button disabled={progress} icon="hdd" onClick={this.onClick}>
              Choose file
            </Button>
          }
        </VBox>
        {error ?
          <VBox justifyContent="center" margin="0 0 0 10px" flex={1}>
            <VBox style={this.styleError}>{error.message}</VBox>
          </VBox> :
          renderStoredFile ?
          <StoredFile
            justifyContent="center"
            file={file}
            download={download}
            ownerRecordID={ownerRecordID}
            /> :
          file ?
          <File
            size={1}
            margin="0 0 0 10px"
            justifyContent="center"
            required={required}
            progress={progress}
            file={file}
            onRemove={this.onRemove}
            /> :
          <VBox justifyContent="center" margin="0 0 0 10px" flex={1}>
            <VBox style={this.stylePlaceholder}>No file choosen</VBox>
          </VBox>}
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
    let files = e.target.files;
    let file = files[0];
    this.setState({
      file,
      error: null
    });
    this.props.uploadFile(this.props.storage, file, this._onUploadProgress)
      .then(response => JSON.parse(response.target.responseText))
      .then(this._onUploadComplete, this._onUploadError);
  },

  onClick(e) {
    e.stopPropagation();
    ReactDOM.findDOMNode(this.refs.underlying).click();
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

/**
 * Form field which handle uploading files.
 *
 * @public
 */
export class FileUploadField extends React.Component {

  static propTypes = {
    /**
     * CSS class name used to render the field.
     */
    className: React.PropTypes.string,

    /**
     * The URL to upload the file to.
     *
     * See rex.file docs for details.
     */
    storage: React.PropTypes.string,

    /**
     * The URL which is used to download files from storage.
     *
     * See rex.file docs for details.
     */
    download: React.PropTypes.string,

    /**
     * Form value.
     */
    formValue: React.PropTypes.object
  }

  render() {
    let {
      className, storage, column, readOnly,
      formValue, select, selectFormValue, ...props
    } = this.props;
    if (!readOnly) {
      let required = formValue.schema && formValue.schema.required;
      let input = (
        <FileUploadInput
          ownerRecordID={this._getOwnerRecordID()}
          storage={storage}
          download={column}
          required={required}
          />
      );
      return (
        <Field {...props} formValue={formValue}>
          {input}
        </Field>
      );
    } else {
      return (
        <ReadOnlyField {...props} formValue={formValue}>
          <FileDownload
            file={formValue.value}
            ownerRecordID={this._getOwnerRecordID()}
            download={column}
            />
        </ReadOnlyField>
      );
    }
  }

  _getOwnerRecordID() {
    let record = this.props.formValue.parent.value;
    return record ? record.id : undefined;
  }
}

export default withFormValue(FileUploadField);
