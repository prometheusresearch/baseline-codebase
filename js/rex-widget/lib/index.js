/**
 * @copyright 2016, Prometheus Research, LLC
 */

import "./setup-runtime";
import "./index.css";
import "./TransitionableHandlers";

import Chrome from "./Chrome";

// form components
import FormRow from "./form/FormRow";
import FormColumn from "./form/FormColumn";
import AutocompleteField from "./form/AutocompleteField";
import TextareaField from "./form/TextareaField";
import CheckboxGroupField from "./form/CheckboxGroupField";
import RadioGroupField from "./form/RadioGroupField";
import DateField from "./form/DateField";
import DatetimeField from "./form/DatetimeField";
import SourceCodeField from "./form/SourceCodeField";
import JsonSourceCodeField from "./form/JsonSourceCodeField";
import ConfigurableEntityForm from "./form/ConfigurableEntityForm";

// library components
import IFrame from "./library/IFrame";
import Authorized from "./Authorized";
import Autocomplete from "./Autocomplete";
import Link from "./Link";
import QueryString from "./qs";
import Select from "./Select";

import * as Form from "../form";
import * as Stylesheet from "../stylesheet";
import * as Data from "../data";
import * as Layout from "../layout";
import * as UI from "../ui";
import * as CSS from "../css";

import React from "react";
import ReactDOM from "react-dom";
import ReactUpdates from "react/lib/ReactUpdates";
import CSSPropertyOperations from "react/lib/CSSPropertyOperations";
import dangerousStyleValue from "react/lib/dangerousStyleValue";
import shallowCompare from "react/lib/shallowCompare";

import * as Transitionable from "./Transitionable";

const render = ReactDOM.render;

function renderAsync(s, target, callback) {
  let packages = Transitionable.extractPackageNames(s);
  Transitionable.ensurePackages(packages).then(() => {
    let widget = Transitionable.decode(s);
    ReactDOM.render(widget, target, callback);
  });
}

window.RexWidget = {
  // render
  render,
  renderAsync,

  // React
  React,
  ReactDOM,
  React_ReactUpdates: ReactUpdates,
  React_CSSPropertyOperations: CSSPropertyOperations,
  React_dangerousStyleValue: dangerousStyleValue,
  React_shallowCompare: shallowCompare,

  // Current names
  FormRow,
  FormColumn,
  AutocompleteField,
  TextareaField,
  CheckboxGroupField,
  RadioGroupField,
  DateField,
  DatetimeField,
  SourceCodeField,
  JsonSourceCodeField,
  ConfigurableEntityForm,
  IFrame,
  Authorized,
  Autocomplete,
  Link,
  QueryString,
  Select,

  // Subpackages
  Form,
  Stylesheet,
  Data,
  Layout,
  UI,
  CSS,

  // All Transitionable handlers
  Transitionable,
  __require__: Transitionable.__require__
};

export {
  render,
  renderAsync,
  Chrome,
  FormRow,
  FormColumn,
  AutocompleteField,
  TextareaField,
  CheckboxGroupField,
  RadioGroupField,
  DateField,
  DatetimeField,
  SourceCodeField,
  JsonSourceCodeField,
  ConfigurableEntityForm,
  IFrame,
  Authorized,
  Autocomplete,
  Link,
  QueryString,
  Select,
  Transitionable,
};

// window.RexWidget.registeredPackages = {};

// export function registerPackages(packages) {
//   // TODO: should we allow to call it only once?
//   // or maybe prohibit to override registered packages
//   for (let pkgName in packages) {
//     window.RexWidget.registeredPackages[pkgName] = packages[pkgName];
//   }
// }

