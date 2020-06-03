/**
 * @copyright 2016, Prometheus Research, LLC
 * @flow
 */

import * as React from "react";
import * as mui from "@material-ui/core";
import * as icons from "@material-ui/icons";

import * as rexui from "rex-ui";
import { makeStyles } from "rex-ui/Theme";

import uploadFileDefault from "./upload";

let useStyles = makeStyles(theme => ({
  root: {
    display: "flex",
    flexDirection: "row",
  },

  buttonContainer: {
    height: "32px",
    display: "flex",
    marginRight: "10px",
  },

  styleInput: {
    display: "none",
  },

  fileContainer: {
    display: "flex",
    alignItems: "center",
  },

  stylePlaceholder: {
    fontSize: "90%",
    color: "#AAAAAA",
    fontFamily: ["Roboto", "Helvetica", "Arial", "sans-serif"],
  },

  styleError: {
    fontSize: "90%",
    color: "rgb(234, 69, 69)",
  },
  styleNote: {
    color: "#8e8ee2",
    fontSize: "90%",
    fontWight: "400",
    marginRight: "10px",
  },
  styleIconAnimation: {
    display: "inline-block",
    marginLeft: 5,
    animation: "spin .7s infinite linear",
    webkitAnimation: "spin2 0.9s infinite linear",
  },
}));

type FileUploadProps = {
  buttonText?: string,
  noFileChoosenText?: string,
  value: ?string,
  onChange: (?string) => void,
  required?: boolean,
  error?: boolean,
  download?: string,
  ownerRecordID?: ?string,
  storage: string,
  uploadFile?: (
    url: string,
    file: FileValue,
    onProgress?: (number) => void,
  ) => Promise<{ file: string }>,
  disabled?: boolean,
};

export let FileUpload = (props: FileUploadProps) => {
  let {
    buttonText,
    noFileChoosenText,
    value,
    onChange,
    download,
    ownerRecordID,
    storage,
    uploadFile = uploadFileDefault,
    disabled,
  } = props;

  let styles = useStyles();

  let inputRef = React.useRef(null);

  let [{ file, progress, error: errorOfUpload }, setState] = React.useState({
    file: null,
    progress: null,
    error: null,
  });

  let handleOnChange = e => {
    let files = e.target.files;
    let file = files[0];
    setState(state => ({ ...state, file: null, error: null }));
    uploadFile(storage, file, _onUploadProgress).then(
      _onUploadComplete,
      _onUploadError,
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
      error: null,
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
    <div className={styles.root}>
      {!disabled && (
        <div className={styles.buttonContainer}>
          {progress != null ? (
            <mui.CircularProgress value={progress} size="20px" />
          ) : (
            <rexui.Button
              size="small"
              disabled={disabled || progress != null}
              icon={<icons.CloudUpload />}
              onClick={onClick}
            >
              {buttonText ?? "Choose file"}
            </rexui.Button>
          )}
        </div>
      )}
      <div className={styles.fileContainer}>
        {errorOfUpload ? (
          <div className={styles.styleError}>{errorOfUpload.message}</div>
        ) : file == null && value != null ? (
          <StoredFile
            disabled={disabled}
            fileHandler={value}
            download={download}
            ownerRecordID={ownerRecordID}
            onRemove={onRemove}
          />
        ) : file != null ? (
          <File file={file} onRemove={onRemove} />
        ) : (
          <div className={styles.stylePlaceholder}>
            {noFileChoosenText ?? "No file choosen"}
          </div>
        )}
      </div>
      <input
        className={styles.styleInput}
        ref={inputRef}
        type="file"
        onChange={handleOnChange}
      />
    </div>
  );
};

export type FileValue = {
  name: string,
  href?: string,
};

type Props = {|
  file: FileValue,

  onRemove?: () => void,

  onClick?: () => void,

  disabled?: boolean,
|};

/**
 * Renders a file uploaded to a storage.
 */
function File(props: Props) {
  let { file, onClick, onRemove, disabled } = props;
  let handleRemove = onRemove
    ? (e: UIEvent) => {
        e.stopPropagation();
        e.preventDefault();
        if (onRemove) {
          onRemove();
        }
      }
    : null;
  let component = file.href ? "a" : "div";
  let style = file.href ? { cursor: "pointer" } : null;
  return (
    <mui.Chip
      component={component}
      href={file.href}
      icon={<icons.CloudDone />}
      label={file.name}
      onClick={onClick}
      onDelete={disabled ? undefined : handleRemove}
      style={style}
    />
  );
}

type StoredFileProps = {
  /**
   * The file object to download.
   * The 'name' attribute contains the filename.
   */
  fileHandler: ?string,

  /**
   * The application's url for file downloads.
   */
  download?: string,

  /**
   * The ownerRecordID of the file to download.
   */
  ownerRecordID?: ?string,

  onRemove?: () => void,

  disabled?: boolean,
};

/**
 * Renders a <File> widget with an anchor <a> whose ``href``
 * downloads the file.
 */
export function StoredFile(props: StoredFileProps) {
  let { download, fileHandler, ownerRecordID, onRemove, disabled } = props;
  if (fileHandler == null) {
    return (
      <mui.Typography color="inherit" component="span">
        No file uploaded
      </mui.Typography>
    );
  }
  let storedFile: FileValue = { name: filename(fileHandler) };
  if (download && ownerRecordID) {
    storedFile.href = `${download}?${ownerRecordID}`;
  }
  return <File disabled={disabled} file={storedFile} onRemove={onRemove} />;
}

const CLEAN_FILENAME_RE = /.*\/([^/]+)$/i;
const UNQUOTE_BEGIN_RE = /^'/;
const UNQUOTE_END_RE = /'$/;

function filename(fileName: string) {
  let result = unquote(fileName);
  return result.replace(CLEAN_FILENAME_RE, "$1");
}

function unquote(str) {
  return str.replace(UNQUOTE_BEGIN_RE, "").replace(UNQUOTE_END_RE, "");
}
