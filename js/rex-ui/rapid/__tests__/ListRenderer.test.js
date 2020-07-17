/**
 * @flow
 */

import "./matchMediaMock.js";
import * as React from "react";
import { render, screen, getByText } from "@testing-library/react";
import "@testing-library/jest-dom";

import { MuiThemeProvider } from "@material-ui/core";

import { ThemeProvider, DEFAULT_THEME } from "../index";
import { ListItem, ListRenderer } from "../List";
import * as Field from "../Field";

describe("ListRenderer", function() {
  test("renders ListRenderer with title and empty rows", () => {
    render(
      <ThemeProvider theme={DEFAULT_THEME}>
        <MuiThemeProvider theme={DEFAULT_THEME}>
          <ListRenderer
            items={[]}
            RenderItem={({ item }) => <ListItem primary={String(item.id)} />}
          />
        </MuiThemeProvider>
      </ThemeProvider>,
    );

    screen.debug();

    expect(screen.getByRole("list").children.length).toBe(1);
  });
});
