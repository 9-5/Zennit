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

## Screenshots
<div align="center">
<img src="https://github.com/user-attachments/assets/d7d8b1dd-6f90-4a65-9a0d-a05de8f2f9e5" width="23%"></img><img src="https://github.com/user-attachments/assets/22ec74f5-0ea4-4dbc-9893-df69fe98eab5" width="23%"></img><img src="https://github.com/user-attachments/assets/dd0bdbf5-d9f6-4f32-b625-799dc5d33235" width="23%"></img><img src="https://github.com/user-attachments/assets/ea65fae7-2e73-49e5-ace6-9def6ef1bc72" width="23%"></img><img src="https://github.com/user-attachments/assets/986f0f14-9611-4ca5-b85f-9efa205312a6" width="23%"></img><img src="https://github.com/user-attachments/assets/d53d6433-4fdc-4a22-9083-deda0afb531c" width="23%"></img><img src="https://github.com/user-attachments/assets/cdb1452b-5133-410c-9e6d-c9f800e67bf2" width="23%"></img><img src="https://github.com/user-attachments/assets/6e9a048b-28a7-4daf-8ce5-9d2bfcffb291" width="23%"></img>
</div>

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
   git clone https://github.com/9-5/zennit.git
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
