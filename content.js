window.onload = () => {
  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  var linksStorage = JSON.parse(window.localStorage.getItem("posts")) || []; //Здесь наши линки чтобы начать парсить

  try {
    if (window.localStorage.getItem("start")) {
      let counter = parseInt(window.localStorage.getItem("scraperCounter"));
      console.log(`Counter: ${counter}`);
      if (counter < linksStorage.length) {
        getPhotos();
      } else {
        window.localStorage.removeItem("start");
        window.localStorage.removeItem("scraperCounter");
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
        console.log(`Расширение сохраняет посты`);
        let counter = 0;
        let savedPosts = [];
        window.localStorage.setItem("start", true);
        window.localStorage.setItem("scraperCounter", counter);
        window.localStorage.setItem("savedPosts", JSON.stringify(savedPosts));

        chrome.runtime.sendMessage({
          type: "LOAD_URL",
          links: linksStorage,
          counter: counter,
        });
      }
    }
    if (msg.type == "GET_COUNT") {
      chrome.runtime.sendMessage({
        type: "POST_COUNT",
        postsLength: linksStorage.length,
      });
    }
  });

  window.addEventListener("scroll", () => {
    console.log("scrolling");
    getCount();
  });

  function getCount() {
    let links = document.querySelectorAll("a[href*=p/*]");

    for (let i = 0; i < links.length; i++) {
      if (!linksStorage.includes(links[i].href)) {
        if (links[i].href.includes("https://www.instagram.com/p/"))
          linksStorage.push(links[i].href);
      }
    }

    window.localStorage.setItem("posts", JSON.stringify(linksStorage));

    chrome.runtime.sendMessage({
      type: "POST_COUNT",
      postsLength: linksStorage.length,
    });
  }

  getCount();

  var photos = [];

  function getPhotos() {
    console.log("Get photos");
    new Promise(async (resolve, reject) => {
      let isExist = document.querySelector("button._aahi");
      let counter = 0;
      let allPhotos = document.querySelectorAll("article	img._aagt");
      let allVideos = document.querySelectorAll("article	video");

      for (let i = 0; i < allPhotos.length; i++) {
        if (!photos.includes(allPhotos[i].src)) {
          await photos.push(allPhotos[i].src);
        }
      }

      for (let i = 0; i < allVideos.length; i++) {
        if (!photos.includes(allVideos[i].src)) {
          await photos.push(allVideos[i].src);
        }
      }

      while (counter < 3 && !isExist) {
        counter += 1;
        console.log("Попытка найти переключатель фото: " + counter);
        console.log("Сон 1 секунда");
        await sleep(1000);
        isExist = document.querySelector("button._aahi");
      }
      if (isExist) {
        console.log("Переключатель найден");
        resolve(isExist);
      } else {
        console.log("Не удалось найти переключатель");
        reject(photos);
      }
    })
      .then(async (response) => {
        await sleep(500);
        response.click();

        await sleep(1000);
        await getPhotos();
      })
      .catch(async (photos) => {
        console.log("Фото в списке больше нету");
        console.log(photos);
        console.log(`Количество полученных фото: ${photos.length}`);
        let counter =
          parseInt(window.localStorage.getItem("scraperCounter")) + 1;
        window.localStorage.setItem("scraperCounter", counter);
        chrome.runtime.sendMessage({
          type: "LOAD_URL",
          links: linksStorage,
          counter: counter,
        });
      });
  }
};
