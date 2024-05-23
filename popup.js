if (typeof browser == 'undefined') {
  globalThis.browser = chrome;
}

const DB_KEY_CONFIG = 'config';
const DB_KEY_BLOCKED_COUNT = 'blockedCount';
const numberFormatter = Intl.NumberFormat('en', { notation: 'compact' });

async function getConfig() {
  const db = await browser?.storage?.sync?.get(DB_KEY_CONFIG);
  const config = db?.[DB_KEY_CONFIG];
  return config;
}

async function setConfig(config) {
  const prevConfig = await getConfig();
  return browser?.storage?.sync?.set({ [DB_KEY_CONFIG]: { ...prevConfig, ...config } });
}

const blockedCountDOM = document.querySelector('#blockedCount');

const checkboxActiveDOM = document.querySelector('#isActive');
const checkboxBlockAdDOM = document.querySelector('#isBlockAd');
const checkboxVerboseDOM = document.querySelector('#verbose');
const addKeywordFormDOM = document.querySelector('#newKeywordForm');

async function loadBlockedCount(blockedCount = null) {
  if (blockedCount == null) {
    const db = await browser?.storage?.sync?.get(DB_KEY_BLOCKED_COUNT);
    blockedCount = db?.[DB_KEY_BLOCKED_COUNT] ?? 0;
  }
  const formattedBlockedCount = blockedCount >= 10_000 ? numberFormatter.format(blockedCount) : blockedCount;
  blockedCountDOM.innerHTML = formattedBlockedCount;
}

function setCheckboxActiveDOM(isActive) {
  checkboxActiveDOM.checked = isActive;
  document.querySelector('#childConfig').style.display = isActive ? 'block' : 'none';
}

function loadListKeywords(keywords) {
  const containerDOM = document.querySelector('#keywordContainer');
  containerDOM.innerHTML = keywords.reduce((html, keyword, index) => {
    html += `
      <div class="keyword bg-white rounded-lg flex justify-between items-center p-1 px-3 gap-2">
        <span>${keyword}</span> 
        <button type="button" class="deleteBtn rounded text-red-500 text-lg font-bold">ⓧ</button>
      </div>
    `;
    return html;
  }, '');
  containerDOM.querySelectorAll('.deleteBtn').forEach((btn, index) => {
    btn.addEventListener('click', async () => removeKeyword(index));
  });
  containerDOM.scroll({ top: containerDOM.scrollHeight, behavior: 'smooth' });
}

async function removeKeyword(index) {
  const { blockedKeywords } = await getConfig();
  blockedKeywords?.splice(index, 1);
  await setConfig({ blockedKeywords });
  loadListKeywords(blockedKeywords);
}

async function addKeyword(keyword) {
  const { blockedKeywords } = await getConfig();
  blockedKeywords?.push(keyword);
  await setConfig({ blockedKeywords });
  loadListKeywords(blockedKeywords);
}

checkboxActiveDOM.addEventListener('change', async (event) => {
  const isActive = event?.target?.checked;
  await setConfig({ isActive });
  setCheckboxActiveDOM(isActive);
});

checkboxVerboseDOM.addEventListener('change', async (event) => {
  await setConfig({ verbose: event?.target?.checked });
});

checkboxBlockAdDOM.addEventListener('change', async (event) => {
  await setConfig({ isBlockAd: event?.target?.checked });
});

addKeywordFormDOM.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(event.target);
  const keyword = formData.get('keyword').trim();
  if (!keyword) return;
  await addKeyword(keyword);
  addKeywordFormDOM.reset();
});

browser?.storage?.onChanged?.addListener((changes, area) => {
  if (area != 'sync') return;
  const blockedCount = changes?.[DB_KEY_BLOCKED_COUNT]?.newValue;
  if (blockedCount == null) return;
  loadBlockedCount(blockedCount);
});

document.addEventListener('DOMContentLoaded', async () => {
  loadBlockedCount();

  const { isActive, isBlockAd, verbose, blockedKeywords } = await getConfig();
  setCheckboxActiveDOM(isActive);
  loadListKeywords(blockedKeywords);
  checkboxVerboseDOM.checked = verbose;
  checkboxBlockAdDOM.checked = isBlockAd;
});
