const audio = document.getElementById("audio-quijote");
const playBtn = document.getElementById("play-pause");
const playIcon = document.getElementById("play-icon");
const seekBar = document.getElementById("seek-bar");
const currentTime = document.getElementById("current-time");
const duration = document.getElementById("duration");

function formatTime(seconds) {
  if (isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

playBtn.onclick = () => {
  if (audio.paused) {
    audio.play();
  } else {
    audio.pause();
  }
};
audio.addEventListener("play", () => {
  playIcon.setAttribute("name", "pause")
});
audio.addEventListener("pause", () => {
  playIcon.setAttribute("name", "play")
});
audio.addEventListener("timeupdate", () => {
  seekBar.value = audio.currentTime;
  currentTime.textContent = formatTime(audio.currentTime);
});
audio.addEventListener("loadedmetadata", () => {
  seekBar.max = audio.duration;
  duration.textContent = formatTime(audio.duration);
});
seekBar.oninput = () => {
  audio.currentTime = seekBar.value;
};
