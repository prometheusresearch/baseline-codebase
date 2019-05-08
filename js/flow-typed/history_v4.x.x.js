declare module "history" {
  declare type release = () => void;

  declare export type Action = "PUSH" | "REPLACE" | "POP";

  declare export type Location = {|
    pathname: string,
    search: string,
    hash: string,
    /** This is only valid for browser and memorty history */
    state?: {},
    /** This is only valid for browser and memorty history */
    key?: string
  |};

  declare export function createLocation(
    path?: string,
    state?: {},
    key?: string,
    currentLocation?: Location
  ): Location;

  declare type History = {|
    length: number,
    location: Location,
    action: Action,
    push: ((location: $Shape<Location>) => void) &
      ((path: string, state?: {}) => void),
    replace: ((path: string, state?: {}) => void) &
      ((location: $Shape<Location>) => void),
    go(n: number): void,
    goBack(): void,
    goForward(): void,
    listen: ((location: Location, action: Action) => void) => release,
    block: (((location: Location, action: Action) => string) => release) &
      ((message: string) => release)
  |};

  declare export type BrowserHistory = History;
  declare export type HashHistory = History;

  declare export type MemoryHistory = {|
    ...History,
    index: number,
    entries: Array<string>,
    canGo(n: number): boolean,
    listen: ((location: Location, action: Action) => void) => release,
    block: (((location: Location, action: Action) => string) => release) &
      ((message: string) => release)
  |};

  declare type BorserHistoryOptions = {
    basename?: string,
    forceRefresh?: boolean,
    getUserConfirmation?: (
      message: string,
      callback: (willContinue: boolean) => void
    ) => void
  };

  declare export function createBrowserHistory(
    opts?: BorserHistoryOptions
  ): BrowserHistory;

  declare type MemoryHistoryOptions = {
    initialEntries?: Array<string>,
    initialIndex?: number,
    keyLength?: number,
    getUserConfirmation?: (
      message: string,
      callback: (willContinue: boolean) => void
    ) => void
  };

  declare export function createMemoryHistory(
    opts?: MemoryHistoryOptions
  ): MemoryHistory;

  declare type HashHistoryOptions = {
    basename?: string,
    hashType: "slash" | "noslash" | "hashbang",
    getUserConfirmation?: (
      message: string,
      callback: (willContinue: boolean) => void
    ) => void
  };

  declare export function createHashHistory(
    opts?: HashHistoryOptions
  ): HashHistory;
}
