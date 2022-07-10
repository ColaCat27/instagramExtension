function getData(sKey) {
  return new Promise(function (resolve, reject) {
    chrome.storage.local.get(sKey, function (items) {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError.message);
        reject(chrome.runtime.lastError.message);
      } else {
        resolve(items[sKey]);
      }
    });
  });
}

function loadUrl(links, counter) {
  chrome.tabs.update({ url: links[counter] });
}

function getResult() {}

async function startCollect() {
  let isWorking = await getData("isWorking");
  let posts = await getData("posts");
  // if (!isWorking) {
  //   alert.textContent = "Расширение работает";
  //   alert.classLis.remove("alert_error");
  //   alert.classLis.add("alert_ok");
  //   alert.remove("hidden");

  //   let scraperCounter = (await getData("scraperCounter")) || 0;

  //   let posts = await getData("posts");

  //   let savedPosts = (await getData("savedPosts")) || [];

  //   chrome.storage.local.set({ isWorking: true });

  //   chrome.storage.local.set({ getNow: false });

  //   if (posts.length && posts.length < scraperCounter) {
  //   } else {
  //     getPostsButton.removeAttribute("disabled");

  //     if (posts.length >= scraperCounter) {
  //       alert.textContent = "Все ссылки собраны";
  //     } else {
  //       alert.textContent = "Сначала соберите ссылки на посты";
  //     }

  //     alert.classList.remove("hidden");
  //     alert.classList.remove("alert_ok");
  //     alert.classList.add("alert_error");
  //   }

  //   loadUrl(posts, scraperCounter);
  // }
}

function stopCollect() {
  if (window.runtime.session.get("isWorking")) {
    chrome.storage.local.set("isWorking", false);
  }
}

document.addEventListener("DOMContentLoaded", async function () {
  const getPostsButton = document.getElementById("getPosts");
  const stopCollectButton = document.getElementById("stopCollect");
  const postsLength = document.getElementById("postsLength");
  const postsSaved = document.getElementById("postsSaved");
  const extensionActive = document.getElementById("ok");
  const extensionHidden = document.getElementById("error");
  const instagramButton = document.getElementById("instagram");
  const download = document.getElementById("settings");
  const alert = document.querySelector(".alert");

  //установка актуальных значения в popup
  await getData("posts").then((posts) => {
    postsLength.textContent = posts.length;
  });

  await getData("savedPosts").then((savedPosts) => {
    postsSaved.textContent = savedPosts.length || 0;
  });

  chrome.storage.onChanged.addListener(function (changes, namespace) {
    if (changes.posts) {
      postsLength.textContent = changes.posts.newValue.length; //установка актуального значения для количества собранных постов
    }
    if (changes.savedPosts) {
      postsSaved.textContent = changes.savedPosts.newValue.length; //установка актуального значения для сохраненных внутренних постов
    }
  });

  //----------------------------------------

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
    alert.textContent = "Останавливаю сбор постов, подождите немного"; //Сюда вернуть ответ о том что расширение полностью остановлено
    alert.classList.remove("hidden");
    alert.classList.remove("alert_error");
    alert.classList.add("alert_ok");
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
});
