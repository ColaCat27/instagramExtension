chrome.runtime.onInstalled.addListener(() => {
  chrome.browserAction.setBadgeText({ text: "0" });
});

chrome.storage.onChanged.addListener((changes) => {
  if (changes.posts) {
    let posts = changes.posts.newValue;
    let length = posts.length;

    chrome.browserAction.setBadgeText({ text: JSON.stringify(length) });
  }
});
