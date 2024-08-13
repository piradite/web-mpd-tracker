let currentTime = 0;
let totalTime = 0;
let previousTrack = { artist: '', title: '' };
let playbackStatus = 'offline';
let fetchIntervalId;
let updateTimeIntervalId;

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
}

async function fetchTrackInfo() {
    try {
        const response = await fetch('/get-info', { cache: 'no-store' });

        if (response.status === 204) {
            console.warn('Received 204, ignoring update.');
            return;
        }

        if (!response.ok) {
            throw new Error(`Network response was not ok :( ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.artist || !data.title || data.time === undefined || data.totalTime === undefined || !data.status) {
            console.error('Invalid data from server:', data);
            return;
        }

        const newTrack = {
            artist: data.artist,
            title: data.title,
            time: Number(data.time),
            totalTime: Number(data.totalTime),
            status: data.status
        };

        const timeDifference = Math.abs(newTrack.time - currentTime);

        if (newTrack.artist !== previousTrack.artist || newTrack.title !== previousTrack.title || timeDifference >= 4) {
            document.getElementById('trackInfo').textContent = `${newTrack.artist} - ${newTrack.title}`;
            totalTime = newTrack.totalTime;
            document.getElementById('finalTime').textContent = formatTime(totalTime);
            previousTrack = { artist: newTrack.artist, title: newTrack.title };
            currentTime = newTrack.time;
            document.getElementById('currentTime').textContent = formatTime(currentTime);
            updateProgressCircle();
        }

        if (newTrack.status !== playbackStatus) {
            playbackStatus = newTrack.status;
            document.getElementById('playbackStatus').textContent = playbackStatus;
            currentTime = newTrack.time;
            document.getElementById('currentTime').textContent = formatTime(currentTime);
            updateProgressCircle();
        }

        const youtubeLink = data.youtubeLink;
        const youtubeLinkElement = document.getElementById('youtubeLink');

        if (youtubeLink) {
            youtubeLinkElement.href = youtubeLink;
            youtubeLinkElement.style.display = 'inline';
        } else {
            youtubeLinkElement.style.display = 'none';
        }
    } catch (error) {
        console.error('Error fetching track info:', error);
    }
}

function updateCurrentTime() {
    if (playbackStatus === 'playing') {
        currentTime++;
        if (currentTime > totalTime) {
            currentTime = totalTime;
        }
        document.getElementById('currentTime').textContent = formatTime(currentTime);
        updateProgressCircle();
    }
}

function updateProgressCircle() {
    const progressCircle = document.getElementById('progressCircle');
    const progressPercentage = (currentTime / totalTime) * 100;
    progressCircle.style.left = `${Math.min(progressPercentage, 100)}%`;
}

function startIntervals() {
    fetchIntervalId = setInterval(fetchTrackInfo, 5000);
    updateTimeIntervalId = setInterval(updateCurrentTime, 1000);
}

function stopIntervals() {
    clearInterval(fetchIntervalId);
    clearInterval(updateTimeIntervalId);
}

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        console.log('Tab is active. Fetching track info.');
        fetchTrackInfo();
        startIntervals();
    } else {
        console.log('Tab is inactive. Pausing updates.');
        stopIntervals();
    }
});

(async function initialFetch() {
    await fetchTrackInfo();
    startIntervals();
})();