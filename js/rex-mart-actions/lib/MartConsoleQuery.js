/**
 * @copyright 2017-present, Prometheus Research, LLC
 * @flow
 */

import React from "react";
import ReactDOM from "react-dom";
import { Element } from "react-stylesheet";
import { Button } from "@prometheusresearch/react-ui";

import { Action } from "rex-action";
import * as ui from "rex-widget/ui";
import * as rexui from "rex-ui";
import { withFetch, forceRefreshData } from "rex-widget/data";
import resolveURL from "rex-widget/resolveURL";
import martFromContext from "rex-mart-actions/lib/martFromContext";

import MartQueryToolbar from "./MartQueryToolbar";

const CONSOLE_TOOLBAR_HEIGHT = 32;

/**
 * Wrapper around HTSQL console which binds it to a mart database.
 *
 * HTSQL console is being injected using an `<iframe>` DOM element.
 */
export class HtsqlConsoleBase extends React.Component {
  static defaultProps = {
    icon: "eye-open"
  };

  state: { loading: boolean } = { loading: true };

  iframe = null;
  iframeRpc = null;

  onIFrameLoaded = () => {
    this.setState({
      loading: false
    });
  };

  onIFrameDidMount = component => {
    if (component) {
      const iframe = ReactDOM.findDOMNode(component);
      this.iframe = iframe;
      this.iframe.addEventListener("load", this.onIFrameLoaded);
      this.iframeRpc = new WindowRPC(this.iframe.contentWindow);
    } else {
      this.iframe = null;
      this.iframeRpc = null;
    }
  };

  async getCurrentQuery() {
    if (this.iframeRpc) {
      const resp = this.iframeRpc.request("getQuery");
      return resp;
    } else {
      return null;
    }
  }

  render() {
    const { mart, query, toolbar } = this.props;
    const htsqlUrl = resolveURL(
      `rex.mart:/mart/${mart}/shell('${sanitizeQuery(query)}')`
    );
    return (
      <Element height="100%">
        {toolbar && (
          <Element padding={4} height={CONSOLE_TOOLBAR_HEIGHT}>
            {toolbar}
          </Element>
        )}
        {this.state.loading && <rexui.PreloaderScreen />}
        <Element
          position="relative"
          height={`calc(100% - ${CONSOLE_TOOLBAR_HEIGHT}px)`}
        >
          <ui.IFrame
            style={{ padding: 1 }}
            ref={this.onIFrameDidMount}
            src={htsqlUrl}
          />
        </Element>
      </Element>
    );
  }
}

class API {
  constructor(insert, update) {
    this._insert = insert;
    this._update = update;
  }

  insert({ mart, title, query }) {
    if (this._insert == null) {
      throw new Error("MartQueryAPI is not configured for inserts");
    }
    return this._insert.execute({
      mart,
      title: sanitizeTitle(title),
      data: query
    });
  }

  update({ id, title, query }) {
    if (this._update == null) {
      throw new Error("MartQueryAPI is not configured for updates");
    }
    return this._update.execute({
      id,
      title: sanitizeTitle(title),
      data: query
    });
  }
}

export class MartMakeConsoleQuery extends React.Component {
  static defaultProps = {
    icon: "eye-open",
    kind: "success"
  };

  constructor(props) {
    super(props);
    this.state = {
      title: "Untitled Query",
      saving: false
    };
    this.api = new API(this.props.insertQuery, null);
  }

  showProgress = () => {
    this.setState({ saving: true });
    this._progress = ui.showNotification(
      <ui.Notification kind="info" text="Saving Query." icon="cog" />,
      Infinity
    );
  };

  removeProgress = () => {
    this.setState({ saving: false });
    ui.removeNotification(this._progress);
  };

  onSave = async () => {
    const { title } = this.state;
    const mart = martFromContext(this.props.context);
    const query = await this.console.getCurrentQuery();
    if (query != null) {
      this.showProgress();
      this.api.insert({ mart, title, query }).then(this.onSaved, this.onError);
    }
  };

  onSaved = data => {
    this.removeProgress();
    ui.showNotification(
      <ui.Notification
        kind="success"
        text="Query saved successfully"
        icon="ok"
      />
    );

    let newEntity = Object.values(data)[0][0];
    let { onContext, refetch } = this.props;
    onContext({
      mart_console_query: newEntity
    });
    refetch();
  };

  onError = () => {
    this.removeProgress();
    ui.showNotification(
      <ui.Notification
        kind="danger"
        text="There was an error while saving the query"
        icon="remove"
      />,
      Infinity
    );
  };

  onChangeTitle = e => {
    const title = e.target.value || "";
    this.setState({ title });
  };

  onConsole = console => {
    this.console = console;
  };

  render() {
    const { context, ...props } = this.props;
    const { saving, title } = this.state;
    const mart = martFromContext(context);
    const query = "";
    const toolbar = (
      <MartQueryToolbar
        saving={saving}
        title={title}
        saveDisabled={false}
        onChangeTitle={this.onChangeTitle}
        onSave={this.onSave}
      />
    );
    return (
      <HtsqlConsoleBase
        ref={this.onConsole}
        {...props}
        mart={mart}
        query={query}
        toolbar={toolbar}
      />
    );
  }
}

export const MartEditConsoleQuery = withFetch(
  class extends React.Component {
    static defaultProps = {
      icon: "eye-open"
    };

    constructor(props) {
      super(props);
      this.state = {
        title: null,
        saving: false
      };
      this.api = new API(this.props.insertQuery, this.props.updateQuery);
    }

    onChangeTitle = e => {
      const title = e.target.value || "";
      this.setState({ title });
    };

    onConsole = console => {
      this.console = console;
    };

    onSave = async () => {
      const query = await this.console.getCurrentQuery();
      const title = this.state.title || this.props.fetched.query.data.title;
      const id = this.props.context.mart_console_query.id;
      this.showProgress();
      this.api
        .update({ id, title, query })
        .then(
          this.onSaved.bind(null, "Query saved successfully"),
          this.onError
        );
    };

    onClone = async () => {
      const query = await this.console.getCurrentQuery();
      const title = this.state.title || this.props.fetched.query.data.title;
      const mart = martFromContext(this.props.context);
      this.showProgress();
      this.api
        .insert({ mart, title, query })
        .then(
          this.onSaved.bind(null, "Query cloned successfully"),
          this.onError
        );
    };

    onSaved = (message, data) => {
      this.removeProgress();
      ui.showNotification(
        <ui.Notification kind="success" text={message} icon="ok" />
      );
      let newEntity = Object.values(data)[0][0];
      let { context } = this.props;
      this.props.onEntityUpdate(context.mart_console_query, newEntity);
      forceRefreshData();
    };

    onError = () => {
      this.removeProgress();
      ui.showNotification(
        <ui.Notification
          kind="danger"
          text="There was an error while saving the query"
          icon="remove"
        />,
        Infinity
      );
    };

    showProgress = () => {
      this.setState({ ...this.state, saving: true });
      this._progress = ui.showNotification(
        <ui.Notification kind="info" text="Saving Query." icon="cog" />,
        Infinity
      );
    };

    removeProgress = () => {
      this.setState({ ...this.state, saving: false });
      ui.removeNotification(this._progress);
    };

    render() {
      const {
        context,
        cloneQuery,
        fetched: { query },
        ...props
      } = this.props;
      const { saving, title } = this.state;
      if (query.updating || query.data == null) {
        return <rexui.PreloaderScreen />;
      }
      const mart = martFromContext(context);
      const toolbar = (
        <MartQueryToolbar
          saving={saving}
          title={title || query.data.title}
          saveDisabled={false}
          onChangeTitle={this.onChangeTitle}
          onSave={this.onSave}
          onClone={cloneQuery ? this.onClone : null}
        />
      );
      return (
        <HtsqlConsoleBase
          ref={this.onConsole}
          {...props}
          mart={mart}
          query={query.data.data}
          toolbar={toolbar}
        />
      );
    }
  },
  function fetchQuery({ fetchQuery, context }) {
    const query = fetchQuery
      .params({ "*": context.mart_console_query.id })
      .getSingleEntity();
    return { query };
  }
);

function sanitizeTitle(title) {
  return title.replace(/\s+$/, "").replace(/^\s+/, "");
}

function sanitizeQuery(query) {
  query = query.replace(/'/g, "''");
  query = encodeURIComponent(query);
  return query;
}

class WindowRPC {
  constructor(otherWindow) {
    this.otherWindow = otherWindow;
    this.requestsById = {};
    this.allowedOrigin = window.location.origin;
    window.addEventListener("message", this.onMessage);
  }

  onMessage = evt => {
    if (evt.origin === this.allowedOrigin && evt.source === this.otherWindow) {
      const resolve = this.requestsById[evt.data.id];
      if (resolve != null) {
        resolve(evt.data.data);
      } else {
        console.warn("Orphaned response:", evt);
      }
    }
  };

  request(type, data) {
    const id = Math.floor(Math.random() * 100000);
    const payload = { type, id, data };
    this.otherWindow.postMessage(payload, this.allowedOrigin);
    return new Promise(resolve => {
      this.requestsById[id] = resolve;
    });
  }

  shutdown() {
    window.removeEventListener("message", this.onMessage);
  }
}
