let currentSong = new Audio();
let songs = [];
let currFolder = "";

function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) return "00:00";
    const minutes = String(Math.floor(seconds / 60)).padStart(2, '0');
    const remainingSeconds = String(Math.floor(seconds % 60)).padStart(2, '0');
    return `${minutes}:${remainingSeconds}`;
}

async function getSongs(folder) {
    try {
        currFolder = folder;
        const res = await fetch(`${folder}/`);
        if (!res.ok) throw new Error(`Failed to load folder: ${folder}`);
        const response = await res.text();
        const div = document.createElement("div");
        div.innerHTML = response;

        const as = div.getElementsByTagName("a");
        songs = [];
        for (let a of as) {
            if (a.href.endsWith(".mp3")) {
                songs.push(decodeURIComponent(a.href.split(`/${folder}/`)[1]));
            }
        }

        let songUl = document.querySelector(".songlist ul");
        songUl.innerHTML = "";
        for (const song of songs) {
            songUl.innerHTML += `
                <li>
                    <img class="invert" src="music.svg" alt="">
                    <div class="info"><div>${song.replaceAll("%20", " ")}</div></div>
                    <div class="playnow"><span>Play now</span><img class="invert" src="play.svg" alt=""></div>
                </li>`;
        }

        document.querySelectorAll(".songlist li").forEach(e => {
            e.addEventListener("click", () => {
                playMusic(e.querySelector(".info div").innerText);
            });
        });

        return songs;
    } catch (err) {
        console.error("getSongs error:", err);
        return [];
    }
}

const playMusic = (track, pause = false) => {
    currentSong.src = `${currFolder}/${track}`;
    if (!pause) {
        currentSong.play();
        play.src = "pause.svg";
    }
    document.querySelector(".songinfo").innerText = decodeURI(track);
    document.querySelector(".songtime").innerText = "00:00 / 00:00";
};

async function displayAlbums() {
    try {
        const res = await fetch(`songs/`);
        if (!res.ok) throw new Error("Couldn't load albums");
        const response = await res.text();
        const div = document.createElement("div");
        div.innerHTML = response;

        const anchors = div.getElementsByTagName("a");
        const cardContainer = document.querySelector(".cardContainer");

        for (let a of anchors) {
            if (a.href.includes("/songs") && !a.href.includes(".htaccess")) {
                const folder = a.href.split("/").slice(-2)[0];
                try {
                    const infoRes = await fetch(`songs/${folder}/info.json`);
                    const info = await infoRes.json();
                    cardContainer.innerHTML += `
                        <div data-folder="${folder}" class="card">
                            <div class="play">▶️</div>
                            <img src="songs/${folder}/cover.jpg" alt="">
                            <h2>${info.title}</h2>
                            <p>${info.description}</p>
                        </div>`;
                } catch (e) {
                    console.warn(`Missing or invalid info.json for ${folder}`);
                }
            }
        }

        document.querySelectorAll(".card").forEach(card => {
            card.addEventListener("click", async () => {
                songs = await getSongs(`songs/${card.dataset.folder}`);
                if (songs.length) playMusic(songs[0]);
            });
        });

    } catch (err) {
        console.error("displayAlbums error:", err);
    }
}

async function main() {
    songs = await getSongs("songs/badmos");
    if (songs.length > 0) {
        playMusic(songs[0], true);
    }

    await displayAlbums();

    play.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            play.src = "pause.svg";
        } else {
            currentSong.pause();
            play.src = "play.svg";
        }
    });

    currentSong.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").innerText = `${secondsToMinutesSeconds(currentSong.currentTime)} / ${secondsToMinutesSeconds(currentSong.duration)}`;
        document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";
    });

    document.querySelector(".seekbar").addEventListener("click", e => {
        const percent = (e.offsetX / e.target.getBoundingClientRect().width);
        currentSong.currentTime = currentSong.duration * percent;
    });

    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });

    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%";
    });

    previous.addEventListener("click", () => {
        let index = songs.indexOf(currentSong.src.split("/").pop());
        if (index > 0) playMusic(songs[index - 1]);
    });

    next.addEventListener("click", () => {
        let index = songs.indexOf(currentSong.src.split("/").pop());
        if (index + 1 < songs.length) {
            playMusic(songs[index + 1]);
        } else {
            playMusic(songs[0]);
        }
    });

    document.querySelector(".range input").addEventListener("change", e => {
        currentSong.volume = e.target.value / 100;
        if (currentSong.volume > 0) {
            document.querySelector(".volume img").src = "volume-knob.svg";
        }
    });

    document.querySelector(".volume img").addEventListener("click", e => {
        if (e.target.src.includes("volume-knob.svg")) {
            e.target.src = "mute.svg";
            currentSong.volume = 0;
            document.querySelector(".range input").value = 0;
        } else {
            e.target.src = "volume-knob.svg";
            currentSong.volume = 0.3;
            document.querySelector(".range input").value = 30;
        }
    });

    currentSong.addEventListener("ended", () => {
        let index = songs.indexOf(currentSong.src.split("/").pop());
        if (index + 1 < songs.length) {
            playMusic(songs[index + 1]);
        } else {
            playMusic(songs[0]);
        }
    });
}

main();
