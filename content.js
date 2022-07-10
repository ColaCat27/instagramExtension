window.onload = async () => {
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

  // chrome.storage.local.set({ posts: [] });

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

  var isVisible = false;

  if (!isWorking) {
    console.log("Расширение Instagram работает");
  }

  try {
    if (isWorking) {
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

  getCount();

  var innerPosts = [];

  // function getPhotos() {
  //   new Promise(async (resolve, reject) => {
  //     let isExist = document.querySelector("button._aahi");
  //     let counter = 0;
  //     let allPhotos = document.querySelectorAll("article	img._aagt");
  //     let allVideos = document.querySelectorAll("article	video");
  //     let awaitElem = 0;

  //     try {
  //       while (
  //         allPhotos[0] === undefined &&
  //         allVideos[0] === undefined &&
  //         awaitElem < 40
  //       ) {
  //         awaitElem += 1;
  //         allPhotos = document.querySelectorAll("article	img._aagt");
  //         allVideos = document.querySelectorAll("article	video");
  //         await sleep(150);
  //       }
  //     } catch {}

  //     // isVisible = true;

  //     try {
  //       for (let i = 0; i < allPhotos.length; i++) {
  //         if (!innerPosts.includes(allPhotos[i].src)) {
  //           innerPosts.push(allPhotos[i].src);
  //           allPhotos[i].style.filter = "grayscale(100%)";
  //         }
  //       }
  //     } catch {}

  //     try {
  //       for (let i = 0; i < allVideos.length; i++) {
  //         if (!innerPosts.includes(allVideos[i].src)) {
  //           innerPosts.push(allVideos[i].src);
  //           allVideos[i].style.filter = "grayscale(100%)";
  //         }
  //       }
  //     } catch {}

  //     while (counter < 25 && !isExist) {
  //       counter += 1;
  //       // console.log("Попытка найти еще фотографии или видео: " + counter);
  //       // console.log("Сон 1 секунда");
  //       await sleep(100);
  //       isExist = document.querySelector("button._aahi");
  //     }
  //     if (isExist) {
  //       // console.log("Сохраняю фото/видео");
  //       resolve(isExist);
  //     } else {
  //       // console.log("На странице больше нету фото/видео");
  //       reject(innerPosts);
  //     }
  //   })
  //     .then(async (response) => {
  //       await sleep(100);
  //       response.click();
  //       await sleep(200);
  //       await getPhotos();
  //     })
  //     .catch(async () => {
  //       // console.log("Фото/Видео в списке больше нету");
  //       // console.log(`Количество полученных фото/видео: ${photos.length}`);
  //       try {
  //         let counter =
  //           parseInt(window.sessionStorage.getItem("scraperCounter")) + 1;
  //         window.sessionStorage.setItem("scraperCounter", counter);
  //         let saved = JSON.parse(window.sessionStorage.getItem("savedPosts"));
  //         saved = saved.concat(innerPosts);
  //         let filtered = [];
  //         for (let j = 0; j < saved.length; j++) {
  //           if (!filtered.includes(saved[j])) {
  //             filtered.push(saved[j]);
  //           }
  //         }
  //         let now = JSON.parse(window.sessionStorage.getItem("now"));
  //         let stop = JSON.parse(window.sessionStorage.getItem("stop"));

  //         window.sessionStorage.setItem("savedPosts", JSON.stringify(filtered));
  //         if (!now && !stop) {
  //           chrome.runtime.sendMessage({
  //             type: "LOAD_URL",
  //             links: posts,
  //             counter: counter,
  //             savedLength: filtered.length,
  //           });
  //         }

  //         let limit = JSON.parse(window.sessionStorage.getItem("posts")).length;

  //         if (stop) {
  //           console.log("Расширение остановлено");
  //           window.sessionStorage.removeItem("stop");
  //           window.sessionStorage.removeItem("start");
  //           return;
  //         }

  //         if (counter == limit || now) {
  //           window.sessionStorage.removeItem("start");
  //           window.sessionStorage.removeItem("scraperCounter");
  //           window.sessionStorage.removeItem("posts");
  //           window.sessionStorage.removeItem("savedPosts");
  //           window.sessionStorage.removeItem("now");

  //           let body = document.getElementsByTagName("body")[0];

  //           new Promise((resolve, reject) => {
  //             body.innerHTML = "";
  //             resolve();
  //           }).then(() => {
  //             filtered.forEach((item) => {
  //               const p = document.createElement("p");
  //               p.textContent = item;
  //               body.append(p);
  //             });
  //           });
  //           // chrome.runtime.sendMessage({ type: "TASK_COMPLETE" });
  //         }
  //       } catch {}
  //     });
  // }
};
