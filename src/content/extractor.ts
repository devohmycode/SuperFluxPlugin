// Content script: extracts page metadata and responds to messages from popup/background

function getMetaContent(selectors: string[]): string {
  for (const selector of selectors) {
    const el = document.querySelector(selector);
    if (el) {
      const content = el.getAttribute('content') || el.textContent;
      if (content?.trim()) return content.trim();
    }
  }
  return '';
}

function extractMetadata() {
  const title = getMetaContent([
    'meta[property="og:title"]',
    'meta[name="twitter:title"]',
  ]) || document.title || '';

  const description = getMetaContent([
    'meta[property="og:description"]',
    'meta[name="twitter:description"]',
    'meta[name="description"]',
  ]);

  const image = getMetaContent([
    'meta[property="og:image"]',
    'meta[name="twitter:image"]',
    'meta[name="twitter:image:src"]',
  ]);

  const favicon = (() => {
    const link = document.querySelector<HTMLLinkElement>(
      'link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]'
    );
    if (link?.href) return link.href;
    return `${window.location.origin}/favicon.ico`;
  })();

  const author = getMetaContent([
    'meta[name="author"]',
    'meta[property="article:author"]',
    'meta[name="twitter:creator"]',
  ]);

  const publishedAt = getMetaContent([
    'meta[property="article:published_time"]',
    'meta[name="date"]',
    'meta[name="publish_date"]',
  ]);

  return {
    url: window.location.href,
    title,
    description,
    image,
    favicon,
    author,
    publishedAt,
  };
}

// Listen for messages from popup or background
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'EXTRACT_METADATA') {
    sendResponse(extractMetadata());
    return true;
  }
});
