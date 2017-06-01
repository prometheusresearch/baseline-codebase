declare module 'history' {

  declare type Location = {
    pathname: string,
  };

  declare type Action = 'PUSH' | 'POP' | 'REPLACE';

  declare type History = {
    listen: (fn: (Location, Action) => *) => (() => void);
    push: (path: string, state?: Object) => void;
    replace: (path: string, state?: Object) => void;
    go: (n: number) => void;
    goBack: () => void;
    goForward: () => void;
  };

  declare function createHashHistory(): History;
}

declare module 'history/createHashHistory' {
  import type {History} from 'history';
  declare var exports: (params) => History;
}
