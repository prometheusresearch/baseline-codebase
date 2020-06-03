/**
 * @flow
 */

import * as React from "react";
import * as Cell from "../Cell.js";

type ExtractItemType = <V>(?Array<V>) => V;
export type ItemOf<V: ?Array<any>> = $Call<ExtractItemType, V>;

type keypath = string[];

export opaque type Form<V>: {
  +keypath: keypath,
  +update: ((?V) => V | $Shape<$NonMaybeType<V>>) => void,
  +setIsDirty: boolean => void,
  +useValue: () => Value<V>,
  +getValue: () => Value<V>,
  +subscribe: (fn: (Value<V>) => void) => () => void,
} = {|
  +type: "form",
  +cell: Cell.Cell<any>,
  +project: (FormState<mixed>) => Value<V>,

  +keypath: keypath,
  +update: ((?V) => V | $Shape<$NonMaybeType<V>>) => void,
  +setIsDirty: boolean => void,
  +useValue: () => Value<V>,
  +getValue: () => Value<V>,
  +subscribe: (fn: (Value<V>) => void) => () => void,
|};

export opaque type ValueField<V>: {
  +keypath: keypath,
  +update: ((?V) => V | $Shape<$NonMaybeType<V>>) => void,
  +setIsDirty: boolean => void,
  +useValue: () => Value<V>,
  +getValue: () => Value<V>,
} = {|
  +type: "field",
  +cell: Cell.Cell<any>,
  +parent: AnyField | Form<any>,

  +project: (FormState<mixed>) => Value<V>,

  +keypath: keypath,
  +update: ((?V) => V | $Shape<$NonMaybeType<V>>) => void,
  +setIsDirty: boolean => void,
  +useValue: () => Value<V>,
  +getValue: () => Value<V>,
|};

export opaque type ArrayField<V: ?Array<any>>: {
  +keypath: keypath,
  +update: ((?V) => V | $Shape<$NonMaybeType<V>>) => void,
  +setIsDirty: boolean => void,
  +useValue: () => Value<V>,
  +removeItem: number => void,
  +addItem: (number, ?ItemOf<V>) => void,
} = {|
  +type: "arrayfield",
  +cell: Cell.Cell<any>,
  +parent: AnyField | Form<any>,

  +project: (FormState<mixed>) => Value<V[]>,

  +keypath: keypath,
  +update: ((?V) => V | $Shape<$NonMaybeType<V>>) => void,
  +setIsDirty: boolean => void,
  +useValue: () => Value<V>,
  +removeItem: number => void,
  +addItem: (number, ?ItemOf<V>) => void,
|};

export type Field<V> = Form<V> | ValueField<V>;

type AnyField = ValueField<any> | ArrayField<any>;

type FormConfig<V> = {|
  +value: () => ?V,
  +validate: (?V) => Validation,
|};

type FormState<V> = {|
  +value: ?V,
  +validation: Validation,
  +dirty: Set<any>,
|};

export type Value<+V> = {|
  +value: ?V,
  +validation: Validation,
  +errorMessage: ?string,
  +isDirty: boolean,
|};

export function useForm<V>(config: FormConfig<V>): Form<V> {
  let cell = React.useMemo(() => {
    let value = config.value();
    let validation = config.validate(value);
    let dirty = new Set();
    return Cell.create({ value, validation, dirty });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  let handle: Form<V> = React.useMemo(
    () => {
      function project(state) {
        return {
          value: state.value,
          validation: state.validation,
          errorMessage: state.validation.message,
          isDirty: state.dirty.has(handle),
        };
      }
      function useValue() {
        let state = cell.useSubscription(state => state);
        return React.useMemo(() => project(state), [state]);
      }

      let getValue = () => {
        let state = cell.get();
        return project(state);
      };

      let subscribe = cb => {
        return cell.subscribe(() => {
          cb(project(cell.get()));
        });
      };

      let update = (f: (?V) => V | $Shape<$NonMaybeType<V>>) =>
        cell.set(state => {
          let value = f(state.value);
          let validation = config.validate(value);
          let nextState: FormState<V> = {
            dirty: state.dirty,
            value,
            validation,
          };
          return nextState;
        });

      let setIsDirty = isDirty => {
        cell.set(state => {
          let dirty = new Set(state.dirty);
          if (isDirty) {
            dirty.add(handle);
          } else {
            dirty.delete(handle);
          }
          return { ...state, dirty };
        });
      };

      return {
        type: "form",
        keypath: [],
        cell,
        project: (project: any),
        update,
        setIsDirty,
        useValue,
        getValue,
        subscribe,
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cell],
  );

  return handle;
}

export function useField<
  P: ?{ [name: string]: any },
  K: $Keys<$NonMaybeType<P>>,
>(parent: Field<P>, name: K): Field<$ElementType<$NonMaybeType<P>, K>> {
  type V = $ElementType<$NonMaybeType<P>, K>;

  let handle: ValueField<V> = React.useMemo(
    () => {
      let project = (root: FormState<any>) => {
        let prev = parent.project(root);
        let value = prev.value?.[name];
        let validation = prev.validation.children[name] ?? valid;
        let isDirty = prev.isDirty || root.dirty.has(handle);
        return {
          value,
          validation,
          errorMessage: validation.message,
          isDirty,
        };
      };
      function useValue() {
        return parent.cell.useSubscription(project);
      }

      let getValue = () => {
        let state = parent.cell.get();
        return project(state);
      };

      let update = (f: (?V) => $Shape<V>) => {
        parent.update(parent => {
          let nextParent = { ...parent, [name]: f(parent?.[name]) };
          return nextParent;
        });
      };

      let setIsDirty = isDirty => {
        parent.cell.set(state => {
          let dirty = new Set(state.dirty);
          if (isDirty) {
            dirty.add(handle);
          } else {
            dirty.delete(handle);
          }
          return { ...state, dirty };
        });
      };

      return {
        type: "field",
        keypath: parent.keypath.concat([name]),
        parent,
        cell: parent.cell,
        project,
        update,
        setIsDirty,
        useValue,
        getValue,
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [name, parent],
  );

  return handle;
}

export function useArrayField<
  P: ?{ [name: string]: any },
  K: $Keys<$NonMaybeType<P>>,
>(parent: Field<P>, name: K): ArrayField<$ElementType<$NonMaybeType<P>, K>> {
  type V = $ElementType<$NonMaybeType<P>, K>;
  let handle: ArrayField<V> = React.useMemo(
    () => {
      let project = (root: FormState<any>) => {
        let prev = parent.type === "form" ? root : parent.project(root);
        let value = prev.value?.[name];
        let validation = prev.validation.children[name] ?? valid;
        let isDirty = prev.isDirty || root.dirty.has(handle);
        return {
          value,
          validation,
          errorMessage: validation.message,
          isDirty,
        };
      };

      function useValue() {
        return parent.cell.useSubscription(project);
      }

      let update = (f: (?Array<V>) => ?Array<V>) => {
        parent.update(parent => {
          let nextParent = { ...parent, [name]: f(parent?.[name]) };
          return nextParent;
        });
      };

      let setIsDirty = isDirty => {
        parent.cell.set(state => {
          let dirty = new Set(state.dirty);
          if (isDirty) {
            dirty.add(handle);
          } else {
            dirty.delete(handle);
          }
          return { ...state, dirty };
        });
      };

      return {
        type: "arrayfield",
        keypath: parent.keypath.concat([name]),
        parent,
        cell: parent.cell,
        project,
        update,
        setIsDirty,
        useValue,
        addItem: (index, item) => {
          update(value => {
            let next = (value ?? []).slice(0);
            next.splice(index, 0, item);
            return next;
          });
        },
        removeItem: index => {
          update(value => {
            let next = (value ?? []).slice(0);
            next.splice(index, 1);
            return next;
          });
        },
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [name, parent],
  );

  return handle;
}

export function useArrayItemField<V: Array<any>>(
  parent: ArrayField<V>,
  index: number,
): Field<ItemOf<V>> {
  let handle: ValueField<V> = React.useMemo(() => {
    let project = (root: FormState<any>) => {
      let prev = parent.project(root);
      let value = prev.value?.[index];
      let validation = prev.validation.children[index] ?? valid;
      return {
        value,
        validation,
        errorMessage: validation.message,
        isDirty: prev.isDirty || root.dirty.has(handle),
      };
    };

    function useValue() {
      return parent.cell.useSubscription(project);
    }

    function getValue() {
      return project(parent.cell.get());
    }

    let update = f => {
      parent.update(parent => {
        let nextParent: any = (parent ?? []).slice(0);
        let nextItem = f(nextParent[index]);
        if (nextItem == null) {
          nextParent.splice(index, 1);
        } else {
          nextParent.splice(index, 1, nextItem);
        }
        return nextParent;
      });
    };

    let setIsDirty = isDirty => {
      parent.cell.set(state => {
        let dirty = new Set(state.dirty);
        if (isDirty) {
          dirty.add(handle);
        } else {
          dirty.delete(handle);
        }
        return { ...state, dirty };
      });
    };

    return {
      type: "field",
      keypath: parent.keypath.concat([String(index)]),
      parent,
      cell: parent.cell,
      project,
      update,
      setIsDirty,
      useValue,
      getValue,
    };
  }, [index, parent]);

  return handle;
}

type ExtractRIOSValue<P, K> = $ElementType<
  $NonMaybeType<$ElementType<$NonMaybeType<P>, K>>,
  "value",
>;

export function useRIOSField<
  P: ?{ [name: string]: ?{ value: any } },
  K: $Keys<$NonMaybeType<P>>,
>(parent: Field<P>, name: K): Field<ExtractRIOSValue<P, K>> {
  let value = useField(parent, name);
  return useField(value, "value");
}

export function useRIOSArrayField<
  P: ?{ [name: string]: ?{ value: any } },
  K: $Keys<$NonMaybeType<P>>,
>(parent: Field<P>, name: K): ArrayField<ExtractRIOSValue<P, K>> {
  let value = useField(parent, name);
  return useArrayField(value, "value");
}

/**
 * Validation
 *
 * It is either an error message or or a set of error message by key (either a
 * string key (for objects) or a numeric key (for arrays).
 */
export type Validation = {|
  message: ?string,
  children: { [key: string | number]: Validation },
|};

/**
 * Represents valid state.
 */
export let valid: Validation = { message: null, children: {} };

/**
 * Summarizes validation down to a boolean value.
 */
export function isValid(validation: Validation): boolean {
  if (validation.message != null) {
    return false;
  } else {
    // eslint-disable-next-line no-unused-vars
    for (let name in validation.children) {
      if (!isValid(validation.children[name])) {
        return false;
      }
    }
    return true;
  }
}

export function validateArray<T>(
  validate: T => Validation,
): (T[]) => Validation {
  return data => {
    if (data?.length === 0) {
      data = [({}: any)];
    }
    let children = {};
    data.forEach((data, index) => {
      children[index] = validate(data);
    });
    return { message: null, children };
  };
}

/**
 * Subscribe to form value updates.
 */
export function useOnUpdate<V>(
  form: Form<V>,
  onUpdate: (Value<V>) => void,
  dependencies?: $ReadOnlyArray<mixed> = [],
) {
  let deps = [form].concat(dependencies);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  React.useEffect(() => form.subscribe(onUpdate), deps);
}
