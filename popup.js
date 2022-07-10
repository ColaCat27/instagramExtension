function loadUrl(links, counter) {
  chrome.tabs.update({ url: links[counter] });
}

function getResult() {
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach((tab) => {
      if (tab.active) {
        chrome.tabs.sendMessage(tab.id, { type: "RESULT" });
      }
    });
  });
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
  const download = document.getElementById("settings");
  const alert = document.querySelector(".alert");

  getPostsButton.addEventListener("click", () => {
    getPostsButton.setAttribute("disabled", "true");
    stopCollectButton.removeAttribute("disabled");
    alert.classList.add("hidden");
    startCollect();
  });

  instagramButton.addEventListener("click", () => {
    chrome.tabs.update({ url: "https://www.instagram.com" });
    extensionActive.classList.remove("hidden");
    extensionHidden.classList.add("hidden");
  });

  stopCollectButton.addEventListener("click", () => {
    alert.classList.add("hidden");
    stopCollectButton.setAttribute("disabled", "true");
    getPostsButton.removeAttribute("disabled");
    stopCollect();
  });

  download.addEventListener("click", getResult);

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
      if (message.links.length) {
        if (message.counter <= message.links.length) {
          loadUrl(message.links, message.counter);
          postsSaved.textContent = message.savedLength;
          // chrome.runtime.sendMessage({
          //   type: "BADGE",
          //   count: message.links.length,
          // });
        }
      }
    }
    if (message.type === "NO_POSTS") {
      getPostsButton.removeAttribute("disabled");
      console.log("Нету ссылок");
      alert.innerHTML = "<span>Сначал соберите ссылки на посты</span>";
      alert.classList.remove("hidden");
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
          if (tab.active) {
            chrome.tabs.sendMessage(tab.id, { type: "RESET" });
          }
        });
      });
    }
    if (message.type === "POSTS") {
      postsLength.textContent = message.postsLength;
      postsSaved.textContent = message.savedLength;

      // chrome.runtime.sendMessage({
      //   type: "BADGE",
      //   count: message.postsLength,
      // });
    }
    // if (message.type === "TASK_COMPLETE") {
    //   alert.classList.remove("hidden");
    //   chrome.tabs.query({}, (tabs) => {
    //     tabs.forEach((tab) => {
    //       if (tab.active) {
    //         chrome.tabs.sendMessage(tab.id, { type: "COMPLETE" });
    //       }
    //     });
    //   });
    // }
  });
});
