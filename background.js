chrome.runtime.onInstalled.addListener(() => {
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach((tab) => {
      if (/^https:\/\/www.instagram.com/.test(tab.url)) {
        chrome.browserAction.setBadgeText({
          tabId: tab.id,
          text: "0",
        });
      }
    });
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Additionally, you can check for changeInfo.status
  if (/^https:\/\/www.instagram.com/.test(tab.url)) {
    chrome.browserAction.setPopup({
      tabId: tab.id, // Set the new popup for this tab.
      popup: "on_popup.html", // Open this html file within the popup.
    });
  } else {
    chrome.browserAction.setPopup({
      tabId: tab.id, // Set the new popup for this tab.
      popup: "off_popup.html", // Open this html file within the popup.
    });
  }
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
        if (/^https:\/\/www.instagram.com/.test(tab.url)) {
          chrome.browserAction.setBadgeText({
            tabId: tab.id,
            text: length,
          });
        }
      });
    });
  }
});
