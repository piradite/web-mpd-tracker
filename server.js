const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public'), { maxAge: 0 }));

app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
});

let currentTrack = {
    artist: '',
    title: '',
    time: 0,
    totalTime: 0,
    status: 'offline',
    youtubeLink: ''
};

let lastTrack = { ...currentTrack };

let intervalId;
let lastUpdateTime = Date.now();

const startCounting = () => {
    if (intervalId) clearInterval(intervalId);

    intervalId = setInterval(() => {
        if (currentTrack.status === 'playing' && currentTrack.time < lastTrack.time) {
            currentTrack.time += 1;
            console.log(`Elapsed time for ${currentTrack.artist} - ${currentTrack.title}: ${currentTrack.time} seconds`);
        }
    }, 1000);
};

const searchYouTube = async (artist, title) => {
    try {
        const yt = await import('youtube-search-without-api-key');
        const query = `${artist} - ${title}`;
        const videos = await yt.search(query);
        return videos.length > 0 ? videos[0].url : '';
    } catch (error) {
        console.error('YouTube search error:', error);
        return '';
    }
};

let trackHistory = [];

app.post('/track-info', async (req, res) => {
    const { artist, title, time, totalTime, status } = req.body;

    if (!artist || !title) {
        return res.sendStatus(400);
    }

    const newTrack = {
        artist,
        title,
        time: parseInt(time, 10) || 0,
        totalTime: parseInt(totalTime, 10) || 0,
        status
    };

    if (JSON.stringify(newTrack) !== JSON.stringify(lastTrack)) {
        lastTrack = { ...newTrack };
        currentTrack = { ...newTrack };
        lastUpdateTime = Date.now();

        if (status === 'playing') startCounting();

        currentTrack.youtubeLink = await searchYouTube(artist, title);

        const trackForHistory = {
            artist: currentTrack.artist,
            title: currentTrack.title,
            youtubeLink: currentTrack.youtubeLink
        };

        const isNewTrack = !trackHistory.length ||
                           trackHistory[0].artist !== newTrack.artist ||
                           trackHistory[0].title !== newTrack.title;

        if (isNewTrack) {
            trackHistory.unshift(trackForHistory);
            if (trackHistory.length > 5) trackHistory.pop();
        }
    }

    res.sendStatus(200);
});

const updateStatus = () => {
    if (Date.now() - lastUpdateTime > 30000 && currentTrack.status !== 'offline') {
        currentTrack = {
            ...currentTrack,
            status: 'offline',
            time: 0,
            youtubeLink: ''
        };
    }
};

app.get('/get-info', (req, res) => {
    try {
        updateStatus();

        const trackInfo = {
            artist: currentTrack.artist || '',
            title: currentTrack.title || '',
            time: currentTrack.time || 0,
            totalTime: currentTrack.totalTime || 0,
            status: currentTrack.status || 'offline',
            youtubeLink: currentTrack.youtubeLink || '',
            history: trackHistory
        };

        if (trackInfo.artist && trackInfo.title && trackInfo.status !== 'offline') {
            return res.json(trackInfo);
        }

        res.status(204).send('No Content');
    } catch {
        res.status(500).send('Internal Server Error');
    }
});

app.listen(3000, () => {
    console.log('Server is running on port 3000\n');
    console.log('http://localhost:3000');
});
