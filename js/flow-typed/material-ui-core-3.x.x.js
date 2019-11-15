declare module "@material-ui/styles" {
  import type { AbstractComponent, Node } from "react";

  declare type color = string;
  declare export opaque type Theme: {|
    accent: {
      success: Accent,
    },
    spacing: {
      unit: number,
    },
    definitonList: {
      verticalSpacing: number,
      horizontalSpacing: number,
    },
    breakpoints: {
      up: (string) => string,
      between: (string, string) => string,
      values: {
        xs: number,
        sm: number,
        md: number,
        lg: number,
        xl: number,
      },
    },
    palette: {
      type: string,
      common: { black: color, white: color },
      error: Palette,
      success: Palette,
      primary: Palette,
      secondary: Palette,
      action: {
        hoverOpacity: number,
      },
      text: {
        primary: color,
        secondary: color,
        disabled: color,
        hint: color,
      },
    },
  |};

  declare type Palette = {
    light: color,
    main: color,
    dark: color,
    contrastText: color,
  };

  declare type Accent = {
    color: color,
    colorDisabled: color,
    colorHover: color,
    colorBackground: color,
  };

  declare export function makeStyles<Styles: {}>(
    styles: (Theme) => Styles,
  ): () => $ObjMap<Styles, <V>(V) => string>;

  declare export function useTheme(): Theme;

  declare export var ThemeProvider: AbstractComponent<{|
    children: Node,
    theme: Theme,
  |}>;
}

declare module "@material-ui/core" {
  import type { Theme } from "@material-ui/styles";
  import type { AbstractComponent, Node, ElementType } from "react";

  declare export type TypographyProps = {|
    children: ?Node,
    className?: string,
    id?: string,
    classes?: Object,
    align?: "inherit" | "left" | "center" | "right" | "justify",
    color?:
      | "initial"
      | "inherit"
      | "primary"
      | "secondary"
      | "textPrimary"
      | "textSecondary"
      | "error",
    component?: ElementType,
    display?: "initial" | "block" | "inline",
    gutterBottom?: boolean,
    noWrap?: boolean,
    paragraph?: boolean,
    variant?:
      | "h1"
      | "h2"
      | "h3"
      | "h4"
      | "h5"
      | "h6"
      | "subtitle1"
      | "subtitle2"
      | "body1"
      | "body2"
      | "caption"
      | "button"
      | "overline"
      | "srOnly"
      | "inherit",
    title?: string,
    style?: Object,
  |};

  declare export var Typography: AbstractComponent<TypographyProps>;

  declare export type DOMProps = {|
    onClick?: UIEvent => void,
    onFocus?: UIEvent => void,
    onBlur?: UIEvent => void,
    title?: string,
    style?: Object,
    className?: string,
    "aria-label"?: string,
    tabIndex?: number,
  |};

  declare export type ButtonBaseProps = {|
    ...DOMProps,
    "aria-label"?: string,
    "aria-controls"?: string,
    "aria-haspopup"?: string,
    download?: string,
    href?: string,
    action?: Function,
    buttonRef?: Function,
    centerRipple?: boolean,
    children?: Node,
    classes?: Object,
    component?: ElementType,
    disabled?: boolean,
    disableRipple?: boolean,
    disableTouchRipple?: boolean,
    focusRipple?: boolean,
    focusVisibleClassName?: string,
    onFocusVisible?: Function,
    TouchRippleProps?: Object,
    type?: "submit" | "reset" | "button",
  |};

  declare export var ButtonBase: AbstractComponent<ButtonBaseProps>;

  declare export type ButtonProps = {|
    ...ButtonBaseProps,
    color?: "default" | "inherit" | "primary" | "secondary",
    fullWidth?: boolean,
    size?: "small" | "medium" | "large",
    variant?: "text" | "outlined" | "contained",
  |};

  declare export var Button: AbstractComponent<ButtonProps>;

  declare export type IconButtonProps = {|
    ...ButtonBaseProps,
    color?: "default" | "inherit" | "primary" | "secondary",
    edge?: "start" | "end" | false,
    size?: "small" | "medium",
  |};

  declare export var IconButton: AbstractComponent<IconButtonProps>;

  declare export type InputProps = {|
    value?: string,
    onChange?: UIEvent => void,
    autoComplete?: string,
    autoFocus?: boolean,
    classes?: Object,
    className?: string,
    defaultValue?: string,
    disabled?: boolean,
    disableUnderline?: boolean,
    endAdornment?: Node,
    error?: boolean,
    fullWidth?: boolean,
    id?: string,
    inputComponent?: ElementType,
    inputProps?: Object,
    inputRef?: any,
    margin?: "dense" | "none",
    multiline?: boolean,
    name?: string,
    placeholder?: string,
    readOnly?: boolean,
    required?: boolean,
    rows?: string | number,
    rowsMax?: string | number,
    startAdornment?: Node,
    type?: string,
  |};
  declare export var Input: AbstractComponent<InputProps>;

  declare export type PopperProps = {|
    ...DOMProps,
    anchorEl: any,
    children: Node | (any => Node),
    open: boolean,
    container?: any,
    disablePortal?: boolean,
    keepMounted?: boolean,
    modifiers?: Object,
    placement?:
      | "bottom-end"
      | "bottom-start"
      | "bottom"
      | "left-end"
      | "left-start"
      | "left"
      | "right-end"
      | "right-start"
      | "right"
      | "top-end"
      | "top-start"
      | "top",
    popperOptions?: Object,
    transition?: boolean,
  |};
  declare export var Popper: AbstractComponent<PopperProps>;

  declare export type PopoverProps = {|
    anchorEl: any,
    open: boolean,
    children: Node,
    action?: Function,
    anchorOrigin?: {
      horizontal: number | "left" | "center" | "right",
      vertical: number | "top" | "center" | "bottom",
    },
    anchorPosition?: { left: number, top: number },
    anchorReference?: "anchorEl" | "anchorPosition" | "none",
    classes?: Object,
    container?: any,
    elevation?: number,
    getContentAnchorEl?: Function,
    marginThreshold?: number,
    ModalClasses?: Object,
    onClose?: Function,
    onEnter?: Function,
    onEntered?: Function,
    onEntering?: Function,
    onExit?: Function,
    onExited?: Function,
    onExiting?: Function,
    PaperProps?: Object,
    transformOrigin?: {
      horizontal: number | "left" | "center" | "right",
      vertical: number | "top" | "center" | "bottom",
    },
    TransitionComponent?: ElementType,
    transitionDuration?: number | { enter?: number, exit?: number } | "auto",
    TransitionProps?: Object,
  |};
  declare export var Popover: AbstractComponent<PopoverProps>;

  declare export function withTheme<P: {}>(): (
    AbstractComponent<P>,
  ) => AbstractComponent<P>;

  declare export var createMuiTheme: any => Theme;
  declare export var makeStyles: any;
  declare export var MuiThemeProvider: any;
  declare export var styled: any;
  declare export var withStyles: any;
  declare export var withTheme: any;
  declare export var AppBar: any;
  declare export var Avatar: any;
  declare export var Backdrop: any;
  declare export var Badge: any;
  declare export var BottomNavigation: any;
  declare export var BottomNavigationAction: any;
  declare export var Breadcrumbs: any;
  declare export var Card: any;
  declare export var CardActionArea: any;
  declare export var CardActions: any;
  declare export var CardContent: any;
  declare export var CardHeader: any;
  declare export var CardMedia: any;
  declare export var Checkbox: any;
  declare export var Chip: any;
  declare export var CircularProgress: any;
  declare export var ClickAwayListener: any;
  declare export var Collapse: any;
  declare export var Container: any;
  declare export var CssBaseline: any;
  declare export var Dialog: any;
  declare export var DialogActions: any;
  declare export var DialogContent: any;
  declare export var DialogContentText: any;
  declare export var DialogTitle: any;
  declare export var Divider: any;
  declare export var Drawer: any;
  declare export var ExpansionPanel: any;
  declare export var ExpansionPanelActions: any;
  declare export var ExpansionPanelDetails: any;
  declare export var ExpansionPanelSummary: any;
  declare export var Fab: any;
  declare export var Fade: any;
  declare export var FilledInput: any;
  declare export var FormControl: any;
  declare export var FormControlLabel: any;
  declare export var FormGroup: any;
  declare export var FormHelperText: any;
  declare export var FormLabel: any;
  declare export var Grid: any;
  declare export var GridList: any;
  declare export var GridListTile: any;
  declare export var GridListTileBar: any;
  declare export var Grow: any;
  declare export var Hidden: any;
  declare export var Icon: any;
  declare export var InputAdornment: any;
  declare export var InputBase: any;
  declare export var InputLabel: any;
  declare export var LinearProgress: any;
  declare export var Link: any;
  declare export var List: any;
  declare export var ListItem: any;
  declare export var ListItemAvatar: any;
  declare export var ListItemIcon: any;
  declare export var ListItemSecondaryAction: any;
  declare export var ListItemText: any;
  declare export var ListSubheader: any;
  declare export var Menu: any;
  declare export var MenuItem: any;
  declare export var MenuList: any;
  declare export var MobileStepper: any;
  declare export var Modal: any;
  declare export var ModalManager: any;
  declare export var NativeSelect: any;
  declare export var NoSsr: any;
  declare export var OutlinedInput: any;
  declare export var Paper: any;
  declare export var Portal: any;
  declare export var Radio: any;
  declare export var RadioGroup: any;
  declare export var RootRef: any;
  declare export var Select: any;
  declare export var Slide: any;
  declare export var Snackbar: any;
  declare export var SnackbarContent: any;
  declare export var Step: any;
  declare export var StepButton: any;
  declare export var StepConnector: any;
  declare export var StepContent: any;
  declare export var StepIcon: any;
  declare export var StepLabel: any;
  declare export var Stepper: any;
  declare export var SvgIcon: any;
  declare export var SwipeableDrawer: any;
  declare export var Switch: any;
  declare export var Tab: any;
  declare export var Table: any;
  declare export var TableBody: any;
  declare export var TableCell: any;
  declare export var TableFooter: any;
  declare export var TableHead: any;
  declare export var TablePagination: any;
  declare export var TableRow: any;
  declare export var TableSortLabel: any;
  declare export var Tabs: any;
  declare export var TextField: any;
  declare export var Toolbar: any;
  declare export var Tooltip: any;
  declare export var withMobileDialog: any;
  declare export var withWidth: any;
  declare export var Zoom: any;
  declare export var colors: any;
}
