if (typeof browser == 'undefined') {
  globalThis.browser = chrome;
}

const defaultConfig = {
  verbose: false,
  isActive: true,
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
  _rgxBlocked: undefined, // default
};

const DB_KEY_CONFIG = 'config';

const requiredPermissions = {
  origins: ['https://x.com/*'],
  permissions: ['storage'],
};

// On install
browser?.runtime?.onInstalled?.addListener(async () => {
  // Request host permissions
  const hasPermissions = await browser?.permissions?.contains(requiredPermissions);
  if (!hasPermissions) browser?.permissions?.request(requiredPermissions);

  // Set default config upon install
  const storageResult = await browser?.storage?.sync?.get(DB_KEY_CONFIG);
  if (!storageResult?.hasOwnProperty(DB_KEY_CONFIG)) {
    browser?.storage?.sync?.set({ [DB_KEY_CONFIG]: defaultConfig });
  }
});
