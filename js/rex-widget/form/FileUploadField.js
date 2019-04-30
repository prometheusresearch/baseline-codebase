/**
 * @copyright 2016, Prometheus Research, LLC
 * @flow
 */

import invariant from "invariant";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { VBox, HBox } from "react-stylesheet";
import { Icon } from "../ui";
import * as rexui from "rex-ui";
import * as mui from "@material-ui/core";
import * as icons from "@material-ui/icons";
import File, { type FileValue } from "./File";
import StoredFile from "./StoredFile";
import FileDownload from "./FileDownload";
import Field from "./Field";
import { ViewValue } from "./ViewValue";
import { useFormValue, type value, type select } from "react-forms";
import uploadFileDefault from "../upload";

let styles = {
  styleInput: {
    display: "none"
  },

  stylePlaceholder: {
    fontSize: "90%",
    color: "#AAAAAA"
  },

  styleError: {
    fontSize: "90%",
    color: "rgb(234, 69, 69)"
  },

  styleNote: {
    color: "#8e8ee2",
    fontSize: "90%",
    fontWight: "400",
    marginRight: "10px"
  },

  styleIconAnimation: {
    display: "inline-block",
    marginLeft: "5px",
    animation: "spin .7s infinite linear",
    webkitAnimation: "spin2 0.9s infinite linear"
  }
};

type InputProps = {
  value: string,
  onChange: (?string) => void,
  required?: boolean,
  download: string,
  storage: string,
  ownerRecordID: string,
  error: boolean,
  uploadFile?: (
    url: string,
    file: FileValue,
    onProgress?: (number) => void
  ) => Promise<{ file: string }>
};

export let Input = (props: InputProps) => {
  let {
    value,
    onChange,
    required,
    download,
    ownerRecordID,
    storage,
    error,
    uploadFile = uploadFileDefault
  } = props;

  let inputRef = React.useRef(null);

  let [{ file, progress, error: errorOfUpload }, setState] = React.useState({
    file: null,
    progress: null,
    error: null
  });

  let handleOnChange = e => {
    let files = e.target.files;
    let file = files[0];
    setState(state => ({ ...state, file: null, error: null }));
    uploadFile(storage, file, _onUploadProgress).then(
      _onUploadComplete,
      _onUploadError
    );
  };

  let onClick = e => {
    e.stopPropagation();
    if (inputRef.current != null) {
      inputRef.current.click();
    }
  };

  let onRemove = () => {
    setState({
      file: null,
      progress: null,
      error: null
    });
    onChange(undefined);
  };

  let _onUploadProgress = progress => {
    setState(state => ({ ...state, progress }));
  };

  let _onUploadComplete = response => {
    setState(state => ({ ...state, progress: null }));
    onChange(response.file);
  };

  let _onUploadError = error => {
    setState(state => ({ ...state, progress: null, error }));
  };

  return (
    <HBox alignItems="center">
      <VBox>
        {progress != null ? (
          <mui.CircularProgress value={progress} />
        ) : (
          <rexui.Button
            size="small"
            disabled={progress != null}
            icon={<icons.CloudUpload />}
            onClick={onClick}
          >
            Choose file
          </rexui.Button>
        )}
      </VBox>
      <VBox margin={10}>
        {errorOfUpload ? (
          <VBox style={styles.styleError}>{errorOfUpload.message}</VBox>
        ) : file == null && value != null ? (
          <StoredFile
            file={{ name: value }}
            download={download}
            ownerRecordID={ownerRecordID}
            onRemove={onRemove}
          />
        ) : file != null ? (
          <File file={file} onRemove={onRemove} />
        ) : (
          <VBox style={styles.stylePlaceholder}>No file choosen</VBox>
        )}
      </VBox>
      <input
        ref={inputRef}
        style={styles.styleInput}
        type="file"
        onChange={handleOnChange}
      />
    </HBox>
  );
};

type Props = {
  /**
   * The URL to upload the file to.
   *
   * See rex.file docs for details.
   */
  storage: string,

  download: string,

  /**
   * The URL which is used to download files from storage.
   *
   * See rex.file docs for details.
   */
  download: string,

  /**
   * Form value.
   */
  formValue?: value,
  select?: select,

  label?: string,
  hint?: string,

  readOnly?: boolean
};

/**
 * Form field which handle uploading files.
 *
 * @public
 */
export function FileUploadField(props: Props) {
  let {
    storage,
    download,
    readOnly,
    formValue: formValueOfProps,
    select,
    label,
    hint
  } = props;

  let theme = rexui.useTheme();
  let formValue = useFormValue(formValueOfProps, select);
  let record = formValue.parent.value;
  let ownerRecordID: string = ((record: any).id: any);

  if (!readOnly) {
    let required = formValue.schema && formValue.schema.isRequired;
    let renderLabel = labelProps => {
      if (labelProps.label == null) {
        return null;
      }
      return (
        <mui.FormLabel
          filled={true}
          required={labelProps.required}
          error={labelProps.error}
          style={{ paddingBottom: theme.spacing.unit }}
        >
          {labelProps.label}
        </mui.FormLabel>
      );
    };
    let renderInput = props => (
      <Input
        {...props}
        ownerRecordID={ownerRecordID}
        storage={storage}
        download={download}
        required={required}
      />
    );
    return (
      <Field
        label={label}
        hint={hint}
        formValue={formValue}
        renderInput={renderInput}
        renderLabel={renderLabel}
      />
    );
  } else {
    let renderValue = value => {
      return (
        <FileDownload
          file={{ name: ((value: any): string) }}
          ownerRecordID={ownerRecordID}
          download={download}
        />
      );
    };
    return (
      <ViewValue
        label={label}
        hint={hint}
        formValue={formValue}
        renderValue={renderValue}
      />
    );
  }
}

export default FileUploadField;
