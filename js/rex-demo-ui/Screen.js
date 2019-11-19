// @flow

import * as React from "react";
import * as Rapid from "rex-ui/rapid";
import * as Router from "rex-ui/Router";

export type ShowScreen = {|
  type: "show",
  title: string,
  fetch: string,
  fields?: ?(Rapid.FieldConfig[]),
  RenderTitle?: ?Rapid.ShowRenderTitle,
|};

export type PickScreen = {|
  type: "pick",
  title: string,
  fetch: string,
  description: string,
  fields?: ?(Rapid.FieldConfig[]),
  filters?: ?(Rapid.PickFilterConfig[]),
  onSelect?: (id: string) => [Router.Route<Screen>, Router.Params],
  RenderToolbar?: Rapid.PickRenderToolbar,
|};

export type Screen = PickScreen | ShowScreen;
