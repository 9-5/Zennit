<p align="center"><img src="assets\favicon\favicon.svg" height="250" width="250"/></p>

# Zennit - A Zen Reddit Experience

Zennit is a zen Reddit experience designed to provide a clean and user-friendly interface for browsing Reddit posts and comments. Built with React and Tailwind CSS, Zennit allows users to interact with their favorite subreddits, add new ones, and manage their viewing experience seamlessly.

Right out of the box, Zennit made to function with both mobile devices and standard PC web browsers.

Instances: [zen.0kb.org](https://zen.0kb.org/) | [zen.ż.co](https://zen.ż.co/)

## Table of Contents

[Screenshots](#screenshots)

[Features](#features)

[Technologies Used](#technologies-used)

[Installation](#installation)

[Usage](#usage)

[Contributing](#contributing)

[License](#license)

## Screenshots

*Main View*
![Main View](https://raw.githubusercontent.com/0kb-club/zennit/main/screenshots/main.png)

*Mobile View*
![Mobile View](https://raw.githubusercontent.com/0kb-club/zennit/main/screenshots/mobile.png)

## Features

- **Clean and Intuitive Interface:** Enjoy a clutter-free browsing experience with a focus on readability and ease of use.
- **Subreddit Management:** Easily add and remove subreddits to customize your content feed.
- **Post Interaction:** View posts and their comments in a streamlined format.
- **Mobile-Friendly Design:** Seamlessly browse Zennit on your desktop or mobile device.
- **Theme Customization:** Change the theme from the default dark theme to any theme you want.
- **Offline Support**: Zennit automatically caches your last viewed subreddits and posts to allow you to browse Zennit without an internet connection.
- **PWA Installation**: Install Zennit directly from the browser and use it as a standard desktop or mobile application.
- **External APIs**: Zennit uses multiple external APIs to enhance your Reddit experience, including: [Reddit API](https://www.reddit.com/dev/api/), [Imgur API](https://api.imgur.com/), [Giphy API](https://developers.giphy.com/).
- **Content Blocker Detection**: The Content Blocker detection is to warn users that are using a content blocker that it might block the application from fully functioning, and to whitelist Zennit in their content blocker.

## Technologies Used

- [React](https://reactjs.org/): A JavaScript library for building user interfaces.
- [Tailwind CSS](https://tailwindcss.com/): A utility-first CSS framework for rapid UI development.

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/0kb-club/zennit.git
   ```

2. Navigate to the project directory:

   ```bash
   cd zennit
   ```

3. Open `index.html` directly from the HTML file.

**You can optionally host the project on [GitHub Pages](https://pages.github.com/) as a static website.**

## Usage
1. Open `index.html` in your web browser.
2. Open the subreddit sidebar by clicking on the Zennit logo in the top-left corner.
3. Add your favorite subreddits by entering `r/SubredditName` and clicking "Add".
4. Select a subreddit by clicking on its name in the sidebar.
5. Click on a post to view its comments.
6. View posts sorted by different criteria, such as Hot, New, Top, and Rising.
7. Enjoy a clean and user-friendly interface for browsing Reddit posts and comments.

__Subreddits can be removed in the sidebar by right-clicking on the subreddit name or long-pressing on the subreddit name.__