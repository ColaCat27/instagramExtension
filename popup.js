function loadUrl(links, counter) {
  chrome.tabs.update({ url: links[counter] });
}

function clickHandler(e) {
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach((tab) => {
      if (tab.active) {
        chrome.tabs.sendMessage(tab.id, { type: "START" });
      }
    });
  });
  // chrome.tabs.forEach((tab) => {
  //   chrome.tab.sendMessage({ type: "START" });
  // });
}

document.addEventListener("DOMContentLoaded", function () {
  // document.getElementById("click-me").addEventListener("click", clickHandler);

  chrome.runtime.onMessage.addListener((message, sender, senderResponse) => {
    if (message.type === "LOAD_URL") {
      loadUrl(message.links, message.counter);
    }
  });
});
