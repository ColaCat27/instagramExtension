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

document.addEventListener("DOMContentLoaded", async function () {
  const getPostsButton = document.getElementById("getPosts");
  const stopCollectButton = document.getElementById("stopCollect");
  const postsLength = document.getElementById("postsLength");
  const postsSaved = document.getElementById("postsSaved");
  const extensionActive = document.getElementById("ok");
  const extensionHidden = document.getElementById("error");
  const instagramButton = document.getElementById("instagram");
  const download = document.getElementById("settings");
  let alert = document.querySelector(".alert");

  //установка актуальных значения в popup
  await getData("posts").then((posts) => {
    postsLength.textContent = posts.length;
  });

  await getData("savedPosts").then((savedPosts) => {
    postsSaved.textContent = savedPosts.length || 0;
  });

  await getData("isWorking").then((isWorking) => {
    if (isWorking) {
      getPostsButton.setAttribute("disabled", true);
      stopCollectButton.removeAttribute("disabled");
    } else {
      stopCollectButton.setAttribute("disabled", true);
      getPostsButton.removeAttribute("disabled");
    }
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

  getPostsButton.addEventListener("click", async () => {
    let isWorking = await getData("isWorking");

    let posts = await getData("posts");

    if (!isWorking) {
      let scraperCounter = (await getData("scraperCounter")) || 0;
      console.log(posts);
      if (posts.length && scraperCounter < posts.length) {
        chrome.storage.local.set({ isWorking: true });

        chrome.storage.local.set({ getNow: false });

        getPostsButton.setAttribute("disabled", "true");
        stopCollectButton.removeAttribute("disabled");
        alert.textContent = "Расширение собирает посты";
        alert.classList.remove("hidden");

        loadUrl(posts, scraperCounter);
      } else {
        alert.textContent = "Вы еще не собрали ссылки на посты";
        alert.classList.remove("hidden");
      }
    } else {
      alert.textContent = "Расширение уже собирает посты";
      alert.classList.remove("hidden");
    }
  });

  instagramButton.addEventListener("click", () => {
    chrome.tabs.update({ url: "https://www.instagram.com" });
    extensionActive.classList.remove("hidden");
    extensionHidden.classList.add("hidden");
  });

  stopCollectButton.addEventListener("click", async () => {
    let isWorking = await getData("isWorking");
    if (isWorking) {
      alert.textContent = "Останавливаю сбор постов"; //Сюда вернуть ответ о том что расширение полностью остановлено
      alert.classList.remove("hidden");
      stopCollectButton.setAttribute("disabled", "true");
      getPostsButton.removeAttribute("disabled");
      chrome.storage.local.set({ isWorking: false });
    }
  });

  // download.addEventListener("click", async () => {});

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
