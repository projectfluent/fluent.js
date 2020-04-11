import { useContext } from "react";
import { FluentContext } from "./context";
import { ReactLocalization } from "./localization";
import { FluentArgument, FluentBundle } from "@fluent/bundle";

type Message = Exclude<ReturnType<FluentBundle["getMessage"]>, undefined>

// Using ReactLocalization and a id, return its bundle and message object
// if both exists, otherwise return null for boths
type getBundleAndMessage = (
  (l10n: ReactLocalization, id: string) =>
  ({ bundle: FluentBundle; msg: Message } | { bundle: null; msg: null })
)
const getBundleAndMessage: getBundleAndMessage = (l10n, id) => {
  const bundle = l10n.getBundle(id);
  const msg = bundle?.getMessage(id);

  if (bundle === null || msg === undefined) {
    return { bundle: null, msg: null };
  }

  return { bundle, msg };
};

type TFunction = (id: string, vars?: Record<string, FluentArgument>) => string
type TAttributesFunction = (
  (id: string, vars?: Record<string, FluentArgument>) =>
  { [key in string]: string }
)

type useTranslate = () => { t: TFunction; tAttributes: TAttributesFunction }

/*
 * The `useTranslate` hook uses the FluentContext to return two functions
 * to get the translated messages from Fluent's bundle:
 * - t: get the root message from the given id
 * - tAttributes: get the attributes message from the given id
 */
export const useTranslate: useTranslate = () => {
  const l10n = useContext(FluentContext);

  if (!l10n) {
    // Return fallbacks functions
    const t: TFunction = () => "";
    const tAttributes: TAttributesFunction = () => ({});

    return { t, tAttributes };
  }

  const t: TFunction = (id, vars) => {
    const { bundle, msg } = getBundleAndMessage(l10n, id);

    if (bundle === null || msg === null) {
      // Return as fallback an empty string.
      return "";
    }

    // Format the message and return that
    const errors: Array<Error> = [];
    const msgValue = msg.value || "";
    const messageFormatted = bundle.formatPattern(msgValue, vars, errors);

    errors.forEach(error => l10n.reportError(error));

    return messageFormatted;
  };

  const tAttributes: TAttributesFunction = (id, vars) => {
    const { bundle, msg } = getBundleAndMessage(l10n, id);

    if (bundle === null || msg === null) {
      // Return as fallback an empty object.
      return {};
    }

    // Format all atributes and return that
    const errors: Array<Error> = [];
    const messagesFormatted = Object
      .keys(msg.attributes)
      .reduce(
        (acc, key) => {
          acc[key] = bundle.formatPattern(msg.attributes[key], vars, errors);
          return acc;
        },
        {} as { [key in string]: string }
      );

    errors.forEach(error => l10n.reportError(error));

    return messagesFormatted;
  };

  return { t, tAttributes };
};

export default useTranslate;
