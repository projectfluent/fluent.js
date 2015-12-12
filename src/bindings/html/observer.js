'use strict';

import { translateFragment } from './dom';

const observerConfig = {
  attributes: true,
  characterData: false,
  childList: true,
  subtree: true,
  attributeFilter: ['data-l10n-id', 'data-l10n-args']
};

const observers = new WeakMap();

export function initMutationObserver(view, onMutations) {
  observers.set(view, {
    roots: new Set(),
    observer: new MutationObserver(
      mutations => onMutations(view, mutations)),
  });
}

export function translateRoots(view, langs) {
  return Promise.all(
    [...observers.get(view).roots].map(
      root => translateFragment(view, langs, root)));
}

export function observe(view, root) {
  const obs = observers.get(view);
  if (obs) {
    obs.roots.add(root);
    obs.observer.observe(root, observerConfig);
  }
}

export function disconnect(view, root, allRoots) {
  const obs = observers.get(view);
  if (obs) {
    obs.observer.disconnect();
    if (allRoots) {
      return;
    }
    obs.roots.delete(root);
    obs.roots.forEach(
      other => obs.observer.observe(other, observerConfig));
  }
}

export function reconnect(view) {
  const obs = observers.get(view);
  if (obs) {
    obs.roots.forEach(
      root => obs.observer.observe(root, observerConfig));
  }
}
