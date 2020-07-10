declare type CSS = {
  escape(value: string): string,
  supports(property: string, value?: string): boolean,
};

declare type Color = {
  "50": string,
  "100": string,
  "200": string,
  "300": string,
  "400": string,
  "500": string,
  "600": string,
  "700": string,
  "800": string,
  "900": string,
  A100: string,
  A200: string,
  A400: string,
  A700: string,
};

declare module "@material-ui/types" {
  import type { AbstractComponent } from "react";

  declare export type PropInjector<InjectedProps, AdditionalProps = {}> = <
    C = AbstractComponent<InjectedProps>,
  >(
    component: C,
  ) => AbstractComponent<AdditionalProps>;
}

declare module "@material-ui/styles" {
  import typeof _makeStyles from "@material-ui/styles/makeStyles";
  import typeof _createStyles from "@material-ui/styles/createStyles";
  import typeof _getThemeProps from "@material-ui/styles/getThemeProps";
  import typeof _jssPreset from "@material-ui/styles/jssPreset";
  import typeof _mergeClasses from "@material-ui/styles/mergeClasses";
  import typeof _ServerStyleSheets from "@material-ui/styles/ServerStyleSheets";
  import typeof _styled from "@material-ui/styles/styled";
  import typeof _StylesProvider from "@material-ui/styles/StylesProvider";
  import typeof _ThemeProvider from "@material-ui/styles/ThemeProvider";
  import typeof _useTheme from "@material-ui/styles/useTheme";
  import typeof _withStyles from "@material-ui/styles/withStyles";
  import typeof _withTheme from "@material-ui/styles/withTheme";
  import typeof _DefaultTheme from "@material-ui/styles/DefaultTheme";

  import type {
    Theme as _Theme,
    ThemeOptions as _ThemeOptions,
  } from "@material-ui/core/styles";
  declare export type Theme = _Theme;
  declare export type ThemeOptions = _ThemeOptions;

  declare export type color = string;

  declare export var createStyles: _createStyles;
  declare export var getThemeProps: _getThemeProps;
  declare export var jssPreset: _jssPreset;
  declare export var makeStyles: _makeStyles;
  declare export var mergeClasses: _mergeClasses;
  declare export var ServerStyleSheets: _ServerStyleSheets;
  declare export var styled: _styled;
  declare export var StylesProvider: _StylesProvider;
  declare export var ThemeProvider: _ThemeProvider;
  declare export var useTheme: _useTheme;
  declare export var withStyles: _withStyles;
  declare export var withTheme: _withTheme;
  declare export var DefaultTheme: _DefaultTheme;
}

declare module "@material-ui/styles/createGenerateClassName" {
  declare type GenerateId = any;

  declare export type GenerateClassNameOptions = {
    disableGlobal?: boolean,
    productionPrefix?: string,
    seed?: string,
  };

  declare export default function createGenerateClassName(
    options?: GenerateClassNameOptions,
  ): GenerateId;
}

declare module "@material-ui/styles/createStyles" {
  import type { StyleRules } from "@material-ui/styles/withStyles";

  declare export default function createStyles<ClassKey = string, Props = {}>(
    styles: StyleRules,
  ): StyleRules;
}

declare module "@material-ui/styles/getThemeProps" {
  declare export default function getThemeProps(): any;
}

declare module "@material-ui/styles/jssPreset" {
  import type { JssOptions } from "jss";

  declare export default function jssPreset(): JssOptions;
}

declare module "@material-ui/styles/makeStyles" {
  import type { Theme } from "@material-ui/core/styles";

  declare function makeStyles<Styles: {}>(
    styles: (Theme) => Styles,
    Object,
  ): any => $ObjMap<Styles, <V>(V) => string>;

  declare export default typeof makeStyles;
}

declare module "@material-ui/styles/mergeClasses" {
  import type { ElementType } from "react";

  declare export type Classes = {
    [k: string]: string,
  };

  declare export type MergeClassesOption = {
    baseClasses: Classes,
    newClasses: Classes,
    Component: ElementType,
  };

  declare export default function mergeClasses(
    options?: MergeClassesOption,
  ): Classes;
}

declare module "@material-ui/styles/ServerStyleSheets" {
  import type { ElementType, Node } from "react";

  declare class ServerStyleSheets {
    constructor(options?: {}): ServerStyleSheets;
    collect(children: Node, options?: {}): ElementType;
    toString(): string;
    getStyleElement(props?: {}): ElementType;
  }

  declare export default ServerStyleSheets;
}

declare module "@material-ui/styles/styled" {
  import type { ElementType, Node } from "react";

  declare export type StyledComponent<P = {}> = (
    props: P,
  ) => ElementType | null;
}

declare module "@material-ui/styles/StylesProvider" {
}

declare module "@material-ui/styles/ThemeProvider" {
  import type { Node } from "react";
  import type { Theme } from "@material-ui/core/styles";

  declare export var ThemeProvider: AbstractComponent<{|
    children: Node,
    theme: Theme,
  |}>;

  declare export default ThemeProvider;
}

declare module "@material-ui/styles/useTheme" {
  import type { Theme } from "@material-ui/core/styles";

  declare export function useTheme(): Theme;
}

declare module "@material-ui/styles/withStyles" {
  import type { StandardProperties as CSSProperties } from "csstype";

  declare export type ClassNameMap = { [key: string]: string };

  declare export type StyleRules = {
    [key: string]: CSS & CSSProperties,
  };

  declare export default function withStyles(): any;
}

declare module "@material-ui/styles/withTheme" {
}

declare module "@material-ui/styles/DefaultTheme" {
}

declare module "@material-ui/core" {
  import type {
    AbstractComponent,
    Node,
    ElementType,
    ElementRef,
    Ref,
  } from "react";
  import type { StandardProperties as CSSProperties } from "csstype";

  declare export type ClassNameMap = { [key: string]: string };

  /**
   * All standard components exposed by `material-ui` are `StyledComponents` with
   * certain `classes`, on which one can also set a top-level `className` and inline
   * `style`.
   */
  declare export type StyledComponentProps = {
    /**
     * Override or extend the styles applied to the component.
     */
    classes?: $Shape<ClassNameMap>,
    innerRef?: Ref<any>,
  };

  declare export type StandardProps = StyledComponentProps & {
    className?: string,
    ref?: Ref<any> | { current: ElementRef<any> | null },
    style?: CSSProperties,
  };

  declare export type PaletteType = "light" | "dark";

  declare export type PropTypes = {
    Alignment: "inherit" | "left" | "center" | "right" | "justify",
    Color: "inherit" | "primary" | "secondary" | "default",
    Margin: "none" | "dense" | "normal",
  };

  declare export type TypographyColor =
    | "initial"
    | "inherit"
    | "primary"
    | "secondary"
    | "textPrimary"
    | "textSecondary"
    | "error";

  declare export type TypographyProps = {|
    ...DOMProps,
    children: ?Node,
    className?: string,
    id?: string,
    classes?: Object,
    align?: "inherit" | "left" | "center" | "right" | "justify",
    color?: TypographyColor,
    component?: ElementType,
    display?: "initial" | "block" | "inline",
    gutterBottom?: boolean,
    noWrap?: boolean,
    paragraph?: boolean,
    inline?: boolean,
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
    href?: string,
  |};

  declare export var Typography: AbstractComponent<TypographyProps>;

  declare export type DOMProps = {|
    onClick?: UIEvent => any,
    onMouseDown?: MouseEvent => any,
    onMouseUp?: MouseEvent => any,
    onMouseMove?: MouseEvent => any,
    onFocus?: UIEvent => any,
    onBlur?: UIEvent => any,
    title?: string,
    style?: Object,
    className?: string,
    "aria-label"?: string,
    tabIndex?: number,
    href?: string,
    target?: string,
    rel?: string,
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

  declare export type ButtonVariants =
    | "text"
    | "flat"
    | "outlined"
    | "contained"
    | "raised"
    | "fab"
    | "extendedFab";

  declare export type ButtonProps = {|
    ...ButtonBaseProps,
    color?: "default" | "inherit" | "primary" | "secondary",
    fullWidth?: boolean,
    size?: "small" | "medium" | "large",
    variant?: ButtonVariants,
    target?: string,
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
    onBlur?: UIEvent => any,
    onKeyDown?: KeyboardEvent => any,
    onKeyUp?: KeyboardEvent => any,
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

  declare export type GridProps = {|
    ...DOMProps,
    alignContent?:
      | "stretch"
      | "center"
      | "flex-start"
      | "flex-end"
      | "space-between"
      | "space-around"
      | "stretch",
    alignItems?:
      | "flex-start"
      | "center"
      | "flex-end"
      | "stretch"
      | "baseline"
      | "stretch",
    children?: Node,
    classes?: Object,
    component?: string,
    container?: boolean,
    direction?: "row" | "row-reverse" | "column" | "column-reverse" | "row",
    item?: boolean,
    justify?:
      | "center"
      | "flex-end"
      | "space-between"
      | "space-around"
      | "space-evenly"
      | "flex-start",
    lg?:
      | false
      | "auto"
      | true
      | 1
      | 2
      | 3
      | 4
      | 5
      | 6
      | 7
      | 8
      | 9
      | 10
      | 11
      | 12,
    md?:
      | false
      | "auto"
      | true
      | 1
      | 2
      | 3
      | 4
      | 5
      | 6
      | 7
      | 8
      | 9
      | 10
      | 11
      | 12,
    sm?:
      | false
      | "auto"
      | true
      | 1
      | 2
      | 3
      | 4
      | 5
      | 6
      | 7
      | 8
      | 9
      | 10
      | 11
      | 12,
    spacing?: 0 | 8 | 16 | 24 | 32 | 40,
    wrap?: "nowrap" | "wrap" | "wrap-reverse",
    xl?:
      | "auto"
      | true
      | 1
      | 2
      | 3
      | 4
      | 5
      | 6
      | 7
      | 8
      | 9
      | 10
      | 11
      | 12
      | false,
    xs?:
      | "auto"
      | true
      | 1
      | 2
      | 3
      | 4
      | 5
      | 6
      | 7
      | 8
      | 9
      | 10
      | 11
      | 12
      | false,
    zeroMinWidth?: boolean,
    style?: Object,
    className?: ?string,
  |};
  declare export var Grid: AbstractComponent<GridProps>;

  import typeof _createMuiTheme from "@material-ui/core/styles/createMuiTheme";
  declare export var createMuiTheme: _createMuiTheme;

  declare export var colors: {
    common: Color,
    red: Color,
    pink: Color,
    purple: Color,
    deepPurple: Color,
    indigo: Color,
    blue: Color,
    lightBlue: Color,
    cyan: Color,
    teal: Color,
    green: Color,
    lightGreen: Color,
    lime: Color,
    yellow: Color,
    amber: Color,
    orange: Color,
    deepOrange: Color,
    brown: Color,
    grey: Color,
    blueGrey: Color,
  };

  import typeof _MuiThemeProvider from "@material-ui/core/styles/MuiThemeProvider";
  declare export var MuiThemeProvider: _MuiThemeProvider;

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
}

declare type CommonColors = {
  black: string,
  white: string,
};

declare module "@material-ui/core/useMediaQuery" {
  declare export default function useMediaQuery<Theme = unknown>(
    query: string | ((theme: Theme) => string),
    options?: Options,
  ): boolean;
}

declare module "@material-ui/core/colors" {
  declare export type CommonColors = {
    black: string,
    white: string,
  };

  declare export var common: CommonColors;
  declare export var red: Color;
  declare export var pink: Color;
  declare export var purple: Color;
  declare export var deepPurple: Color;
  declare export var indigo: Color;
  declare export var blue: Color;
  declare export var lightBlue: Color;
  declare export var cyan: Color;
  declare export var teal: Color;
  declare export var green: Color;
  declare export var lightGreen: Color;
  declare export var lime: Color;
  declare export var yellow: Color;
  declare export var amber: Color;
  declare export var orange: Color;
  declare export var deepOrange: Color;
  declare export var brown: Color;
  declare export var grey: Color;
  declare export var blueGrey: Color;
}

declare module "@material-ui/core/styles" {
  import typeof _createMuiTheme from "@material-ui/core/styles/createMuiTheme";
  import type {
    Theme as MuiTheme,
    ThemeOptions as MuiThemeOptions,
  } from "@material-ui/core/styles/createMuiTheme";

  import typeof _MuiThemeProvider from "@material-ui/core/styles/MuiThemeProvider";

  import typeof _withStyles from "@material-ui/core/styles/withStyles";
  import type { WithStyles as MuiWithStyles } from "@material-ui/core/styles/withStyles";

  import typeof _withTheme from "@material-ui/core/styles/withTheme";
  import type { WithTheme as MuiWithTheme } from "@material-ui/core/styles/withTheme";

  import typeof _createGenerateClassName from "@material-ui/core/styles/createGenerateClassName";
  import typeof _jssPreset from "@material-ui/core/styles/jssPreset";

  declare export type Theme = MuiTheme;
  declare export type ThemeOptions = MuiThemeOptions;
  declare export type WithStyles = MuiWithStyles;
  declare export type WithTheme = MuiWithTheme;

  declare export var MuiThemeProvider: _MuiThemeProvider;
  declare export var createMuiTheme: _createMuiTheme;
  declare export var withStyles: _withStyles;
  declare export var withTheme: _withTheme;
  declare export var createGenerateClassName: _createGenerateClassName;
  declare export var jssPreset: _jssPreset;
}

declare module "@material-ui/core/styles/withStyles" {
  import typeof _withStyles from "@material-ui/styles/withStyles";

  declare export var withStyles: _withStyles;
  declare export default withStyles;
}

declare module "@material-ui/core/styles/withTheme" {
  import typeof _withTheme from "@material-ui/styles/withTheme";

  declare export var withTheme: _withTheme;
  declare export default withTheme;
}

declare module "@material-ui/core/styles/createMuiTheme" {
  import type {
    Palette,
    PaletteOptions,
  } from "@material-ui/core/styles/createPalette";
  import type {
    Typography,
    TypographyOptions,
  } from "@material-ui/core/styles/createTypography";
  import type {
    Mixins,
    MixinsOptions,
  } from "@material-ui/core/styles/createMixins";
  import type {
    Breakpoints,
    BreakpointsOptions,
  } from "@material-ui/core/styles/createBreakpoints";
  import type { Shadows } from "@material-ui/core/styles/shadows";
  import type { Shape, ShapeOptions } from "@material-ui/core/styles/shape";
  import type {
    Transitions,
    TransitionsOptions,
  } from "@material-ui/core/styles/transitions";

  import type {
    Spacing,
    SpacingOptions,
  } from "@material-ui/core/styles/createSpacing";
  import type { ZIndex, ZIndexOptions } from "@material-ui/core/styles/zIndex";

  declare type ComponentsProps = any;
  declare type Overrides = {};

  declare export type Direction = "ltr" | "rtl";

  declare export type ThemeOptions = {
    shape?: ShapeOptions,
    breakpoints?: BreakpointsOptions,
    direction?: Direction,
    mixins?: MixinsOptions,
    overrides?: Overrides,
    palette?: PaletteOptions,
    props?: ComponentsProps,
    shadows?: Shadows,
    spacing?: SpacingOptions,
    transitions?: TransitionsOptions,
    typography?: TypographyOptions | ((palette: Palette) => TypographyOptions),
    zIndex?: ZIndexOptions,
    unstable_strictMode?: boolean,
  };

  declare export type Theme = {
    shape: Shape,
    breakpoints: Breakpoints,
    direction: Direction,
    mixins: Mixins,
    overrides?: Overrides,
    palette: Palette,
    props?: ComponentsProps,
    shadows: Shadows,
    spacing: Spacing,
    transitions: Transitions,
    typography: Typography,
    zIndex: ZIndex,
    unstable_strictMode?: boolean,

    [key: string]: any,
  };

  declare export default function createMuiTheme(
    options?: ThemeOptions,
    ...args: Array<{}>
  ): Theme;
}

declare module "@material-ui/core/styles/createPalette" {
  import type { CommonColors } from "@material-ui/core/colors/common";

  declare export type TypeText = {
    primary: string,
    secondary: string,
    disabled: string,
    hint: string,
  };

  declare export type TypeAction = {
    active: string,
    hover: string,
    hoverOpacity: number,
    selected: string,
    selectedOpacity: number,
    disabled: string,
    disabledOpacity: number,
    disabledBackground: string,
    focus: string,
    focusOpacity: number,
    activatedOpacity: number,
  };

  declare export type TypeBackground = {
    default: string,
    paper: string,
  };

  declare export type TypeDivider = string;

  declare export type SimplePaletteColorOptions = {
    light?: string,
    main: string,
    dark?: string,
    contrastText?: string,
  };

  declare export type PaletteColorOptions =
    | SimplePaletteColorOptions
    | $Shape<Color>;

  declare export type PaletteColor = {
    light: string,
    main: string,
    dark: string,
    contrastText: string,
  };

  declare export type TypeObject = {
    text: TypeText,
    action: TypeAction,
    divider: TypeDivider,
    background: TypeBackground,
  };

  declare export type PaletteTonalOffset =
    | number
    | {
        light: number,
        dark: number,
      };

  declare export var light: TypeObject;
  declare export var dark: TypeObject;

  declare export type Palette = {
    common: CommonColors,
    type: PaletteType,
    contrastThreshold: number,
    tonalOffset: PaletteTonalOffset,
    primary: PaletteColor,
    secondary: PaletteColor,
    error: PaletteColor,
    warning: PaletteColor,
    info: PaletteColor,
    success: PaletteColor,
    grey: Color,
    text: TypeText,
    divider: TypeDivider,
    action: TypeAction,
    background: TypeBackground,
    getContrastText: (background: string) => string,
    augmentColor: {
      (
        color: $Shape<Color>,
        mainShade?: number | string,
        lightShade?: number | string,
        darkShade?: number | string,
      ): PaletteColor,
      (color: PaletteColorOptions): PaletteColor,
    },
  };

  declare export type PartialTypeObject = $Shape<TypeObject>;

  declare export type PaletteOptions = {
    primary?: PaletteColorOptions,
    secondary?: PaletteColorOptions,
    error?: PaletteColorOptions,
    warning?: PaletteColorOptions,
    info?: PaletteColorOptions,
    success?: PaletteColorOptions,
    type?: PaletteType,
    tonalOffset?: PaletteTonalOffset,
    contrastThreshold?: number,
    common?: $Shape<CommonColors>,
    grey?: ColorPartial,
    text?: $Shape<TypeText>,
    divider?: string,
    action?: $Shape<TypeAction>,
    background?: $Shape<TypeBackground>,
    getContrastText?: (background: string) => string,
  };

  declare export default function createPalette(
    palette: PaletteOptions,
  ): Palette;
}

declare module "@material-ui/core/styles/createTypography" {
  import type { StandardProperties as CSSProperties } from "csstype";

  import type { Palette } from "@material-ui/core/styles/createPalette";

  declare export type Variant =
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
    | "overline";

  declare type FontStyle = {
    fontFamily: $PropertyType<CSSProperties, "fontFamily">,
    fontSize: $PropertyType<CSSProperties, "fontSize">,
    fontWeightLight: $PropertyType<CSSProperties, "fontWeight">,
    fontWeightRegular: $PropertyType<CSSProperties, "fontWeight">,
    fontWeightMedium: $PropertyType<CSSProperties, "fontWeight">,
    fontWeightBold: $PropertyType<CSSProperties, "fontWeight">,
  };

  declare type FontStyleOptions = $Shape<FontStyle> & {
    htmlFontSize?: number,
    allVariants?: CSSProperties,
  };

  declare type TypographyStyle = {
    color?: string,
    fontFamily: $PropertyType<CSSProperties, "fontFamily">,
    fontSize: $PropertyType<CSSProperties, "fontSize">,
    fontWeight: $PropertyType<CSSProperties, "fontWeight">,
    letterSpacing?: $PropertyType<CSSProperties, "letterSpacing">,
    lineHeight?: $PropertyType<CSSProperties, "lineHeight">,
    textTransform?: $PropertyType<CSSProperties, "textTransform">,
  };

  declare export type TypographyStyleOptions = TypographyStyle;

  declare type TypographyUtils = {
    pxToRem: (px: number) => string,
  };

  declare export type Typography = {
    [style: Variant]: $Shape<TypographyStyle>,
  } & FontStyle &
    TypographyUtils;

  declare export type TypographyOptions = $Shape<
    {
      [style: Variant]: $Shape<TypographyStyle>,
      useNextVariants: boolean,
    } & FontStyle,
  >;

  declare export default function createTypography(
    palette: Palette,
    typography: TypographyOptions | ((palette: Palette) => TypographyOptions),
  ): Typography;
}

declare module "@material-ui/core/styles/createMixins" {
  import type { StandardProperties as CSSProperties } from "csstype";
  import type { Breakpoints } from "@material-ui/core/styles/createBreakpoints";

  declare export type Mixins = {
    gutters: (styles?: CSSProperties) => CSSProperties,
    toolbar: CSSProperties,
  };

  declare export type MixinsOptions = $Shape<Mixins>;

  declare export default function createMixins(
    breakpoints: Breakpoints,
    spacing: any,
    mixins: MixinsOptions,
  ): Mixins;
}

declare module "@material-ui/core/styles/createBreakpoints" {
  declare type BreakpointKeys = "xs" | "sm" | "md" | "lg" | "xl";

  declare export type BreakpointDefaults = { [key: BreakpointKeys]: {} };
  declare export type Breakpoint = BreakpointKeys;
  declare export type BreakpointValues = { [key: BreakpointKeys]: number };
  declare export var keys: Breakpoint[];

  declare export type Breakpoints = {
    keys: Breakpoint[],
    values: BreakpointValues,
    up: (key: Breakpoint | number) => string,
    down: (key: Breakpoint | number) => string,
    between: (start: Breakpoint | number, end: Breakpoint | number) => string,
    only: (key: Breakpoint) => string,
    width: (key: Breakpoint) => number,
  };

  declare export type BreakpointsOptions = $Shape<{
    ...Breakpoints,
    unit: string,
    step: number,
  }>;

  declare export default function createBreakpoints(
    options: BreakpointsOptions,
  ): Breakpoints;
}

declare module "@material-ui/core/styles/shadows" {
  declare export type Shadows = Array<"none" | string>;
  declare var shadows: Shadows;

  declare export default typeof shadows;
}

declare module "@material-ui/core/styles/shape" {
  declare export type Shape = {
    borderRadius: number,
  };

  declare export type ShapeOptions = Partial<Shape>;

  declare var shape: Shape;

  declare export default typeof shape;
}

declare module "@material-ui/core/styles/transitions" {
  declare export type Easing = {
    easeInOut: string,
    easeOut: string,
    easeIn: string,
    sharp: string,
  };

  declare export var easing: Easing;

  declare export type Duration = {
    shortest: number,
    shorter: number,
    short: number,
    standard: number,
    complex: number,
    enteringScreen: number,
    leavingScreen: number,
  };

  declare export var duration: Duration;

  declare export function formatMs(milliseconds: number): string;

  declare export type Transitions = {
    easing: Easing,
    duration: Duration,
    create(
      props: string | string[],
      options?: $Shape<{
        duration: number | string,
        easing: string,
        delay: number | string,
      }>,
    ): string,
    getAutoHeightDuration(height: number): number,
  };

  declare export type TransitionsOptions = {
    easing?: $Shape<Easing>,
    duration?: $Shape<Duration>,
    create?: (
      props: string | string[],
      options?: $Shape<{
        duration: number | string,
        easing: string,
        delay: number | string,
      }>,
    ) => string,
    getAutoHeightDuration?: (height: number) => number,
  };

  declare var transitions: Transitions;
  declare export default typeof transitions;
}

declare module "@material-ui/core/styles/createSpacing" {
  declare export type SpacingArgument = number | string;

  declare export type Spacing = (
    top?: SpacingArgument,
    right?: SpacingArgument,
    bottom?: SpacingArgument,
    left?: SpacingArgument,
  ) => string;

  declare export type SpacingOptions =
    | number
    | ((factor: number) => string | number)
    | number[];

  declare export default function createSpacing(
    spacing: SpacingOptions,
  ): Spacing;
}

declare module "@material-ui/core/styles/zIndex" {
  declare export type ZIndex = {
    mobileStepper: number,
    speedDial: number,
    appBar: number,
    drawer: number,
    modal: number,
    snackbar: number,
    tooltip: number,
  };

  declare export type ZIndexOptions = $Shape<ZIndex>;

  declare var zIndex: ZIndex;

  declare export default typeof zIndex;
}
