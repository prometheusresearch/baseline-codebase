/**
 * @flow
 */

import * as React from "react";
import classNames from "classnames";

import { makeStyles } from "../Theme.js";

import * as mui from "@material-ui/core";
import * as Field from "./Field.js";
import * as Action from "./Action.js";
import { useAutofocus } from "./useAutofocus.js";

export type ShowFieldConfigProps<O> = {|
  actions?: Array<Action.ActionConfig<void, O>>,
  fields?: Field.FieldSpec[],
  titleField?: ?Field.FieldSpec,
  subtitleField?: ?Field.FieldSpec,
|};

export type ShowRendererProps<O> = {|
  flat?: boolean,
  square?: boolean,
  onClick?: () => void,
  noHoverOpacity?: boolean,
  data: O,
  toolbar?: React.Node,
  title?: React.Node,
  subtitle?: React.Node,
  content?: React.Node,
  toolbar?: React.Node,
  ...ShowFieldConfigProps<O>,
|};

export function ShowRenderer<O>({
  onClick,
  data,
  actions,
  toolbar,
  title,
  titleField,
  subtitle,
  subtitleField,
  content,
  fields = [],
  flat,
  square,
  noHoverOpacity,
}: ShowRendererProps<O>) {
  let classes = useStyles();

  if (title == null && titleField != null) {
    title = String(Field.extract(titleField, data));
  }

  if (subtitle == null && subtitleField != null) {
    subtitle = String(Field.extract(subtitleField, data));
  }

  if (toolbar == null && actions != null) {
    let buttons = actions.map(action => (
      <div key={action.name}>{Action.render(action, data, undefined)}</div>
    ));
    toolbar = buttons;
  }

  if (content == null && fields.length > 0) {
    content = fields.map(field =>
      field.editable(data) ? (
        <EditableField key={field.name} field={field} data={data} />
      ) : (
        <ShowField key={field.name} field={field} data={data} />
      ),
    );
  }

  return (
    <mui.Grid container>
      <mui.Grid item xs={12}>
        <mui.Paper
          square={square}
          elevation={flat ? 0 : 2}
          className={classes.root}
        >
          <mui.Card
            square={square}
            raised={false}
            onClick={onClick}
            className={classNames({
              [classes.cardClickable]: onClick != null,
              [classes.hoverOpacity]: onClick != null && !noHoverOpacity,
            })}
          >
            <mui.CardContent>
              {title != null && (
                <div className={classes.header}>
                  <mui.Typography variant="h5">{title}</mui.Typography>
                  {subtitle != null && (
                    <mui.Typography color="textSecondary">
                      {subtitle}
                    </mui.Typography>
                  )}
                </div>
              )}
              {content}
            </mui.CardContent>
            {toolbar != null ? (
              <mui.CardActions>{toolbar}</mui.CardActions>
            ) : null}
          </mui.Card>
        </mui.Paper>
      </mui.Grid>
    </mui.Grid>
  );
}

export function EditField({
  field,
  value,
  data,
  onChange,
  onCommitEdit,
  onCancelEdit,
}: {|
  field: Field.FieldSpec,
  value: mixed,
  data: mixed,
  onChange: (value: mixed) => void,
  onCommitEdit: () => void,
  onCancelEdit: () => void,
|}) {
  let classes = useStyles();
  let onTextChange = value => {
    onChange(value);
  };
  let onOkClick = async () => {
    if (field.edit != null) {
      await field.edit(data, value);
    }
    onCommitEdit();
  };
  let onCancelClick = () => {
    onCancelEdit();
  };
  let ref = React.createRef();
  useAutofocus(ref);

  let onKeyDown = ev => {
    switch (ev.key) {
      case "Enter":
        onOkClick();
        break;
      case "Escape":
        onCancelClick();
        break;
      default:
        break;
    }
  };
  return (
    <div className={classNames(classes.contentWrapper, classes.editRoot)}>
      <div className={classes.fieldContainer}>
        {Field.renderEdit(field, data, value, onTextChange, ref, onKeyDown)}
      </div>
      <div className={classNames(classes.toolbar, classes.editToolbar)}>
        <mui.Button onClick={onOkClick} size="small">
          Ok
        </mui.Button>
        <mui.Button
          onClick={onCancelClick}
          size="small"
          className={classes.toolbarButton}
        >
          Cancel
        </mui.Button>
      </div>
    </div>
  );
}

export function ShowField({
  field,
  data,
  value: inputValue,
}: {|
  field: Field.FieldSpec,
  data: mixed,
  value?: mixed,
|}) {
  let classes = useStyles();
  let value = inputValue ?? Field.extract(field, data);
  let element = Field.render(field, data, value);
  return (
    <div className={classes.contentWrapper}>
      {field.title != null && (
        <mui.Typography variant={"caption"}>{field.title}</mui.Typography>
      )}
      {element}
    </div>
  );
}

export function EditableField({
  field,
  data,
}: {|
  field: Field.FieldSpec,
  data: mixed,
|}) {
  let classes = useStyles();
  let [value, setValue] = React.useState(Field.extract(field, data));
  let [hover, hoverProps] = useHoverState();
  let [isEditing, setIsEditing] = React.useState(false);

  let onEditClick = () => {
    setIsEditing(true);
  };
  let onCommitEdit = () => {
    setIsEditing(false);
  };
  let onCancelEdit = () => {
    setValue(Field.extract(field, data));
    setIsEditing(false);
  };

  return isEditing ? (
    <EditField
      field={field}
      data={data}
      value={value}
      onChange={setValue}
      onCommitEdit={onCommitEdit}
      onCancelEdit={onCancelEdit}
    />
  ) : (
    <div className={classNames(classes.showRoot)} {...hoverProps}>
      <div className={classes.fieldContainer}>
        <ShowField data={data} field={field} value={value} />
      </div>
      <div className={classes.toolbar}>
        <mui.Button
          onClick={onEditClick}
          size="small"
          style={{ visibility: hover ? "visible" : "hidden" }}
        >
          Edit
        </mui.Button>
      </div>
    </div>
  );
}

export function useHoverState() {
  let [hover, setHover] = React.useState(false);
  let props = React.useMemo(() => {
    let onMouseEnter = () => {
      setHover(true);
    };
    let onMouseLeave = () => {
      setHover(false);
    };
    return { onMouseEnter, onMouseLeave };
  }, []);
  return [hover, props];
}

let useStyles = makeStyles(theme => ({
  root: {
    width: "100%",
    overflowX: "auto",
  },
  cardClickable: {
    cursor: "pointer",
  },
  hoverOpacity: {
    "&:hover": {
      opacity: 0.9,
    },
  },
  header: {
    padding: theme.spacing(),
    marginBottom: theme.spacing(),
  },
  titleSmall: {
    fontSize: 16,
  },
  showRoot: {
    maxWidth: 640,
    display: "flex",
    flexDirection: "row",
    "&:hover": {
      backgroundColor: theme.palette.action.hover,
    },
  },
  editRoot: {
    display: "flex",
    flexDirection: "column",
    "&:hover": {
      backgroundColor: theme.palette.action.hover,
    },
  },
  contentWrapper: {
    maxWidth: 640,
    wordBreak: "break-word",
    padding: theme.spacing(),
  },
  fieldContainer: {
    flex: 1,
  },
  toolbar: {
    padding: theme.spacing(),
  },
  editToolbar: {
    alignSelf: "flex-end",
  },
  toolbarButton: {
    marginLeft: theme.spacing(),
    wordBread: "keep-all",
  },
}));
