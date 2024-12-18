<p align="center"><img src="assets\favicon\favicon.svg" height="250" width="250"/></p>

# Zennit - A Zen Reddit Experience

Zennit is a zen Reddit experience designed to provide a clean and user-friendly interface for browsing Reddit posts and comments. Built with React and Tailwind CSS, Zennit allows users to interact with their favorite subreddits, add new ones, and manage their viewing experience seamlessly.

Right out of the box, Zennit made to function with both mobile devices and standard PC web browsers.

Instances: [zen.0kb.org](https://zen.0kb.org/) | [zen.ż.co](https://zen.ż.co/)

## Table of Contents

[Screenshots](#screenshots)

[Features](#features)

[Technologies Used](#technologies_used)

[Installation](#installation)

[Usage](#usage)

[Screenshots](#screenshots)

|                                       |                                       |                                       |
| :------------------------------------: | :------------------------------------: | :------------------------------------: |
| <img src="assets\screenshots\1.png"/> | <img src="assets\screenshots\2.png"/> | <img src="assets\screenshots\3.png"/> |

## Features

-   **Clean and User-Friendly Interface:** Zennit offers a clutter-free design that focuses on readability and ease of navigation.
-   **Subreddit Management:** Add, remove, and switch between your favorite subreddits effortlessly.
-   **Customizable Themes:** Choose from a variety of themes to personalize your browsing experience.
-   **Mobile-First Design:** Enjoy a seamless experience on both desktop and mobile devices.
-   **Offline Support:** Access previously loaded content even when you're offline.
-   **Lazy Loading:** Images and content are loaded as you scroll, improving performance and reducing data usage.

## Technologies Used

-   [React](https://reactjs.org/): A JavaScript library for building user interfaces.
-   [Tailwind CSS](https://tailwindcss.com/): A utility-first CSS framework for rapid UI development.

## Installation

Since Zennit is built as a static website using React, there's no need for a complex installation process. You can simply open the `index.html` file in your web browser.

**Alternatively, you can use a simple HTTP server like `python3 -m http.server` or `npx serve` to serve the project locally.**

__No node_modules or package managers are required to run Zennit directly from the HTML file. All dependancies are loaded directly from CDNs.__

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