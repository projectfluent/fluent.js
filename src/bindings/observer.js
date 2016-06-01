import { translateMutations } from './dom';

const observerConfig = {
  attributes: true,
  characterData: false,
  childList: true,
  subtree: true,
  attributeFilter: ['data-l10n-id', 'data-l10n-args']
};

export class LocalizationObserver {
  constructor() {
    this.roots = new Set();
    this.observer = new MutationObserver(
      mutations => translateMutations(this, mutations)
    );
  }

  observeRoot(root) {
    this.roots.add(root);
    this.observer.observe(root, observerConfig);
  }

  disconnectRoot(root) {
    this.pause();
    this.roots.delete(root);
    this.resume();
  }

  pause() {
    this.observer.disconnect();
  }

  resume() {
    this.roots.forEach(
      root => this.observer.observe(root, observerConfig)
    );
  }
}
