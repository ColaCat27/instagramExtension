chrome.runtime.onInstalled.addListener(() => {
  console.log("installed");
});

// chrome.runtime.onMessage.addListener((msg) => {
//   if (msg.type == "BADGE") {
//     console.log("badge");
//     chrome.browserAction.setBadgeBackgroundColor({ color: "#44C4A2" });
//     chrome.browserAction.setBadgeText({ text: msg.count });
//   }
// });
