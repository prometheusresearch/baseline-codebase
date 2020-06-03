// @flow

import * as React from "React";

declare module "react-transition-group" {
  declare export type EndHandler = (
    node: HTMLElement,
    done: () => void,
  ) => void;

  declare export type EnterHandler = (
    node: HTMLElement,
    isAppearing: boolean,
  ) => void;

  declare export type ExitHandler = (node: HTMLElement) => void;

  declare type UNMOUNTED = "unmounted";
  declare type EXITED = "exited";
  declare type ENTERING = "entering";
  declare type ENTERED = "entered";
  declare type EXITING = "exiting";

  declare export interface TransitionActions {
    appear?: boolean;
    enter?: boolean;
    exit?: boolean;
  }

  declare export type TransitionStatus =
    | ENTERING
    | ENTERED
    | EXITING
    | EXITED
    | UNMOUNTED;

  declare export type TransitionChildren =
    | React.ReactNode
    | ((status: TransitionStatus) => React.ReactNode);

  declare export interface TransitionProps extends TransitionActions {
    in?: boolean;
    mountOnEnter?: boolean;
    unmountOnExit?: boolean;
    timeout: number | { enter?: number, exit?: number };
    addEndListener?: EndHandler;
    onEnter?: EnterHandler;
    onEntering?: EnterHandler;
    onEntered?: EnterHandler;
    onExit?: ExitHandler;
    onExiting?: ExitHandler;
    onExited?: ExitHandler;
    [prop: string]: any;
    children?: TransitionChildren;
  }

  /**
   * The Transition component lets you describe a transition from one component
   * state to another _over time_ with a simple declarative API. Most commonly
   * It's used to animate the mounting and unmounting of Component, but can also
   * be used to describe in-place transition states as well.
   *
   * By default the `Transition` component does not alter the behavior of the
   * component it renders, it only tracks "enter" and "exit" states for the components.
   * It's up to you to give meaning and effect to those states. For example we can
   * add styles to a component when it enters or exits:
   *
   * ```jsx
   * import Transition from 'react-transition-group/Transition';
   *
   * const duration = 300;
   *
   * const defaultStyle = {
   *   transition: `opacity ${duration}ms ease-in-out`,
   *   opacity: 0,
   * }
   *
   * const transitionStyles = {
   *   entering: { opacity: 1 },
   *   entered:  { opacity: 1 },
   * };
   *
   * const Fade = ({ in: inProp }) => (
   *   <Transition in={inProp} timeout={duration}>
   *     {(state) => (
   *       <div style={{
   *         ...defaultStyle,
   *         ...transitionStyles[state]
   *       }}>
   *         I'm A fade Transition!
   *       </div>
   *     )}
   *   </Transition>
   * );
   * ```
   *
   */
  declare export class Transition extends React.Component<TransitionProps> {}

  declare type CSSTransitionClassNames = {
    appear?: string,
    appearActive?: string,
    appearDone?: string,
    enter?: string,
    enterActive?: string,
    enterDone?: string,
    exit?: string,
    exitActive?: string,
    exitDone?: string,
  };

  /**
   * The animation classNames applied to the component as it enters or exits.
   * A single name can be provided and it will be suffixed for each stage: e.g.
   *
   * `classNames="fade"` applies `fade-enter`, `fade-enter-active`,
   * `fade-exit`, `fade-exit-active`, `fade-appear`, and `fade-appear-active`.
   * Each individual classNames can also be specified independently like:
   *
   * ```js
   * classNames={{
   *  appear: 'my-appear',
   *  appearActive: 'my-active-appear',
   *  enter: 'my-enter',
   *  enterActive: 'my-active-enter',
   *  exit: 'my-exit',
   *  exitActive: 'my-active-exit',
   * }}
   * ```
   */

  declare type CSSTransitionProps = {
    ...TransitionProps,
    classNames?: string | CSSTransitionClassNames,
  };

  declare class CSSTransition extends React.Component<CSSTransition.CSSTransitionProps> {}

  // declare type IntrinsicTransitionGroupProps<T extends keyof JSX.IntrinsicElements = "div"> extends TransitionActions {
  //     component?: T|null;
  // }
  // interface ComponentTransitionGroupProps<T extends ReactType> extends TransitionActions {
  //     component: T;
  // }
  // type TransitionGroupProps<T extends keyof JSX.IntrinsicElements = "div", V extends ReactType = any> =
  //     (IntrinsicTransitionGroupProps<T> & JSX.IntrinsicElements[T]) | (ComponentTransitionGroupProps<V>) & {
  //     children?: ReactElement<TransitionProps> | Array<ReactElement<TransitionProps>>;
  //     childFactory?(child: ReactElement): ReactElement;
  //     [prop: string]: any;
  // };
  //
  // TODO: TS -> flow.js this ^
  declare type TransitionGroupProps = {
    children?:
      | ReactElement<TransitionProps>
      | Array<ReactElement<TransitionProps>>,
    [prop: string]: any,
  };

  /**
   * The `<TransitionGroup>` component manages a set of `<Transition>` components
   * in a list. Like with the `<Transition>` component, `<TransitionGroup>`, is a
   * state machine for managing the mounting and unmounting of components over
   * time.
   *
   * Consider the example below using the `Fade` CSS transition from before.
   * As items are removed or added to the TodoList the `in` prop is toggled
   * automatically by the `<TransitionGroup>`. You can use _any_ `<Transition>`
   * component in a `<TransitionGroup>`, not just css.
   *
   * ```jsx
   * import TransitionGroup from 'react-transition-group/TransitionGroup';
   *
   * class TodoList extends React.Component {
   *   constructor(props) {
   *     super(props)
   *     this.state = {items: ['hello', 'world', 'click', 'me']}
   *   }
   *   handleAdd() {
   *     const newItems = this.state.items.concat([
   *       prompt('Enter some text')
   *     ]);
   *     this.setState({ items: newItems });
   *   }
   *   handleRemove(i) {
   *     let newItems = this.state.items.slice();
   *     newItems.splice(i, 1);
   *     this.setState({items: newItems});
   *   }
   *   render() {
   *     return (
   *       <div>
   *         <button onClick={() => this.handleAdd()}>Add Item</button>
   *         <TransitionGroup>
   *           {this.state.items.map((item, i) => (
   *             <FadeTransition key={item}>
   *               <div>
   *                 {item}{' '}
   *                 <button onClick={() => this.handleRemove(i)}>
   *                   remove
   *                 </button>
   *               </div>
   *             </FadeTransition>
   *           ))}
   *         </TransitionGroup>
   *       </div>
   *     );
   *   }
   * }
   * ```
   *
   * Note that `<TransitionGroup>`  does not define any animation behavior!
   * Exactly _how_ a list item animates is up to the individual `<Transition>`
   * components. This means you can mix and match animations across different
   * list items.
   */

  declare export class TransitionGroup extends React.Component<TransitionGroupProps> {}
}
