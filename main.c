#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <mpd/client.h>
#include <curl/curl.h>

#define MAX_STRING_LENGTH 256
#define CURL_TIMEOUT 30L
#define CURL_URL "https://LINK TO WHERE YOUR SERVER.JS IS HOSTED/track-info"

static char last_artist[MAX_STRING_LENGTH] = "";
static char last_title[MAX_STRING_LENGTH] = "";
static int last_total_time = -1;
static int last_elapsed_time = -1;
static int track_info_sent = 0;

typedef enum {
    STATUS_UNKNOWN,
    STATUS_PLAYING,
    STATUS_PAUSED,
    STATUS_STOPPED
} PlaybackStatus;

const char* playback_status_to_string(PlaybackStatus status) {
    switch (status) {
        case STATUS_PLAYING: return "playing";
        case STATUS_PAUSED: return "paused";
        case STATUS_STOPPED: return "stopped";
        default: return "offline";
    }
}

void send_track_info(const char* artist, const char* title, int time, int total_time, PlaybackStatus status) {
    CURL *curl = curl_easy_init();
    if (curl) {
        char post_data[512];
        snprintf(post_data, sizeof(post_data), 
                 "artist=%s&title=%s&time=%d&totalTime=%d&status=%s", 
                 artist, title, time, total_time, playback_status_to_string(status));

        printf("Sending track info: %s\n", post_data);

        curl_easy_setopt(curl, CURLOPT_URL, CURL_URL);
        curl_easy_setopt(curl, CURLOPT_POSTFIELDS, post_data);
        curl_easy_setopt(curl, CURLOPT_TIMEOUT, CURL_TIMEOUT);

        CURLcode res = curl_easy_perform(curl);
        if (res != CURLE_OK) {
            fprintf(stderr, "curl_easy_perform() failed: %s\n", curl_easy_strerror(res));
        } else {
            printf("Track info sent successfully.\n");
        }

        curl_easy_cleanup(curl);
    } else {
        fprintf(stderr, "Failed to initialize CURL.\n");
    }
}

void handle_status(struct mpd_connection *conn) {
    struct mpd_status *status = mpd_run_status(conn);
    if (!status) {
        fprintf(stderr, "Failed to get MPD status.\n");
        return;
    }

    PlaybackStatus playback_status = STATUS_UNKNOWN;
    switch (mpd_status_get_state(status)) {
        case MPD_STATE_PLAY: playback_status = STATUS_PLAYING; break;
        case MPD_STATE_PAUSE: playback_status = STATUS_PAUSED; break;
        case MPD_STATE_STOP: playback_status = STATUS_STOPPED; break;
        default: playback_status = STATUS_UNKNOWN; break;
    }

    struct mpd_song *song = mpd_run_current_song(conn);
    if (song) {
        const char *artist = mpd_song_get_tag(song, MPD_TAG_ARTIST, 0);
        const char *title = mpd_song_get_tag(song, MPD_TAG_TITLE, 0);
        int elapsed_time = mpd_status_get_elapsed_time(status);
        int total_time = mpd_status_get_total_time(status);

        if (artist && title && elapsed_time >= 0 && total_time >= 0) {
            printf("Current Song: %s - %s\n", artist, title);
            printf("Elapsed Time: %d\n", elapsed_time);
            printf("Total Time: %d\n", total_time);

            send_track_info(artist, title, elapsed_time, total_time, playback_status);

            strncpy(last_artist, artist, sizeof(last_artist) - 1);
            strncpy(last_title, title, sizeof(last_title) - 1);
            last_total_time = total_time;
            last_elapsed_time = elapsed_time;
            track_info_sent = 1;
        } else {
            track_info_sent = 0;
            memset(last_artist, 0, sizeof(last_artist));
            memset(last_title, 0, sizeof(last_title));
            last_total_time = -1;
            last_elapsed_time = -1;
        }

        mpd_song_free(song);
    } else {
        track_info_sent = 0;
        memset(last_artist, 0, sizeof(last_artist));
        memset(last_title, 0, sizeof(last_title));
        last_total_time = -1;
        last_elapsed_time = -1;
        printf("No current song playing.\n");
    }

    mpd_status_free(status);
}

int main(void) {
    struct mpd_connection *conn = mpd_connection_new(NULL, 0, CURL_TIMEOUT * 1000);
    if (mpd_connection_get_error(conn) != MPD_ERROR_SUCCESS) {
        fprintf(stderr, "Failed to connect to MPD server.\n");
        mpd_connection_free(conn);
        return EXIT_FAILURE;
    }

    handle_status(conn);
    mpd_connection_free(conn);
    return EXIT_SUCCESS;
}