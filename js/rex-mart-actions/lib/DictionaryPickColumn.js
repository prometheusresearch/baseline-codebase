/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from "react";

import { TitleBase as Title } from "rex-action";
import DictionaryPick from "./DictionaryPick";

export default class DictionaryPickColumn extends DictionaryPick {
  static targetContext = "mart_column";

  static renderTitle({ title }, { mart_column }) {
    return <Title title={title} subtitle={mart_column} />;
  }
}
