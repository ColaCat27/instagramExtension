function loadUrl(links, counter) {
  chrome.tabs.update({ url: links[counter] });
}

function startCollect() {
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach((tab) => {
      if (tab.active) {
        chrome.tabs.sendMessage(tab.id, { type: "START" });
      }
    });
  });
}

function stopCollect() {
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach((tab) => {
      if (tab.active) {
        chrome.tabs.sendMessage(tab.id, { type: "STOP" });
      }
    });
  });
}

document.addEventListener("DOMContentLoaded", function () {
  const getPostsButton = document.getElementById("getPosts");
  const stopCollectButton = document.getElementById("stopCollect");
  const postsLength = document.getElementById("postsLength");
  const postsSaved = document.getElementById("postsSaved");
  const extensionActive = document.getElementById("ok");
  const extensionHidden = document.getElementById("error");
  const instagramButton = document.getElementById("instagram");
  const alert = document.querySelector(".alert");

  getPostsButton.addEventListener("click", startCollect);
  instagramButton.addEventListener("click", () => {
    chrome.tabs.update({ url: "https://www.instagram.com" });
    extensionActive.classList.remove("hidden");
    extensionHidden.classList.add("hidden");
  });

  stopCollectButton.addEventListener("click", stopCollect);

  chrome.tabs.query({}, (tabs) => {
    tabs.forEach((tab) => {
      if (tab.active) {
        if (tab.url.includes("instagram.com")) {
          extensionActive.classList.remove("hidden");
          extensionHidden.classList.add("hidden");
          chrome.tabs.sendMessage(tab.id, { type: "GET_COUNT" });
        } else {
          extensionActive.classList.add("hidden");
          extensionHidden.classList.remove("hidden");
        }
      }
    });
  });

  chrome.runtime.onMessage.addListener((message, sender, senderResponse) => {
    if (message.type === "LOAD_URL") {
      if (message.counter <= message.links.length) {
        loadUrl(message.links, message.counter);
        postsSaved.textContent = message.savedLength;
      } else {
        console.log("Сбор завершен");
        //   alert.classList.remove("hidden");
        chrome.tabs.query({}, (tabs) => {
          tabs.forEach((tab) => {
            if (tab.active) {
              chrome.tabs.sendMessage(tab.id, { type: "COMPLETE" });
            }
          });
        });
      }
    }
    if (message.type === "POSTS") {
      postsLength.textContent = message.postsLength;
      postsSaved.textContent = message.savedLength;
    }
  });
});
