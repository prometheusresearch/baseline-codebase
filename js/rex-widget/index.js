/**
 * @copyright 2016, Prometheus Research, LLC
 * @flow
 */

import "./index.css";
import "./TransitionableHandlers";

// form components
import AutocompleteField from "./form/AutocompleteField";
import { TextareaField } from "./form/TextareaField";
import { CheckboxGroupField } from "./form/CheckboxGroupField";
import RadioGroupField from "./form/RadioGroupField";
import { DateField } from "./form/DateField";
import { TimeField } from "./form/TimeField";
import { DateTimeField } from "./form/DateTimeField";
import { SourceCodeField } from "./form/SourceCodeField";
import { JsonSourceCodeField } from "./form/JsonSourceCodeField";

/// configurable form components
import {
  ConfRow as FormRow,
  ConfColumn as FormColumn,
  ConfEntityForm as ConfigurableEntityForm,
  ConfForm as ConfigurableForm,
  ConfField as ConfigurableField
} from "./conf-form";

// library components
import IFrame from "./library/IFrame";
import Authorized from "./Authorized";
import Autocomplete from "./Autocomplete";
import { Link } from "./Link";
import QueryString from "./qs";
import Select from "./Select";

import * as Form from "./form";
import * as Stylesheet from "./Stylesheet";
import * as Data from "./data";
import * as UI from "./ui";
import * as CSS from "./CSS";

import React from "react";
import ReactDOM from "react-dom";

import * as Transitionable from "./Transitionable";

const render = ReactDOM.render;

function renderAsync(s: string, target: HTMLElement, callback: () => void) {
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

  // Current names
  FormRow,
  FormColumn,
  AutocompleteField,
  TextareaField,
  CheckboxGroupField,
  RadioGroupField,
  DateField,
  DateTimeField,
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
  UI,
  CSS,

  // All Transitionable handlers
  Transitionable,
  __require__: Transitionable.__require__
};

export {
  render,
  renderAsync,
  FormRow,
  FormColumn,
  AutocompleteField,
  TextareaField,
  CheckboxGroupField,
  RadioGroupField,
  DateField,
  DateTimeField,
  SourceCodeField,
  JsonSourceCodeField,
  ConfigurableEntityForm,
  IFrame,
  Authorized,
  Autocomplete,
  Link,
  QueryString,
  Select,
  Transitionable
};

// window.RexWidget.registeredPackages = {};

// export function registerPackages(packages) {
//   // TODO: should we allow to call it only once?
//   // or maybe prohibit to override registered packages
//   for (let pkgName in packages) {
//     window.RexWidget.registeredPackages[pkgName] = packages[pkgName];
//   }
// }
