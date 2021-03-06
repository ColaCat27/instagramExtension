window.onload = () => {
  (async () => {
    let isResult = await getData("getNow");
    if (isResult) {
      showResult();
      return;
    }
    var innerPosts = [];

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
        // console.log(`Income data: ${data}`);
        result = data;
      } else {
        result = await getData("savedPosts");
        // console.log(`Storage data: ${result}`);
      }
      new Promise((resolve, reject) => {
        body.innerHTML = "";
        resolve();
      })
        .then(() => {
          result.forEach((item) => {
            // console.log(`Create element: ${item}`);
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
      let getNow = await getData("getNow");
      if (location.href !== previousUrl && !isWorking && !getNow) {
        previousUrl = location.href;
        console.log("reset");
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

    function getPhotos() {
      new Promise(async (resolve, reject) => {
        let isExist = document.querySelector("button._aahi");
        let video = document.querySelectorAll("article video");
        let photo = document.querySelectorAll("article	img._aagt");

        try {
          if (innerPosts.length < 1) {
            while (!video && !photo) {
              await new Promise((r) => setTimeout(r, 100));
              video = document.querySelectorAll("article video");
              photo = document.querySelectorAll("article	img._aagt");
            }

            if (video) {
              let counter = 0;
              while (!video[0] && counter < 350) {
                video = document.querySelectorAll("article video");
                counter += 1;
                await new Promise((r) => setTimeout(r, 10));
              }
            }

            if (photo) {
              let counter = 0;
              while (!photo[0] && counter < 350) {
                photo = document.querySelectorAll("article	img._aagt");
                counter += 1;
                await new Promise((r) => setTimeout(r, 10));
              }
            }

            if (video[0]) {
              let counter = 0;
              while (!video[0].src && counter < 50) {
                counter += 1;
                await new Promise((r) => setTimeout(r, 10));
              }
            }

            if (photo[0]) {
              let counter = 0;
              while (!photo[0].src && counter < 50) {
                counter += 1;
                await new Promise((r) => setTimeout(r, 10));
              }
            }
          } else {
            await new Promise((r) => setTimeout(r, 150));
          }

          for (let i = 0; i < photo.length; i++) {
            if (photo[i].src) {
              if (!innerPosts.includes(photo[i].src)) {
                innerPosts.push(photo[i].src);
                photo[i].style.filter = "grayscale(100%)";
              }
            }
          }

          for (let i = 0; i < video.length; i++) {
            if (video[i].src) {
              if (!innerPosts.includes(video[i].src)) {
                video[i].play();
                await sleep(200);
                innerPosts.push(video[i].src);
                video[i].style.filter = "grayscale(100%)";
              }
            }
          }
        } catch {}

        let counter = 0;
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
          reject();
        }
      })
        .then(async (response) => {
          await sleep(100);
          response.click();
          await sleep(200);
          getPhotos();
        })
        .catch(async () => {
          // console.log("Фото/Видео в списке больше нету");
          // console.log(`Количество полученных фото/видео: ${photos.length}`);
          try {
            let scraperCounter = await getData("scraperCounter");
            scraperCounter += 1;
            chrome.storage.local.set({
              scraperCounter: scraperCounter,
            });
            let savedPosts = await getData("savedPosts");
            savedPosts = savedPosts.concat(innerPosts);

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
