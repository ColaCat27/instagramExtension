window.onload = () => {
  (async () => {
    let isResult = await getData("getNow");
    if (isResult) {
      showResult();
      return;
    }
    //фукнция для получения значений из нашего storage
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

    async function showResult(data = false) {
      let body = document.getElementsByTagName("body")[0];
      let result;
      if (data) {
        console.log(`Income data: ${data}`);
        result = data;
      } else {
        result = await getData("savedPosts");
        console.log(`Storage data: ${result}`);
      }
      new Promise((resolve, reject) => {
        body.innerHTML = "";
        resolve();
      })
        .then(() => {
          result.forEach((item) => {
            console.log(`Create element: ${item}`);
            const p = document.createElement("p");
            p.textContent = item;
            body.append(p);
          });
        })
        .then(() => {
          chrome.storage.local.set({ savedPosts: [], getNow: false });
        });
    }

    function reset() {
      chrome.storage.local.set({ posts: [] });
      chrome.storage.local.set({ savedPosts: [] });
      chrome.storage.local.set({ scraperCounter: 0 });
    }

    function sleep(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }

    //obeserver для сброса значений при переходе на другую страницу
    var previousUrl = "";

    let isWorking = await getData("isWorking");
    var scraperCounter = parseInt(await getData("scraperCounter"));

    var observer = new MutationObserver(async function (mutations) {
      isWorking = await getData("isWorking");

      if (location.href !== previousUrl && !isWorking) {
        previousUrl = location.href;
        reset(); //обнуляем значения в storage
      }
    });

    const config = { subtree: true, childList: true };
    observer.observe(document, config);

    if (!isWorking) {
      console.log("Расширение Instagram работает");
    }

    try {
      if (isWorking) {
        let posts = await getData("posts");
        console.log(`Номер текущего поста: ${scraperCounter + 1}`);
        if (scraperCounter < posts.length) {
          getPhotos();
        }
      }
    } catch {}

    window.addEventListener("scroll", () => {
      getCount();
    });

    async function getCount() {
      let links = document.querySelectorAll("a[href*=p/*]");
      let posts = await getData("posts");
      for (let i = 0; i < links.length; i++) {
        if (!posts.includes(links[i].href)) {
          if (
            links[i].href.includes("https://www.instagram.com/p/") &&
            !/(comments|liked_by)/.test(links[i])
          ) {
            posts.push(links[i].href);
            chrome.storage.local.set({ posts: posts });
          }
        }
      }
    }

    var innerPosts = [];

    function getPhotos() {
      new Promise(async (resolve, reject) => {
        let isExist = document.querySelector("button._aahi"),
          counter = 0,
          allPhotos = document.querySelectorAll("article	img._aagt"),
          allVideos = document.querySelectorAll("article	video"),
          awaitElem = 0;

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

        try {
          for (let i = 0; i < allPhotos.length; i++) {
            if (!innerPosts.includes(allPhotos[i].src)) {
              innerPosts.push(allPhotos[i].src);
              allPhotos[i].style.filter = "grayscale(100%)";
            }
          }
        } catch {}

        try {
          for (let i = 0; i < allVideos.length; i++) {
            if (!innerPosts.includes(allVideos[i].src)) {
              innerPosts.push(allVideos[i].src);
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
          reject(innerPosts);
        }
      })
        .then(async (response) => {
          await sleep(100);
          response.click();
          await sleep(200);
          await getPhotos();
        })
        .catch(async (inPos) => {
          // console.log("Фото/Видео в списке больше нету");
          // console.log(`Количество полученных фото/видео: ${photos.length}`);
          try {
            let scraperCounter = await getData("scraperCounter");
            scraperCounter += 1;
            chrome.storage.local.set({
              scraperCounter: scraperCounter,
            });
            console.log(`inPos: ${inPos}`);
            let savedPosts = await getData("savedPosts");
            savedPosts = savedPosts.concat(inPos);
            console.log(`Saved posts: ${savedPosts}`);

            let filtered = [];
            for (let j = 0; j < savedPosts.length; j++) {
              if (!filtered.includes(savedPosts[j])) {
                filtered.push(savedPosts[j]);
              }
            }

            chrome.storage.local.set({
              savedPosts: filtered,
            });

            let posts = await getData("posts");
            let getNow = await getData("getNow");

            if (scraperCounter < posts.length) {
              window.location.href = posts[scraperCounter];
            } else {
              if (isWorking || getNow) {
                console.log(`Data for save: ${filtered}`);
                showResult(filtered);
                chrome.storage.local.set({
                  isWorking: false,
                  posts: [],
                  scraperCounter: 0,
                  getNow: false,
                });
                return;
              }
            }
          } catch {}
        });
    }
  })();
};
