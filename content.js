window.onload = () => {
  var linksStorage = JSON.parse(window.localStorage.getItem("posts")) || []; //Здесь наши линки чтобы начать парсить
  var savedPosts = JSON.parse(window.localStorage.getItem("savedPosts")) || [];
  var previousUrl = "";
  var observer = new MutationObserver(function (mutations) {
    let isStart = window.localStorage.getItem("start") || null;
    if (location.href !== previousUrl && isStart === null) {
      previousUrl = location.href;
      window.localStorage.removeItem("posts");
      window.localStorage.removeItem("savedPosts");
      window.localStorage.removeItem("scraperCounter");
      linksStorage = JSON.parse(window.localStorage.getItem("posts")) || []; //Здесь наши линки чтобы начать парсить
      savedPosts = JSON.parse(window.localStorage.getItem("savedPosts")) || [];

      chrome.runtime.sendMessage({
        type: "POSTS",
        postsLength: linksStorage.length,
        savedLength: savedPosts.length,
      });
    }
  });

  const config = { subtree: true, childList: true };
  observer.observe(document, config);

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // var linksStorage = JSON.parse(window.localStorage.getItem("posts")) || []; //Здесь наши линки чтобы начать парсить
  // var savedPosts = JSON.parse(window.localStorage.getItem("savedPosts")) || [];

  var isVisible = false;

  try {
    if (window.localStorage.getItem("start")) {
      let counter = parseInt(window.localStorage.getItem("scraperCounter"));
      console.log(`Номер текущего поста: ${counter + 1}`);
      if (counter < linksStorage.length) {
        getPhotos();
      }
    }
  } catch {}

  console.log("Расширение Instagram работает");

  chrome.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {
    if (msg.type == "START") {
      if (!linksStorage.length) {
        chrome.runtime.sendMessage({
          type: "NO_POSTS",
        });
      } else {
        if (!window.localStorage.getItem("start")) {
          console.log(`Расширение сохраняет посты`);
          let counter =
            JSON.parse(window.localStorage.getItem("scraperCounter")) || 0;
          let savedPosts =
            JSON.parse(window.localStorage.getItem("savedPosts")) || [];
          window.localStorage.setItem("start", true);
          window.localStorage.setItem("scraperCounter", counter);
          window.localStorage.setItem("savedPosts", JSON.stringify(savedPosts));

          chrome.runtime.sendMessage({
            type: "LOAD_URL",
            links: JSON.parse(window.localStorage.getItem("posts")),
            counter: counter,
            savedLength: savedPosts.length,
          });
        }
      }
    }
    if (msg.type == "STOP") {
      if (!window.localStorage.getItem("stop")) {
        console.log("Останавливаю расширение");
        window.localStorage.setItem("stop", true);
      }
    }

    if (msg.type == "RESULT") {
      if (!window.localStorage.getItem("now")) {
        console.log("Подготавливаю результат");
        window.localStorage.setItem("now", true);
      }
    }

    if (msg.type == "GET_COUNT") {
      chrome.runtime.sendMessage({
        type: "POSTS",
        postsLength: linksStorage.length,
        savedLength: savedPosts.length,
      });
    }
  });

  window.addEventListener("scroll", () => {
    getCount();
  });

  function getCount() {
    let links = document.querySelectorAll("a[href*=p/*]");

    for (let i = 0; i < links.length; i++) {
      if (!linksStorage.includes(links[i].href)) {
        if (
          links[i].href.includes("https://www.instagram.com/p/") &&
          !/(comments|liked_by)/.test(links[i])
        )
          linksStorage.push(links[i].href);
      }
    }

    window.localStorage.setItem("posts", JSON.stringify(linksStorage));

    chrome.runtime.sendMessage({
      type: "POSTS",
      postsLength: linksStorage.length,
      savedLength: savedPosts.length,
    });
  }

  getCount();

  var posts = [];
  function getPhotos() {
    new Promise(async (resolve, reject) => {
      let isExist = document.querySelector("button._aahi");
      let counter = 0;
      let allPhotos = document.querySelectorAll("article	img._aagt");
      let allVideos = document.querySelectorAll("article	video");
      let awaitElem = 0;

      try {
        while (
          allPhotos[0] === undefined &&
          allVideos[0] === undefined &&
          awaitElem < 40
        ) {
          awaitElem += 1;
          allPhotos = document.querySelectorAll("article	img._aagt");
          allVideos = document.querySelectorAll("article	video");
          await sleep(150);
        }
      } catch {}

      // isVisible = true;

      try {
        for (let i = 0; i < allPhotos.length; i++) {
          if (!posts.includes(allPhotos[i].src)) {
            posts.push(allPhotos[i].src);
            allPhotos[i].style.filter = "grayscale(100%)";
          }
        }
      } catch {}

      try {
        for (let i = 0; i < allVideos.length; i++) {
          if (!posts.includes(allVideos[i].src)) {
            posts.push(allVideos[i].src);
            allVideos[i].style.filter = "grayscale(100%)";
          }
        }
      } catch {}

      while (counter < 25 && !isExist) {
        counter += 1;
        // console.log("Попытка найти еще фотографии или видео: " + counter);
        // console.log("Сон 1 секунда");
        await sleep(100);
        isExist = document.querySelector("button._aahi");
      }
      if (isExist) {
        // console.log("Сохраняю фото/видео");
        resolve(isExist);
      } else {
        // console.log("На странице больше нету фото/видео");
        reject(posts);
      }
    })
      .then(async (response) => {
        await sleep(100);
        response.click();
        await sleep(200);
        await getPhotos();
      })
      .catch(async () => {
        // console.log("Фото/Видео в списке больше нету");
        // console.log(`Количество полученных фото/видео: ${photos.length}`);
        try {
          let counter =
            parseInt(window.localStorage.getItem("scraperCounter")) + 1;
          window.localStorage.setItem("scraperCounter", counter);
          let saved = JSON.parse(window.localStorage.getItem("savedPosts"));
          saved = saved.concat(posts);
          let filtered = [];
          for (let j = 0; j < saved.length; j++) {
            if (!filtered.includes(saved[j])) {
              filtered.push(saved[j]);
            }
          }
          let now = JSON.parse(window.localStorage.getItem("now"));
          let stop = JSON.parse(window.localStorage.getItem("stop"));

          window.localStorage.setItem("savedPosts", JSON.stringify(filtered));
          if (!now && !stop) {
            chrome.runtime.sendMessage({
              type: "LOAD_URL",
              links: linksStorage,
              counter: counter,
              savedLength: filtered.length,
            });
          }

          let limit = JSON.parse(window.localStorage.getItem("posts")).length;

          if (stop) {
            console.log("Расширение остановлено");
            window.localStorage.removeItem("stop");
            window.localStorage.removeItem("start");
            return;
          }

          if (counter == limit || now) {
            window.localStorage.removeItem("start");
            window.localStorage.removeItem("scraperCounter");
            window.localStorage.removeItem("posts");
            window.localStorage.removeItem("savedPosts");
            window.localStorage.removeItem("now");

            let body = document.getElementsByTagName("body")[0];

            new Promise((resolve, reject) => {
              body.innerHTML = "";
              resolve();
            }).then(() => {
              filtered.forEach((item) => {
                const p = document.createElement("p");
                p.textContent = item;
                body.append(p);
              });
            });
            // chrome.runtime.sendMessage({ type: "TASK_COMPLETE" });
          }
        } catch {}
      });
  }
};
