# Web - MPD Music Tracker

## Overview

This project provides a music tracker system consisting of:

1. **A C Program** (`main.c`) that interacts with the MPD (Music Player Daemon) server to get the currently playing track information and sends it to a Node.js server.
2. **A Node.js Server** that receives track information, processes it, dynamically assigns a youtube video for a music track, and serves it via an HTTP API.
3. **HTML/CSS/JS Frontend** which allows for easy viewing of the information in real-time.
3. **Systemd Service and Timer Files** to automate the execution of the C program at regular intervals.

## Prerequisites

1. **MPD (Music Player Daemon)**: Required for tracking music playback.
2. **Node.js**: Required for running the Node.js server.
3. **gcc**: For compiling the C program.
4. **systemd**: For running the service and timer.

## Installation

### Build and Install

1. **Clone the repository** (if applicable):
    ```bash
    git clone https://github.com/piradite/web-mpd-tracker.git
    cd web-mpd-tracker
    ```

2. **Compile the C Program (OPTIONAL)**:
    ```bash
    make
    ```

3. **Install the C Program and Systemd Files**:
    ```bash
    sudo make install
    ```

    This command will:
    - Compile the C program.
    - Move the compiled C program to `/usr/local/bin/get-song`.
    - Install systemd service and timer files to `/etc/systemd/system/`.
    
    - After that all files are enabled and ran automatically

### Node.js Server Setup

1. **Install Dependencies**:
    ```bash
    npm install express body-parser path youtube-search-without-api-key
    ```

2. **Start the Node.js Server**:
    ```bash
    node server.js
    ```

    The server will be accessible on port 3000.

## Usage

- The C program will run periodically as defined by the systemd timer and send track information to the Node.js server.
- The Node.js server exposes an endpoint at `/get-info` that returns the current track information in JSON format.

## Limitations

- **MPD Dependency**: The system relies on MPD for tracking music playback. It is not functional without an MPD server, although pull requests are welcome to change it!.
- **Periodic Execution**: The C program runs at fixed intervals (every 5 seconds). This may not be suitable for all use cases.
- **Error Handling in C**: The C program has limited error handling and may not handle all edge cases.

## Contribution

- **Pull Requests**: Contributions are welcome. Please submit a pull request for any changes or improvements.
- **Issues**: Report any issues or bugs via the issue tracker.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
