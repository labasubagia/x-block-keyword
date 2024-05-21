const keywords = ['shope', 'tokopedia'];


function hasAffiliateLink(element) {
  const textContent = element.textContent.toLowerCase();
  for (const keyword of keywords) {
    if (textContent.includes(keyword)) {
      console.log(`${keyword} found ${textContent}`);
      return true;
    }
  }

  const children = element.children;
  for (const child of children) {
    if (hasAffiliateLink(child)) {
      return true;
    }
  }
  return false;
}


const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type === 'childList') {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {   
          const isPost = node.getAttribute('data-testid') === 'cellInnerDiv'       
          if (isPost && hasAffiliateLink(node)) {
            node.style.display = 'none';
          }
        }
      });
    }
  });
});

observer.observe(document.body, { childList: true, subtree: true });

function disconnectObserver() {
  observer.disconnect();
}
