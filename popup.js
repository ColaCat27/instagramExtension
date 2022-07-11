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
  const download = document.getElementById("settings");
  let alert = document.querySelector(".alert");

  try {
    const instagramButton = document.getElementById("instagram");

    if (instagramButton) {
      instagramButton.addEventListener("click", () => {
        chrome.tabs.update({ url: "https://www.instagram.com" });
      });
    }

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
  } catch {}
  //установка актуальных значения в popup

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
      if (posts.length && scraperCounter < posts.length) {
        chrome.storage.local.set({ isWorking: true, getNow: false });

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

  stopCollectButton.addEventListener("click", async () => {
    let isWorking = await getData("isWorking");
    if (isWorking) {
      alert.textContent = "Останавливаю сбор постов"; //Сюда вернуть ответ о том что расширение полностью остановлено
      alert.classList.remove("hidden");
      stopCollectButton.setAttribute("disabled", "true");
      getPostsButton.removeAttribute("disabled");
      chrome.storage.local.set({
        isWorking: false,
        getNow: false,
        savedPosts: [],
        posts: [],
      });
    }
  });

  download.addEventListener("click", async () => {
    let savedPosts = await getData("savedPosts");
    if (savedPosts) {
      chrome.storage.local.set({
        isWorking: false,
        posts: [],
        scraperCounter: 0,
        getNow: true,
      });
      postsSaved.textContent = "0";
      alert.textContent = "Сохраняю результат";
      if (alert.classList.contains("hidden")) {
        alert.classList.remove("hidden");
      }
    }
  });
});
