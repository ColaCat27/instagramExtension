chrome.runtime.onInstalled.addListener(() => {
  console.log("installed");
});

// chrome.runtime.onMessage.addListener(function (request, sender) {
//   console.log(tabs);
//   chrome.tabs[0].url = request.url;
// });
