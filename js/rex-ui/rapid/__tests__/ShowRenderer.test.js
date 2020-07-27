/**
 * @flow
 * @jest-environment jsdom-sixteen
 */

import "./matchMediaMock.js";
import * as React from "react";
import {
  render,
  screen,
  waitForElementToBeRemoved,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { MuiThemeProvider } from "@material-ui/core";

import { ThemeProvider, DEFAULT_THEME } from "../index";
import { ShowRenderer } from "../ShowRenderer";
import * as Field from "../Field";
import * as Filter from "../Filter";

describe("ShowRenderer", function() {
  test("renders basic ShowRenderer without title and fields", () => {
    render(
      <ThemeProvider theme={DEFAULT_THEME}>
        <MuiThemeProvider theme={DEFAULT_THEME}>
          <ShowRenderer flat square data={[{ id: "test-id-1" }]} />
        </MuiThemeProvider>
      </ThemeProvider>,
    );

    // should have no title
    expect(
      screen.queryByTestId("show-header-container"),
    ).not.toBeInTheDocument();

    // fields should be empty
    const fieldsContainer = screen.getByTestId("show-content-container");
    expect(fieldsContainer).toBeInTheDocument();
    expect(fieldsContainer.children).toHaveLength(0);

    // should not be actions
    expect(
      screen.queryByTestId("show-actions-container"),
    ).not.toBeInTheDocument();
  });

  test("renders ShowRenderer with title and one field", () => {
    render(
      <ThemeProvider theme={DEFAULT_THEME}>
        <MuiThemeProvider theme={DEFAULT_THEME}>
          <ShowRenderer
            flat
            square
            data={{ id: "test-id-1" }}
            title="Test title"
            fields={[Field.configureField("id")]}
          />
        </MuiThemeProvider>
      </ThemeProvider>,
    );

    // should have title
    expect(screen.getByTestId("show-header-container")).toHaveTextContent(
      "Test title",
    );

    // fields should be have 1 child
    const fieldsContainer = screen.getByTestId("show-content-container");
    expect(fieldsContainer).toBeInTheDocument();
    expect(fieldsContainer.children).toHaveLength(1);

    // field should have label and value
    expect(screen.getByText("ID")).toBeInTheDocument();
    expect(screen.getByText("test-id-1")).toBeInTheDocument();
  });

  test("renders ShowRenderer with titleField", () => {
    render(
      <ThemeProvider theme={DEFAULT_THEME}>
        <MuiThemeProvider theme={DEFAULT_THEME}>
          <ShowRenderer
            flat
            square
            data={{ id: "test-id-1", name: "test-name" }}
            titleField={Field.configureField("name")}
            fields={[Field.configureField("id")]}
          />
        </MuiThemeProvider>
      </ThemeProvider>,
    );

    // should have title extracted from titleField
    expect(screen.getByTestId("show-header-container")).toHaveTextContent(
      "test-name",
    );
  });

  test("renders ShowRenderer with multiple fields and actions", () => {
    const actionFn = jest.fn();
    const actions = [
      {
        name: "test-action",
        kind: "primary",
        title: "Test action",
        run: actionFn,
      },
    ];

    render(
      <ThemeProvider theme={DEFAULT_THEME}>
        <MuiThemeProvider theme={DEFAULT_THEME}>
          <ShowRenderer
            flat
            square
            data={{ id: "test-id-1", name: "test-name", age: 19, sex: "male" }}
            title="John Doe"
            fields={Field.configureFields([
              "name",
              { name: "age", field: "age", editable: () => true },
              "sex",
              "empty",
            ])}
            actions={actions}
          />
        </MuiThemeProvider>
      </ThemeProvider>,
    );

    // should have title
    expect(screen.getByText("John Doe")).toBeInTheDocument();

    // fields should be have 3 children
    const fieldsContainer = screen.getByTestId("show-content-container");
    expect(fieldsContainer).toBeInTheDocument();
    expect(fieldsContainer.children).toHaveLength(4);

    // fields should have label and value
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("test-name")).toBeInTheDocument();
    expect(screen.getByText("Age")).toBeInTheDocument();
    expect(screen.getByText("19")).toBeInTheDocument();
    expect(screen.getByText("Sex")).toBeInTheDocument();
    expect(screen.getByText("male")).toBeInTheDocument();

    // non existing field should have empty value
    expect(screen.getByText("Empty")).toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument();

    // list should contain 1 action
    expect(screen.getByTestId("show-actions-container")).toBeInTheDocument();
    const actionButtons = screen.getAllByRole("button");
    expect(actionButtons).toHaveLength(1);
    expect(actionButtons[0]).toHaveTextContent("Test action");

    // click on action button should call the action function
    userEvent.click(actionButtons[0]);
    expect(actionFn).toHaveBeenCalled();
  });

  test("renders ShowRenderer with editable field", async () => {
    const onEdit = jest.fn();

    const data = { id: "test-id-1", name: "test-name", age: 19, sex: "male" };

    render(
      <ThemeProvider theme={DEFAULT_THEME}>
        <MuiThemeProvider theme={DEFAULT_THEME}>
          <ShowRenderer
            flat
            square
            data={data}
            fields={Field.configureFields([
              { name: "age", field: "age", editable: () => true, edit: onEdit },
            ])}
          />
        </MuiThemeProvider>
      </ThemeProvider>,
    );

    let fieldTitle = screen.getByText("Age");
    let fieldValue = screen.getByText("19");
    expect(fieldTitle).toBeInTheDocument();
    expect(fieldValue).toBeInTheDocument();

    // field should have hidden edit icon
    let editButton = screen.getByRole("button", { hidden: true });
    expect(editButton).not.toBeVisible();
    expect(editButton).toHaveTextContent("Edit");

    // set edit button visible when hover on field
    userEvent.hover(fieldValue);
    expect(editButton).toBeVisible();

    // set field to editable state on edit click
    userEvent.click(editButton);

    // show components should not be rendered
    expect(fieldTitle).not.toBeInTheDocument();
    expect(fieldValue).not.toBeInTheDocument();
    expect(editButton).not.toBeInTheDocument();

    // edit components should be rendered instead
    const editLabel = screen.getByText("Age");
    let editInput = screen.getByRole("textbox");
    let okButton = screen.getByRole("button", { name: /ok/i });
    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    expect(editLabel).toBeInTheDocument();
    expect(editInput).toHaveValue("19");
    expect(okButton).toBeInTheDocument();
    expect(cancelButton).toBeInTheDocument();

    // input text should change after user event
    userEvent.clear(editInput);
    expect(editInput).toHaveValue("");
    userEvent.type(editInput, "22");
    expect(editInput).toHaveValue("22");

    // cancel button click should revert all the changes and set field back to show mode
    userEvent.click(cancelButton);
    expect(editLabel).not.toBeInTheDocument();
    expect(editInput).not.toBeInTheDocument();
    expect(okButton).not.toBeInTheDocument();
    expect(cancelButton).not.toBeInTheDocument();

    fieldTitle = screen.getByText("Age");
    fieldValue = screen.getByText("19");
    expect(fieldTitle).toBeInTheDocument();
    expect(fieldValue).toBeInTheDocument();
    editButton = screen.getByRole("button");
    expect(editButton).toHaveTextContent("Edit");

    // go back to editing mode
    userEvent.click(editButton);

    editInput = screen.getByRole("textbox");
    okButton = screen.getByRole("button", { name: /ok/i });

    // input text should change after user event
    userEvent.clear(editInput);
    expect(editInput).toHaveValue("");
    await userEvent.type(editInput, "22");
    expect(editInput).toHaveValue("22");

    // ok button click should call edit function, save the changes and set field back to show mode
    userEvent.click(okButton);
    expect(onEdit).toHaveBeenCalledWith(data, "22");

    await waitForElementToBeRemoved(() => screen.queryByRole("textbox"));

    expect(editLabel).not.toBeInTheDocument();
    expect(editInput).not.toBeInTheDocument();
    expect(okButton).not.toBeInTheDocument();
    expect(cancelButton).not.toBeInTheDocument();

    expect(screen.getByText("22")).toBeInTheDocument();
  });

  test("renders ShowRenderer fields with and without title", () => {
    const data = { id: "test-id-1", name: "test-name", age: 19, sex: "male" };

    render(
      <ThemeProvider theme={DEFAULT_THEME}>
        <MuiThemeProvider theme={DEFAULT_THEME}>
          <ShowRenderer
            flat
            square
            data={data}
            fields={Field.configureFields([
              { name: "name", field: "name", hideTitle: false },
              { name: "age", field: "age", hideTitle: true },
            ])}
          />
        </MuiThemeProvider>
      </ThemeProvider>,
    );

    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.queryByText("Age")).not.toBeInTheDocument();
  });

  // test("renders ShowRenderer field with validation", () => {
  //   const data = { id: "test-id-1", name: "test-name", age: 19, sex: "male" };

  //   const validateFn = jest.fn();

  //   render(
  //     <ThemeProvider theme={DEFAULT_THEME}>
  //       <MuiThemeProvider theme={DEFAULT_THEME}>
  //         <ShowRenderer
  //           flat
  //           square
  //           data={data}
  //           fields={Field.configureFields([
  //             { name: "age", field: "age", validate: true },
  //           ])}
  //         />
  //       </MuiThemeProvider>
  //     </ThemeProvider>,
  //   );

  //   validateFn.mockReturnValueOnce(false);

  //   expect(screen.getByText("Name")).toBeInTheDocument();
  //   expect(screen.queryByText("Age")).not.toBeInTheDocument();
  // });
});
