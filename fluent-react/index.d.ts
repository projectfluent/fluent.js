// vim: set ts=2 sw=2
import * as fluent from 'fluent';
import * as React from 'react';

export declare interface LocalizedProps {
  getString(id: string, args?: object, fallback?: string): string;
}

export declare type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

export declare function withLocalization<P extends LocalizedProps>(
  WrappedComponent: React.ComponentType<P>): React.ComponentType<Omit<P, keyof LocalizedProps>>;

export declare function isReactLocalization(props: object, propName: string): Error | null;

export declare interface LocalizationProviderProps {
  bundles: Iterable<fluent.FluentBundle>
  parseMarkup?: (str: string) => Array<Node & ChildNode>
  children?: React.ReactNode
}

/*
 * `ReactLocalization` handles translation formatting and fallback.
 *
 * The current negotiated fallback chain of languages is stored in the
 * `ReactLocalization` instance in form of an iterable of `FluentBundle`
 * instances.  This iterable is used to find the best existing translation for
 * a given identifier.
 *
 * `Localized` components must subscribe to the changes of the
 * `ReactLocalization`'s fallback chain.  When the fallback chain changes (the
 * `bundles` iterable is set anew), all subscribed compontent must relocalize.
 *
 * The `ReactLocalization` class instances are exposed to `Localized` elements
 * via the `LocalizationProvider` component.
 */
export declare class ReactLocalization {
  constructor(bundles: Iterable<fluent.FluentBundle>);

  /*
   * Subscribe a `Localized` component to changes of `bundles`.
   */
  public subscribe(component: React.Component): void;

  /*
   * Unsubscribe a `Localized` component from `bundles` changes.
   */
  public unsubscribe(component: React.Component): void;

  /*
   * Set a new `bundles` iterable and trigger the retranslation.
   */
  public setBundles(bundles: Iterable<fluent.FluentBundle>): void;
  
  public getBundle(id: string): fluent.FluentBundle;
  
  public formatCompound(mcx: fluent.FluentBundle, msg: string, args?: object): {
      value: string,
      attrs?: object
  };
  
  /*
   * Find a translation by `id` and format it to a string using `args`.
   */
  public getString(id: string, args?: object, fallback?: string): string;
}

export declare interface ChildContextType {
    l10n: ReactLocalization
    parseMarkup?: (str: string) => NodeListOf<Node & ChildNode>
}

export declare class LocalizationProvider extends React.Component<LocalizationProviderProps> {
    public static childContextTypes: ChildContextType;
    constructor(props: LocalizationProviderProps);
    public getChildContext(): ChildContextType;
    public componentWillReceiveProps(next: LocalizationProviderProps): void;
    public render(): React.ReactNode;
}

export declare interface LocalizedComponentProps {
    id: string;
    children?: React.ReactNode;
}

// This needs to be `any` rather than LocalizedComponentProps because
// external arguments used during translation are passed as props
// starting with a $ symbol, e.g.
//   <Localized id="hello-world" $username={name}>
//     <p>{'Hello, { $username }!'}</p>
//   </Localized>
export declare class Localized extends React.Component<any> {
    public componentDidMount(): void;
    public componentWillUnmount(): void;

    /**
     * Rerender this component in a new language.
     */
    public relocalize(): void;
    public render(): React.ReactNode;
}

export function createParseMarkup(): (str: string) => Array<Node & ChildNode>;
