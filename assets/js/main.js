const { useState, useEffect, useRef } = React;
const { createRoot } = ReactDOM;

const App = () => {
    const [contentBlockerDetected, setContentBlockerDetected] = useState(false);
    const [loadingPosts, setLoadingPosts] = useState(false);
    const [after, setAfter] = useState(null);
    const [loadingComments, setLoadingComments] = useState(false);
    const [afterComment, setAfterComment] = useState(null);
    const [userAfterComment, setUserAfterComment] = useState(null);
    const [subreddits, setSubreddits] = useState(() => JSON.parse(localStorage.getItem('subreddits') || '[{"name": "r/0KB"}]'));
    const [selectedSubreddit, setSelectedSubreddit] = useState(localStorage.getItem('selectedSubreddit') || 'r/0KB');
    const [posts, setPosts] = useState([]);
    const [comments, setComments] = useState([]);
    const [savedPosts, setSavedPosts] = useState(() => JSON.parse(localStorage.getItem('savedPosts') || '[]'));
    const [showNsfw, setShowNsfw] = useState(localStorage.getItem('showNsfw') === 'true');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showErrorPopup, setShowErrorPopup] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [toastMessage, setToastMessage] = useState('');
    const [currentSort, setCurrentSort] = useState('hot');
    const [showDeletePopup, setShowDeletePopup] = useState(false);
    const [postToDelete, setPostToDelete] = useState(null);
    const [enlargedImage, setEnlargedImage] = useState(null);
    const [enlargedCommentImage, setEnlargedCommentImage] = useState(null);
    const [searchPageVisible, setSearchPageVisible] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const sidebarRef = useRef(null);

    useEffect(() => {
        localStorage.setItem('showNsfw', showNsfw);
    }, [showNsfw]);

    useEffect(() => {
        localStorage.setItem('subreddits', JSON.stringify(subreddits));
    }, [subreddits]);

     useEffect(() => {
        localStorage.setItem('selectedSubreddit', selectedSubreddit);
    }, [selectedSubreddit]);

    useEffect(() => {
        localStorage.setItem('savedPosts', JSON.stringify(savedPosts));
    }, [savedPosts]);

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') || 'default';
        document.body.className = savedTheme;
    }, []);

    useEffect(() => {
        fetchPosts(selectedSubreddit, currentSort);
    }, [selectedSubreddit, currentSort]);

    const handleImageClick = (imageUrl) => {
        setEnlargedImage(imageUrl);
    };

    const handleCommentImageClick = (imageUrl) => {
        setEnlargedCommentImage(imageUrl);
    };

    const closeEnlargedImage = () => {
        setEnlargedImage(null);
    };

    const closeEnlargedCommentImage = () => {
        setEnlargedCommentImage(null);
    };

    const renderEnlargedPostImages = () => {
        return (
            <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-75 z-50" onClick={closeEnlargedImage}>
                <img src={enlargedImage} alt="Enlarged Post Image" className="max-w-full max-h-full" />
            </div>
        );
    };

    const renderEnlargedCommentImages = () => {
        return (
            <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-75 z-50" onClick={closeEnlargedCommentImage}>
                <img src={enlargedCommentImage} alt="Enlarged Comment Image" className="max-w-full max-h-full" />
            </div>
        );
    };

    const handleThemeChange = (themeName) => {
        document.body.className = themeName;
        localStorage.setItem('theme', themeName);
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setSearchPageVisible(true);
    };

    const handleSearchInputChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    const closeSidebar = () => {
        setSidebarOpen(false);
    };

    const addSubreddit = (subredditName) => {
        if (subreddits.find(sub => sub.name === subredditName)) {
             setErrorMessage('Subreddit already exists.');
             setShowErrorPopup(true);
            return;
        }
        setSubreddits([...subreddits, { name: subredditName }]);
    };

    const removeSubreddit = (subredditName) => {
         setSubreddits(subreddits.filter(sub => sub.name !== subredditName));
    };

    const selectSubreddit = (subredditName) => {
        setSelectedSubreddit(subredditName);
        closeSidebar();
    };

    const fetchPosts = async (subreddit, sort) => {
        setLoadingPosts(true);
        try {
            const response = await fetch(`https://www.reddit.com/${subreddit}/${sort}.json?limit=10${after ? '&after=' + after : ''}`);
            const data = await response.json();
            if (data.data && data.data.children) {
                setPosts(data.data.children.map(post => post.data));
                setAfter(data.data.after);
                setContentBlockerDetected(false);
            } else {
                setContentBlockerDetected(true);
            }
        } catch (error) {
            setContentBlockerDetected(true);
        } finally {
            setLoadingPosts(false);
        }
    };

    const fetchComments = async (postId, type = 'comments') => {
        setLoadingComments(true);
        try {
            const response = await fetch(`https://www.reddit.com/r/${selectedSubreddit}/comments/${postId}.json`);
            const data = await response.json();
            if (Array.isArray(data) && data.length > 1 && data[1].data && data[1].data.children) {
                setComments(data[1].data.children.map(comment => comment.data));
                setAfterComment(data[1].data.after);
            } else {
                console.error('Unexpected data format:', data);
                setErrorMessage('Failed to load comments.');
                setShowErrorPopup(true);
                setComments([]);
            }
        } catch (error) {
            console.error('Error fetching comments:', error);
            setErrorMessage('Failed to load comments.');
            setShowErrorPopup(true);
            setComments([]);
        } finally {
            setLoadingComments(false);
        }
    };

    const handleNsfwToggle = () => {
        setShowNsfw(!showNsfw);
    };

    const isPostSaved = (postId) => {
        return savedPosts.some(post => post.id === postId);
    };

    const savePost = (post) => {
        if (isPostSaved(post.id)) {
            setToastMessage('Post already saved!');
            setShowErrorPopup(true);
            setErrorMessage('Post already saved!');
            return;
        }
        setSavedPosts([...savedPosts, post]);
        setToastMessage('Post saved!');
    };

    const deleteSavedPost = (post) => {
        setPostToDelete(post);
        setShowDeletePopup(true);
    };

    const confirmDeleteSavedPost = () => {
        setSavedPosts(savedPosts.filter(p => p.id !== postToDelete.id));
        setShowDeletePopup(false);
        setToastMessage('Post removed!');
    };

    const cancelDeleteSavedPost = () => {
        setShowDeletePopup(false);
    };

    const renderPost = (post) => {
        const postFlairStyle = {
            backgroundColor: post.link_flair_background_color || 'transparent',
            color: post.link_flair_text_color === 'dark' ? 'black' : 'white',
        };

        let hasImage = post.url_overridden_by_dest && (
            post.url_overridden_by_dest.endsWith('.jpg') ||
            post.url_overridden_by_dest.endsWith('.jpeg') ||
            post.url_overridden_by_dest.endsWith('.png') ||
            post.url_overridden_by_dest.endsWith('.gif')
        );

        return (
            <div key={post.id} className="bg-gray-800 rounded-md p-4 mb-4">
                <h3 className="text-xl font-semibold mb-2 title-container">
                    {post.title}
                </h3>
                <div className="text-gray-400 mb-2">
                    Posted by {post.author} in <button className="subreddit-button" onClick={() => selectSubreddit(`r/${post.subreddit}`)}>r/{post.subreddit}</button>
                </div>
                <div className="mb-2">
                    <button onClick={() => fetchComments(post.id)} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                        View Comments
                    </button>
                    <button onClick={() => savePost(post)} className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded ml-2">
                        {isPostSaved(post.id) ? 'Saved' : 'Save'}
                    </button>
                    {isPostSaved(post.id) && (
                        <button onClick={() => deleteSavedPost(post)} className="bg-red-600 hover:bg-red-800 text-white font-bold py-2 px-4 rounded ml-2">
                            Delete
                        </button>
                    )}
                </div>
                {post.thumbnail && post.thumbnail !== 'default' && post.thumbnail !== 'self' && post.thumbnail !== 'nsfw' && (
                    <img src={post.thumbnail} alt="Thumbnail" className="mb-2 rounded-md" />
                )}
                <p>
                    <a href={post.url} target="_blank" rel="noopener noreferrer">
                        {post.domain}
                    </a>
                </p>
                {post.link_flair_text && (
                    <span className="post-flair" style={postFlairStyle}>{post.link_flair_text}</span>
                )}
                {post.over_18 && !showNsfw && (
                    <div className="nsfw-overlay" onClick={handleNsfwToggle}>
                        <p>NSFW - Click to show</p>
                        <button onClick={handleNsfwToggle}>Show NSFW Content</button>
                    </div>
                )}
                <div className="post-content body-text">
                    {post.selftext && <div className="body-text">{post.selftext}</div>}
                    {hasImage && (
                        <img
                            src={post.url_overridden_by_dest}
                            alt="Post Image"
                            className="max-w-full rounded-md cursor-pointer"
                            onClick={() => handleImageClick(post.url_overridden_by_dest)}
                        />
                    )}
                </div>
            </div>
        );
    };

    const renderComment = (comment) => {
        let hasImage = comment.body.includes('img') || comment.body.includes('.jpg') || comment.body.includes('.png') || comment.body.includes('.gif');

        return (
            <div key={comment.id} className="bg-gray-700 rounded-md p-3 mb-3">
                <div className="text-gray-400 mb-1">
                    Comment by {comment.author}
                </div>
                <div className="body-text">
                    {comment.body}
                    {hasImage && (
                        <img
                            src={comment.url_overridden_by_dest}
                            alt="Comment Image"
                            className="max-w-full rounded-md cursor-pointer"
                            onClick={() => handleCommentImageClick(comment.url_overridden_by_dest)}
                        />
                    )}
                </div>
            </div>
        );
    };

    const renderPostFeed = () => {
        if (loadingPosts) {
            return <p>Loading posts...</p>;
        }

        if (contentBlockerDetected) {
            return <p>Content blocker detected. Please disable your content blocker to view posts.</p>;
        }

        if (posts.length === 0) {
            return <p>No posts to display.</p>;
        }

        return (
            <div>
                {posts.map(post => renderPost(post))}
                {after && (
                    <button onClick={() => fetchPosts(selectedSubreddit, currentSort)} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                        Load More
                    </button>
                )}
            </div>
        );
    };

    const renderCommentsSection = () => {
        if (loadingComments) {
            return <p>Loading comments...</p>;
        }

        if (comments.length === 0) {
            return <p>No comments to display.</p>;
        }

        return (
            <div className="mt-4">
                <h4 className="text-lg font-semibold mb-2">Comments:</h4>
                {comments.map(comment => renderComment(comment))}
                {afterComment && (
                    <button onClick={() => fetchComments(selectedSubreddit)} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                        Load More Comments
                    </button>
                )}
            </div>
        );
    };

    const renderSidebar = () => {
        return (
            <div className={`sidebar ${sidebarOpen ? 'open' : ''}`} ref={sidebarRef}>
                <button className="sidebar-close-button" onClick={closeSidebar}>
                    <i className="fas fa-times"></i>
                </button>
                <img src="assets/zennit-logo.png" alt="Zennit Logo" className="mb-4 cursor-pointer" onClick={closeSidebar} style={{ width: '80%' }}/>
                <h2 className="text-xl font-semibold mb-4">Subreddits</h2>
                <div className="subreddit-input-container">
                    <input
                        type="text"
                        id="subredditName"
                        className="bg-gray-700 text-white rounded-md p-2 mb-2 w-full"
                        placeholder="r/SubredditName"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                addSubreddit(e.target.value);
                                e.target.value = '';
                            }
                        }}
                    />
                    <button onClick={() => {
                        const subredditName = document.getElementById('subredditName').value;
                        addSubreddit(subredditName);
                        document.getElementById('subredditName').value = '';
                    }} className="w-full">Add Subreddit</button>
                </div>
                <div className="subreddit-list">
                    {subreddits.map(subreddit => (
                        <button key={subreddit.name} onClick={() => selectSubreddit(subreddit.name)} onContextMenu={(e) => {
                            e.preventDefault();
                            removeSubreddit(subreddit.name);
                        }}>
                            {subreddit.name}
                        </button>
                    ))}
                </div>
                <div>
                    <h2 className="text-xl font-semibold mt-4 mb-2">Theme</h2>
                    <button onClick={() => handleThemeChange('default')} className="block w-full text-left py-2 px-4 bg-gray-700 hover:bg-gray-600 rounded-md mb-1">Default</button>
                    <button onClick={() => handleThemeChange('amethyst')} className="block w-full text-left py-2 px-4 bg-gray-700 hover:bg-gray-600 rounded-md mb-1">Amethyst</button>
                </div>
                <div className="mt-4">
                    <label className="inline-flex items-center">
                        <input
                            type="checkbox"
                            className="form-checkbox h-5 w-5 text-blue-500"
                            checked={showNsfw}
                            onChange={handleNsfwToggle}
                        />
                        <span className="ml-2 text-gray-100">Show NSFW Content</span>
                    </label>
                </div>
                <div className="mt-4">
                    <a href="https://github.com/0kb-club/zennit" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                        GitHub
                    </a>
                </div>
            </div>
        );
    };

    const renderErrorPopup = () => {
        return (
            <div className="error-popup">
                <p>{errorMessage}</p>
                <button className="error-popup-button" onClick={() => setShowErrorPopup(false)}>OK</button>
            </div>
        );
    };

    const renderDeleteSavedPostPopup = () => {
        return (
            <div className="delete-saved-post-popup">
                <p>Are you sure you want to delete this saved post?</p>
                <button onClick={confirmDeleteSavedPost}>Yes</button>
                <button onClick={cancelDeleteSavedPost}>No</button>
            </div>
        );
    };

    const Toast = ({ message, onClose }) => {
        useEffect(() => {
            const timer = setTimeout(() => {
                onClose();
            }, 3000);

            return () => clearTimeout(timer);
        }, [onClose]);

        return (
            <div className="toast">
                {message}
                <button className="toast-close-button" onClick={onClose}>
                    &times;
                </button>
            </div>
        );
    };
    return (
        <div className="App">
            {renderSidebar()}
            <button className="sidebar-toggle" onClick={toggleSidebar}>
                <i className="fas fa-bars"></i>
            </button>
            <div className="content">
                <header className="bg-gray-900 p-4 flex justify-between items-center">
                    <h1 className="text-white text-2xl font-semibold">Zennit</h1>
                     <div className="sort-options">
                        <button
                            className={`sort-button ${currentSort === 'hot' ? 'active' : ''}`}
                            onClick={() => setCurrentSort('hot')}
                        >
                            Hot
                        </button>
                        <button
                            className={`sort-button ${currentSort === 'new' ? 'active' : ''}`}
                            onClick={() => setCurrentSort('new')}
                        >
                            New
                        </button>
                        <button
                            className={`sort-button ${currentSort === 'top' ? 'active' : ''}`}
                            onClick={() => setCurrentSort('top')}
                        >
                            Top
                        </button>
                        <button
                            className={`sort-button ${currentSort === 'rising' ? 'active' : ''}`}
                            onClick={() => setCurrentSort('rising')}
                        >
                            Rising
                        </button>
                    </div>
                    <form onSubmit={handleSearch} className="search-form">
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={handleSearchInputChange}
                            className="search-input"
                        />
                        <button type="submit" className="search-button">Search</button>
                    </form>
                </header>
                <div className="posts-container p-4">
                    {searchPageVisible ? (
                            <SearchPage
                                searchTerm={searchTerm}
                                onClose={() => setSearchPageVisible(false)} 
                            />
                        ) : (
                            renderPostFeed()
                        )
                    )}
                </div>
                {enlargedImage && (renderEnlargedPostImages())}
                {enlargedCommentImage && (renderEnlargedCommentImages())}
            </div>
            {showErrorPopup && renderErrorPopup()}
            {showDeletePopup && (renderDeleteSavedPostPopup())}
            {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage('')} />}
        </div>
    )
}

const rootElement = document.getElementById('root');
const root = createRoot(rootElement);
root.render(<App />);