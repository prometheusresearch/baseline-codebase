/**
 * State container modelled after Redux.
 *
 * The reason we didn't choose Redux is our requirements to typesafety and
 * integration with React's local component state.
 *
 * @flow
 */

/**
 * Effect is an imperative piece of code which happens when some action is
 * handled.
 */
export type Effect<S> = (
  state: S,
  setState: (tag: string, updater: (state: S) => S) => void,
) => *;

/**
 * A function which takes a state and produces an updated state and optionally a
 * list of effects.
 */
export type StateUpdater<S: Object> = (state: S) => S | [S, Array<Effect<S>> | Effect<S>];

/**
 * A function which produces a state updater for a given set of parameters.
 */
export type ActionHandler<P: Object | void, S> = (params: P) => StateUpdater<S>;

/**
 * An interface to state container.
 *
 * You can read state and modify it via actions.
 */
export type StateContainer<S: Object, H: {[name: string]: ActionHandler<*, S>}> = {
  /**
   * Actions available.
   */
  actions: $ObjMap<H, <P>(a: ActionHandler<P, S>) => (params: P) => void>,

  /**
   * Return current state.
   */
  getState: () => S,

  /**
   * Dispose container.
   */
  dispose: () => void,
};

/**
 * Actions for a given state container.
 */
export type StateContainerActions<SC: StateContainer<*, *>> = $PropertyType<SC, 'actions'>;

const REDUX_DEVTOOLS_ENABLED = process.env.NODE_ENV === 'development' &&
  typeof window !== 'undefined' &&
  window.__REDUX_DEVTOOLS_EXTENSION__ != null;

/**
 * Create a new state container given an initial state and a set of action
 * handlers.
 */
export function create<S: Object, H: {[name: string]: ActionHandler<*, S>}>(
  initialState: S,
  actions: H,
  onChange: (state: S, callback: (state: S) => *) => *,
): StateContainer<S, H> {
  let state = initialState;
  let devtools = null;
  let devtoolsUnsubscribe = null;

  function makeUpdaterForEffect(actionName) {
    return function effectUpdater(tag, updater) {
      state = updater(state);
      if (devtools != null) {
        let type = `${actionName}.${tag}`;
        devtools.send({type}, state);
      }
      onChange(state, () => {});
    };
  }

  function createActionCreator(actionName, actionHandler) {
    return function(params) {
      let result = actionHandler(params)(state);
      let effect = null;
      if (Array.isArray(result)) {
        let [nextState, nextEffect] = result;
        effect = nextEffect;
        state = nextState;
      } else {
        state = result;
      }
      if (devtools != null) {
        devtools.send({...params, type: actionName}, state);
      }
      onChange(state, state => {
        if (effect) {
          if (Array.isArray(effect)) {
            effect.forEach(effect => {
              effect(state, makeUpdaterForEffect(actionName));
            });
          } else {
            effect(state, makeUpdaterForEffect(actionName));
          }
        }
      });
    };
  }

  let actionCreators = {};

  for (let actionName in actions) {
    if (actions.hasOwnProperty(actionName)) {
      actionCreators[actionName] = createActionCreator(actionName, actions[actionName]);
    }
  }

  if (REDUX_DEVTOOLS_ENABLED) {
    devtools = window.__REDUX_DEVTOOLS_EXTENSION__.connect();
    devtoolsUnsubscribe = devtools.subscribe(message => {
      if (message.type === 'DISPATCH' && message.payload.type === 'JUMP_TO_STATE') {
        let state = JSON.parse(message.state);
        onChange(state, state => {});
      }
    });
  }

  return {
    getState() {
      return state;
    },

    actions: actionCreators,

    dispose() {
      if (REDUX_DEVTOOLS_ENABLED) {
        window.__REDUX_DEVTOOLS_EXTENSION__.disconnect();
      }
      if (devtools != null) {
        devtools = null;
      }
      if (devtoolsUnsubscribe != null) {
        devtoolsUnsubscribe();
        devtoolsUnsubscribe = null;
      }
    },
  };
}
