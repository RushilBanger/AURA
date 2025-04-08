let currentSong = new Audio();
let songs = [];
let currFolder = "";

function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

async function getSongs(folder) {
    try {
        currFolder = folder;
        const res = await fetch(`${folder}/`);
        if (!res.ok) throw new Error(`Failed to load folder: ${folder}`);
        const html = await res.text();

        let div = document.createElement("div");
        div.innerHTML = html;
        let as = div.getElementsByTagName("a");

        songs = [];
        for (let element of as) {
            if (element.href.endsWith(".mp3")) {
                songs.push(element.href.split(`${folder}/`)[1]);
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

        Array.from(songUl.getElementsByTagName("li")).forEach(e => {
            e.addEventListener("click", () => {
                playMusic(e.querySelector(".info div").innerText);
            });
        });

        return songs;
    } catch (err) {
        console.error("getSongs error:", err);
    }
}

function playMusic(track, pause = false) {
    currentSong.src = `${currFolder}/${track}`;
    if (!pause) {
        currentSong.play();
        play.src = "pause.svg";
    }
    document.querySelector(".songinfo").innerHTML = decodeURI(track);
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
}

async function displayAlbums() {
    try {
        const res = await fetch("songs/");
        if (!res.ok) throw new Error("Couldn't load albums");

        const html = await res.text();
        let div = document.createElement("div");
        div.innerHTML = html;

        const anchors = div.getElementsByTagName("a");
        const cardContainer = document.querySelector(".cardContainer");

        for (const a of anchors) {
            if (a.href.includes("/songs/") && !a.href.includes(".htaccess")) {
                const folder = a.href.split("/").slice(-2)[0];

                try {
                    const meta = await fetch(`songs/${folder}/info.json`);
                    if (!meta.ok) continue;

                    const info = await meta.json();
                    cardContainer.innerHTML += `
                        <div data-folder="${folder}" class="card">
                            <div class="play">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="50" height="50" fill="#960096">
                                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5" />
                                    <path d="M15.9453 12.3948C15.7686 13.0215 14.9333 13.4644 13.2629 14.3502C11.648 15.2064 10.8406 15.6346 10.1899 15.4625C9.9209 15.3913 9.6758 15.2562 9.47812 15.0701C9 14.6198 9 13.7465 9 12C9 10.2535 9 9.38018 9.47812 8.92995C9.6758 8.74381 9.9209 8.60868 10.1899 8.53753C10.8406 8.36544 11.648 8.79357 13.2629 9.64983C14.9333 10.5356 15.7686 10.9785 15.9453 11.6052C16.0182 11.8639 16.0182 12.1361 15.9453 12.3948Z" fill="black" />
                                </svg>
                            </div>
                            <img src="songs/${folder}/cover.jpg" alt="">
                            <h2>${info.title}</h2>
                            <p>${info.description}</p>
                        </div>`;
                } catch (err) {
                    console.warn(`Failed to load info.json for ${folder}`);
                }
            }
        }

        Array.from(document.getElementsByClassName("card")).forEach(e => {
            e.addEventListener("click", async () => {
                songs = await getSongs(`songs/${e.dataset.folder}`);
                playMusic(songs[0]);
            });
        });

    } catch (err) {
        console.error("displayAlbums error:", err);
    }
}

async function main() {
    await getSongs("songs/badmos");
    playMusic(songs[0], true);
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
        document.querySelector(".songtime").innerHTML = `${secondsToMinutesSeconds(currentSong.currentTime)} / ${secondsToMinutesSeconds(currentSong.duration)}`;
        document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";
    });

    document.querySelector(".seekbar").addEventListener("click", e => {
        const percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%";
        currentSong.currentTime = (currentSong.duration * percent) / 100;
    });

    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });

    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%";
    });

    previous.addEventListener("click", () => {
        const index = songs.indexOf(currentSong.src.split("/").pop());
        if (index > 0) playMusic(songs[index - 1]);
    });

    next.addEventListener("click", () => {
        const index = songs.indexOf(currentSong.src.split("/").pop());
        if (index + 1 < songs.length) {
            playMusic(songs[index + 1]);
        } else {
            playMusic(songs[0]);
        }
    });

    document.querySelector(".range input").addEventListener("change", e => {
        currentSong.volume = parseInt(e.target.value) / 100;
        if (currentSong.volume > 0) {
            document.querySelector(".volume>img").src = "volume-knob.svg";
        }
    });

    document.querySelector(".volume>img").addEventListener("click", e => {
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
        const index = songs.indexOf(currentSong.src.split("/").pop());
        if (index + 1 < songs.length) {
            playMusic(songs[index + 1]);
        } else {
            playMusic(songs[0]);
        }
    });
}

main();
