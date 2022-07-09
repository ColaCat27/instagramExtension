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
  const getPostsButton = document.getElementById("getPosts");
  const postsLength = document.getElementById("postsLength");
  const postsSaved = document.getElementById("postsSaved");
  const extensionActive = document.getElementById("ok");
  const extensionHidden = document.getElementById("error");
  const instagramButton = document.getElementById("instagram");
  // const collectError = document.querySelector(".collect__error");

  getPostsButton.addEventListener("click", clickHandler);
  instagramButton.addEventListener("click", () => {
    chrome.tabs.update({ url: "https://www.instagram.com" });
    extensionActive.classList.remove("hidden");
    extensionHidden.classList.add("hidden");
  });

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
      loadUrl(message.links, message.counter);
    }
    if (message.type === "POST_COUNT") {
      postsLength.textContent = message.postsLength;
    }
    if (message.type === "POST_SAVED") {
      postsSaved.textContent = message.postsSaved;
    }
    // if (message.type === "NO_POSTS") {
    //   collectError.classList.remove("hidden");
    // }
    if (message.type === "POSTS_EXIST") {
    }
  });
});
