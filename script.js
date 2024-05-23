const defaultConfig = {
  verbose: true,
  isBlockAd: true,
  isRestartAfterConfigChanged: false,
  blockedKeywords: [
    // shopee
    'shope',
    'shoope',

    // tokopedia
    'tokopedia',

    // other keywords
    'vcs',
  ],

  // dependent to data above
  _regExp: undefined, // default
};

// TODO: Change all localStorage chrome extensions storage
let config = localStorage.getItem('BLOCKER_CONFIG');
config = config ? JSON.parse(config) : defaultConfig;

class Blocker {
  static DB_BLOCKED_COUNT = 'BLOCKER_BLOCKED_COUNT';

  static EVENT_POST_BLOCKED = 'BLOCKER_POST_BLOCKED';
  static EVENT_CONFIG_CHANGED = 'BLOCKER_CONFIG_CHANGED';

  #config;
  #domObserver;
  #eventBroker;

  constructor({ config = defaultConfig, eventBroker = new EventTarget() }) {
    this.#config = config;
    this.#iniConfig();
    this.#initEventBroker(eventBroker);
    this.start();
  }

  #initEventBroker(eventBlocker) {
    this.#eventBroker = eventBlocker;

    this.#eventBroker?.addEventListener(
      Blocker.EVENT_CONFIG_CHANGED,
      async (event) => {
        this.#log('blocker config changed');

        // TODO: will think this
        localStorage.setItem(
          'BLOCKER_CONFIG',
          JSON.stringify(event?.detail?.config),
        );

        if (!this.#config?.isRestartAfterConfigChanged) return;
        this.restart();
      },
    );

    this.#eventBroker?.addEventListener(
      Blocker.EVENT_POST_BLOCKED,
      async (event) => {
        // TODO: will think this
        const blockedCount =
          Number(localStorage.getItem(Blocker.DB_BLOCKED_COUNT) ?? 0) + 1;
        localStorage.setItem(Blocker.DB_BLOCKED_COUNT, String(blockedCount));

        // TODO: fix browser action, related to manifest.json
        // const formatted = Intl.NumberFormat('en', { notation: 'compact' }).format(blockedCount)
        // chrome.browserAction.setBadgeText({ details: { text: formatted }});
      },
    );
  }

  getConfig() {
    return this.#config;
  }

  setConfig(config) {
    this.#iniConfig(config);
    this.#eventBroker?.dispatchEvent(
      new CustomEvent(Blocker.EVENT_CONFIG_CHANGED, {
        detail: { config: this.#config },
      }),
    );
  }

  #iniConfig(config) {
    this.#config = { ...this.#config, ...config };
    this.#config._regExp = new RegExp(
      (this.#config?.blockedKeywords ?? []).join('|'),
      'i',
    );
  }

  restart() {
    this.#log('blocker observer restart...');
    this.stop();
    this.start();
    this.#log('blocker observer restarted');
  }

  start() {
    if (this.#isRunning()) return;
    this.#domObserver = new MutationObserver((mutations) =>
      this.#mutationObserverCallback(mutations),
    );
    this.#domObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
    this.#log('blocker observer started');
  }

  stop() {
    if (!this.#isRunning()) return;
    this.#domObserver.disconnect();
    this.#domObserver = null;
    this.#log('blocker observer stopped');
  }

  #isRunning() {
    return !!this.#domObserver;
  }

  #mutationObserverCallback(mutations) {
    if (this.#config.blockedKeywords.length === 0) return;

    for (let mutation of mutations) {
      if (mutation.type !== 'childList') continue;

      for (let node of mutation.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue;
        if (!this.#isPostBlocked(node)) continue;

        // for now, set display to none
        // last time, removing node break the website
        node.style.display = 'none';
        this.#eventBroker?.dispatchEvent(
          new CustomEvent(Blocker.EVENT_POST_BLOCKED),
        );
      }
    }
  }

  #isPostBlocked(element) {
    return this.#isPost(element) && this.#hasBlockedElement(element);
  }

  #isPost(element) {
    return element.getAttribute('data-testid') === 'cellInnerDiv';
  }

  #hasBlockedElement({ textContent, children }) {
    // ads
    if (this.#config?.isBlockAd && textContent === 'Ad') {
      this.#log('blocked ad');
      return true;
    }

    // blocked keywords
    if (this.#config?._regExp.test(textContent)) {
      this.#log('blocked keyword:', textContent);
      return true;
    }

    // find it inside the children
    for (const child of children) {
      if (!this.#hasBlockedElement(child)) continue;
      return true;
    }

    return false;
  }

  #log(...data) {
    if (!this.#config?.verbose) return;
    console.log(...data);
  }
}

const eventBroker = new EventTarget();
// eventBroker.addEventListener(Blocker.EVENT_CONFIG_CHANGED, (event) => {
//   console.log('example another listener', event?.detail?.config);
// })

const blocker = new Blocker({ config, eventBroker });

// eventBroker.dispatchEvent(new CustomEvent(Blocker.EVENT_CONFIG_CHANGED, { detail: { config: blocker.getConfig() }}));
