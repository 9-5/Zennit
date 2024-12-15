<p align="center"><img src="assets\zennit-logo.png" height="250" width="250"/></p>

# Zennit - A Zen Reddit Experience

Zennit is a zen Reddit experience designed to provide a clean and user-friendly interface for browsing Reddit posts and comments. Built with React and Tailwind CSS, Zennit allows users to interact with their favorite subreddits, add new ones, and manage their viewing experience seamlessly.

Right out of the box, Zennit made to function with both mobile devices and standard PC web browsers.

View a live demo here: [zen.0kb.org](https://zen.0kb.org/)

## Table of Contents

[Features](#features)

[Technologies Used](#technologies-used)

[Installation](#installation)

[Usage](#usage)

## Features

- **Post and Comment Fetching:** Retrieve posts and comments from Reddit with sorting options (hot, new, top, rising).
- **Pagination Support:** Load more posts and comments seamlessly as you scroll or click.
- **User-Friendly Sidebar:** Easily manage and navigate through followed subreddits.
- **Dynamic Post Feed:** View posts with details including title, author, upvotes, and creation date.
- **Interactive Comment Section:** Display comments with options to toggle visibility and load more.
- **Customizable Settings Page:** Configure theme selection and content preferences (e.g., NSFW visibility, comment settings).
- **Toast Notifications:** Inform users of actions taken (e.g., saving posts) with brief messages.
- **Error Handling:** Display error popups for issues encountered during data fetching.
- **Confirmation Dialogs:** Confirm actions like deleting subreddits or clearing cache.
- **Image Enlargement:** Click on images to view them in an enlarged format.
- **Theming Options:** Choose from multiple themes to customize the UI appearance.
- **Local Storage Management:** Persist user preferences and settings across sessions.
- **Responsive Design:** Optimized for various screen sizes, ensuring a mobile-friendly experience.
- **Search Functionality:** Search for subreddits, users, and posts.
- **Loading Indicators:** Show loading spinners while data is being fetched.
- **Swipe Gestures:** Navigate the sidebar using swipe gestures for enhanced usability.
- **Commit Information Display:** Fetch and show commit details from the GitHub repository for transparency.

## Technologies Used

- **React**: For building the user interface.
- **Tailwind CSS**: For styling and responsive design.
- **Babel**: For JavaScript transpilation.
- **HammerJS**: For swipe gesture support.
- **Font Awesome**: For icons.
- **Reddit API**: To fetch posts and comments from Reddit.

## Installation

To run Zennit locally, follow these steps:

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/zennit.git
   cd zennit
   ```

2. Open `index.html` in your web browser.No additional setup is required, as the project is designed to run directly from the HTML file.

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
