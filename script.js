let currentSong = new Audio();
let songs;
let currFolder;

function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) return "00:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

async function getSongs(folder) {
    currFolder = folder;
    try {
        const res = await fetch(`/${folder}/songs.json`);
        if (!res.ok) throw new Error("Failed to load songs.json");

        const data = await res.json();
        songs = data.tracks;

        const songUl = document.querySelector(".songlist ul");
        songUl.innerHTML = "";

        for (const song of songs) {
            songUl.innerHTML += `<li>
                <img class="invert" src="music.svg" alt="">
                <div class="info">
                    <div>${song.replaceAll("%20", " ")}</div>
                </div>
                <div class="playnow">
                    <span>Play now</span>
                    <img class="invert" src="play.svg" alt="">
                </div>
            </li>`;
        }

        Array.from(document.querySelectorAll(".songlist li")).forEach(e => {
            e.addEventListener("click", () => {
                const track = e.querySelector(".info div").innerText;
                playMusic(track);
            });
        });

        return songs;
    } catch (err) {
        console.error("getSongs error:", err);
        throw new Error(`Failed to load folder: ${folder}`);
    }
}

const playMusic = (track, pause = false) => {
    currentSong.src = `/${currFolder}/${track}`;
    if (!pause) {
        currentSong.play();
        play.src = "pause.svg";
    }
    document.querySelector(".songinfo").innerHTML = decodeURI(track);
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
};

async function displayAlbums() {
    try {
        const res = await fetch(`/aura/songs/album-list.json`);
        if (!res.ok) throw new Error("Couldn't load albums list");
        const albumList = await res.json();

        const cardContainer = document.querySelector(".cardContainer");
        cardContainer.innerHTML = "";

        for (const album of albumList.albums) {
            const metaRes = await fetch(`/aura/songs/${album}/info.json`);
            const meta = await metaRes.json();

            cardContainer.innerHTML += `
                <div data-folder="songs/${album}" class="card">
                    <div class="play">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="50" height="50" color="#960096" fill="#960096">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5" />
                            <path d="M15.9453 12.3948C15.7686 13.0215 14.9333 13.4644 13.2629 14.3502C11.648 15.2064 10.8406 15.6346 10.1899 15.4625C9.9209 15.3913 9.6758 15.2562 9.47812 15.0701C9 14.6198 9 13.7465 9 12C9 10.2535 9 9.38018 9.47812 8.92995C9.6758 8.74381 9.9209 8.60868 10.1899 8.53753C10.8406 8.36544 11.648 8.79357 13.2629 9.64983C14.9333 10.5356 15.7686 10.9785 15.9453 11.6052C16.0182 11.8639 16.0182 12.1361 15.9453 12.3948Z" stroke="currentColor" stroke-width="1.5" color="black" fill="black" stroke-linejoin="round" />
                        </svg>
                    </div>
                    <img src="/aura/songs/${album}/cover.jpg" alt="">
                    <h2>${meta.title}</h2>
                    <p>${meta.description}</p>
                </div>`;
        }

        document.querySelectorAll(".card").forEach(card => {
            card.addEventListener("click", async () => {
                songs = await getSongs(card.dataset.folder);
                playMusic(songs[0]);
            });
        });
    } catch (err) {
        console.error("displayAlbums error:", err);
    }
}

async function main() {
    try {
        await getSongs("aura/songs/badmos");
        playMusic(songs[0], true);
        await displayAlbums();
    } catch (err) {
        console.error("Failed to load initial songs:",
