import { translateFragment, translateMutations } from './dom';

const observerConfig = {
  attributes: true,
  characterData: false,
  childList: true,
  subtree: true,
  attributeFilter: ['data-l10n-id', 'data-l10n-args']
};

const observers = new WeakMap();

export function initMutationObserver(view) {
  observers.set(view, {
    roots: new Set(),
    observer: new MutationObserver(
      mutations => translateMutations(view, mutations)),
  });
}

export function translateRoots(view) {
  const roots = Array.from(observers.get(view).roots);
  return Promise.all(roots.map(
      root => translateFragment(view, root)));
}

export function observe(view, root) {
  const obs = observers.get(view);
  if (obs) {
    obs.roots.add(root);
    obs.observer.observe(root, observerConfig);
  }
}

export function disconnect(view, root) {
  const obs = observers.get(view);
  if (obs) {
    obs.observer.disconnect();
    obs.roots.delete(root);
    obs.roots.forEach(
      other => obs.observer.observe(other, observerConfig)
    );
  }
}

export function pause(view) {
  const obs = observers.get(view);
  if (obs) {
    obs.observer.disconnect();
  }
}

export function resume(view) {
  const obs = observers.get(view);
  if (obs) {
    obs.roots.forEach(
      root => obs.observer.observe(root, observerConfig));
  }
}
