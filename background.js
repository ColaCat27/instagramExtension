chrome.runtime.onInstalled.addListener(() => {
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach((tab) => {
      if (tab.url.includes("www.instagram.com")) {
        chrome.browserAction.setBadgeText({
          tabId: tab.id,
          text: "0",
        });
      }
    });
  });
});

chrome.storage.onChanged.addListener((changes) => {
  if (changes.posts) {
    let posts = changes.posts.newValue;
    let length = posts.length;
    if (length > 99) {
      length = "99+";
    } else {
      length = JSON.stringify(length);
    }

    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        if (tab.url.includes("www.instagram.com")) {
          chrome.browserAction.setBadgeText({
            tabId: tab.id,
            text: length,
          });
        }
      });
    });
  }
});
