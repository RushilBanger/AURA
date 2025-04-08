let currentSong = new Audio();
let songs = [];
let currFolder = "";

function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) return "00:00";
    const m = String(Math.floor(seconds / 60)).padStart(2, '0');
    const s = String(Math.floor(seconds % 60)).padStart(2, '0');
    return `${m}:${s}`;
}

async function getSongs(folder) {
    currFolder = folder;
    const res = await fetch(`${folder}/info.json`);
    const data = await res.json();
    songs = data.songs;

    const songUl = document.querySelector(".songlist ul");
    songUl.innerHTML = "";
    songs.forEach(song => {
        songUl.innerHTML += `
            <li>
                <img class="invert" src="music.svg" alt="">
                <div class="info"><div>${song}</div></div>
                <div class="playnow">
                    <span>Play now</span>
                    <img class="invert" src="play.svg" alt="">
                </div>
            </li>`;
    });

    document.querySelectorAll(".songlist li").forEach(e => {
        e.addEventListener("click", () => {
            const track = e.querySelector(".info div").innerText;
            playMusic(track);
        });
    });

    return songs;
}

function playMusic(track, pause = false) {
    currentSong.src = `/${currFolder}/${track}`;
    if (!pause) {
        currentSong.play();
        document.getElementById("play").src = "pause.svg";
    }
    document.querySelector(".songinfo").innerHTML = decodeURIComponent(track);
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
}

async function displayAlbums() {
    const res = await fetch("songs/info.json");
    const albums = await res.json();
    const cardContainer = document.querySelector(".cardContainer");
    cardContainer.innerHTML = "";

    for (let folder of albums) {
        const albumRes = await fetch(`songs/${folder}/info.json`);
        const album = await albumRes.json();

        cardContainer.innerHTML += `
            <div data-folder="songs/${folder}" class="card">
                <div class="play">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="50" height="50" fill="#960096">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5" />
                        <path d="M15.9453 12.3948C15.7686 13.0215 14.9333 13.4644 13.2629 14.3502C11.648 15.2064 10.8406 15.6346 10.1899 15.4625C9.9209 15.3913 9.6758 15.2562 9.47812 15.0701C9 14.6198 9 13.7465 9 12C9 10.2535 9 9.38018 9.47812 8.92995C9.6758 8.74381 9.9209 8.60868 10.1899 8.53753C10.8406 8.36544 11.648 8.79357 13.2629 9.64983C14.9333 10.5356 15.7686 10.9785 15.9453 11.6052C16.0182 11.8639 16.0182 12.1361 15.9453 12.3948Z" stroke="currentColor" stroke-width="1.5" fill="black" />
                    </svg>
                </div>
                <img src="/songs/${folder}/cover.jpg" alt="">
                <h2>${album.title}</h2>
                <p>${album.description}</p>
            </div>
        `;
    }

    document.querySelectorAll(".card").forEach(card => {
        card.addEventListener("click", async () => {
            songs = await getSongs(card.dataset.folder);
            if (songs.length > 0) playMusic(songs[0]);
        });
    });
}

async function main() {
    await getSongs("songs/badmos");
    if (songs.length > 0) playMusic(songs[0], true);
    displayAlbums();

    document.getElementById("play").addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            play.src = "pause.svg";
        } else {
            currentSong.pause();
            play.src = "play.svg";
        }
    });

    currentSong.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").innerHTML =
            `${secondsToMinutesSeconds(currentSong.currentTime)} / ${secondsToMinutesSeconds(currentSong.duration)}`;
        document.querySelector(".circle").style.left = `${(currentSong.currentTime / currentSong.duration) * 100}%`;
    });

    document.querySelector(".seekbar").addEventListener("click", e => {
        const percent = e.offsetX / e.target.getBoundingClientRect().width;
        currentSong.currentTime = percent * currentSong.duration;
        document.querySelector(".circle").style.left = `${percent * 100}%`;
    });

    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });

    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%";
    });

    document.getElementById("previous").addEventListener("click", () => {
        const index = songs.indexOf(currentSong.src.split("/").pop());
        if (index > 0) playMusic(songs[index - 1]);
    });

    document.getElementById("next").addEventListener("click", () => {
        const index = songs.indexOf(currentSong.src.split("/").pop());
        if (index + 1 < songs.length) playMusic(songs[index + 1]);
        else playMusic(songs[0]);
    });

    document.querySelector(".range input").addEventListener("change", (e) => {
        currentSong.volume = parseInt(e.target.value) / 100;
        const volumeIcon = document.querySelector(".volume img");
        if (currentSong.volume > 0) {
            volumeIcon.src = volumeIcon.src.replace("mute.svg", "volume-knob.svg");
        }
    });

    document.querySelector(".volume img").addEventListener("click", (e) => {
        const volumeBar = document.querySelector(".range input");
        if (e.target.src.includes("volume-knob.svg")) {
            e.target.src = e.target.src.replace("volume-knob.svg", "mute.svg");
            currentSong.volume = 0;
            volumeBar.value = 0;
        } else {
            e.target.src = e.target.src.replace("mute.svg", "volume-knob.svg");
            currentSong.volume = 0.3;
            volumeBar.value = 30;
        }
    });

    currentSong.addEventListener("ended", () => {
        const index = songs.indexOf(currentSong.src.split("/").pop());
        if (index + 1 < songs.length) playMusic(songs[index + 1]);
        else playMusic(songs[0]);
    });
}

main();
