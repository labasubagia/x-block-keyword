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

function removeAffiliate() {
  const posts = document.querySelectorAll('[data-testid="cellInnerDiv"]')
  for(let post of posts) {
    if (hasAffiliateLink(post)) {
      post.style.display = "none"
    }
  }
}

window.addEventListener('scroll', removeAffiliate)
