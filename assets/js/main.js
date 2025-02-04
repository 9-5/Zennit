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
    const [selectedPostId, setSelectedPostId] = useState(null);
    const [enlargedImage, setEnlargedImage] = useState(null);
    const [enlargedCommentImage, setEnlargedCommentImage] = useState(null);
    const [showErrorPopup, setShowErrorPopup] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchPageVisible, setSearchPageVisible] = useState(false);
    const [savedPosts, setSavedPosts] = useState(() => JSON.parse(localStorage.getItem('savedPosts') || '[]'));
	const [showDeletePopup, setShowDeletePopup] = useState(false);
	const [postToDelete, setPostToDelete] = useState(null);
    const [toastMessage, setToastMessage] = useState('');
    const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true' || false);

    useEffect(() => {
        localStorage.setItem('darkMode', darkMode);
        if (darkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    }, [darkMode]);

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            document.documentElement.className = savedTheme;
        }
    }, []);

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
        const savedPosts = JSON.parse(localStorage.getItem('savedPosts') || '[]');
        setSavedPosts(savedPosts);
    }, []);

    useEffect(() => {
        if (selectedSubreddit) {
            setLoadingPosts(true);
            fetchPosts(selectedSubreddit);
        }
    }, [selectedSubreddit]);

    const addSubreddit = (newSubreddit) => {
        if (newSubreddit && !subreddits.find(sub => sub.name === newSubreddit)) {
            setSubreddits([...subreddits, { name: newSubreddit }]);
        }
    };

    const removeSubreddit = (subredditToRemove) => {
        const updatedSubreddits = subreddits.filter(sub => sub.name !== subredditToRemove);
        setSubreddits(updatedSubreddits);
        if (selectedSubreddit === subredditToRemove) {
            setSelectedSubreddit(updatedSubreddits.length > 0 ? updatedSubreddits[0].name : 'r/0KB');
        }
    };

    const fetchPosts = async (subreddit, afterParam = null) => {
        setLoadingPosts(true);
        try {
            const url = `https://www.reddit.com/${subreddit}/hot.json?limit=10${afterParam ? `&after=${afterParam}` : ''}`;
            const response = await fetch(url);
            const data = await response.json();

            if (data.error) {
                setErrorMessage(`Failed to fetch posts from ${subreddit}: ${data.message}`);
                setShowErrorPopup(true);
                setLoadingPosts(false);
                return;
            }

            const newPosts = data.data.children.map(post => post.data);
            setPosts(prevPosts => afterParam ? [...prevPosts, ...newPosts] : newPosts);
            setAfter(data.data.after);
            setContentBlockerDetected(false);
        } catch (error) {
            setContentBlockerDetected(true);
            console.error("Content Blocker Detected or Error fetching posts:", error);
        } finally {
            setLoadingPosts(false);
        }
    };

    const fetchComments = async (postId, afterParam = null, isUserComments = false) => {
        setLoadingComments(true);
        try {
            const url = `https://www.reddit.com/comments/${postId}.json?depth=1&limit=10${afterParam ? `&after=${afterParam}` : ''}`;
            const response = await fetch(url);
            const data = await response.json();

            if (Array.isArray(data) && data.length > 1 && data[1].data && data[1].data.children) {
                const newComments = data[1].data.children
                    .filter(comment => comment.kind === 't1')
                    .map(comment => comment.data);

                setComments(prevComments => afterParam ? [...prevComments, ...newComments] : newComments);
                if (isUserComments) {
                    setUserAfterComment(data[1].data.after);
                } else {
                    setAfterComment(data[1].data.after);
                }
            } else {
                console.error("Unexpected comments data structure:", data);
            }
        } catch (error) {
            console.error("Error fetching comments:", error);
        } finally {
            setLoadingComments(false);
        }
    };

    const handlePostClick = (postId) => {
        setSelectedPostId(postId);
        setComments([]);
        setAfterComment(null);
        fetchComments(postId);
    };

    const handleLoadMorePosts = () => {
        if (after) {
            fetchPosts(selectedSubreddit, after);
        }
    };

    const handleLoadMoreComments = () => {
        if (afterComment) {
            fetchComments(selectedPostId, afterComment);
        }
    };

    const handleImageClick = (imageUrl) => {
        setEnlargedImage(imageUrl);
    };

    const handleCloseEnlargedImage = () => {
        setEnlargedImage(null);
    };

    const handleCommentImageClick = (imageUrl) => {
        setEnlargedCommentImage(imageUrl);
    };

    const handleCloseEnlargedCommentImage = () => {
        setEnlargedCommentImage(null);
    };

    const handleSearch = () => {
        if (searchQuery) {
            setSearchPageVisible(true);
        }
    };

    const handleSavePost = (post) => {
        const isPostSaved = savedPosts.some(savedPost => savedPost.id === post.id);
        if (isPostSaved) {
            const updatedSavedPosts = savedPosts.filter(savedPost => savedPost.id !== post.id);
            setSavedPosts(updatedSavedPosts);
            setToastMessage('Post unsaved!');
        } else {
            setSavedPosts([...savedPosts, post]);
            setToastMessage('Post saved!');
        }
    };
	
	const handleDeleteSavedPost = (post) => {
        setPostToDelete(post);
        setShowDeletePopup(true);
    };

    const confirmDeletePost = () => {
        if (postToDelete) {
            const updatedSavedPosts = savedPosts.filter(savedPost => savedPost.id !== postToDelete.id);
            setSavedPosts(updatedSavedPosts);
            localStorage.setItem('savedPosts', JSON.stringify(updatedSavedPosts));
            setToastMessage('Post deleted!');
        }
        closeDeletePopup();
    };

    const closeDeletePopup = () => {
        setShowDeletePopup(false);
        setPostToDelete(null);
    };

    const isPostSaved = (postId) => {
        return savedPosts.some(savedPost => savedPost.id === postId);
    };
    
    const renderPost = (post) => (
        <div key={post.id} className="bg-white rounded-lg shadow-md p-4 mb-4">
            <div className="flex items-center mb-2">
                <a href={`https://www.reddit.com/${post.subreddit_name_prefixed}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline mr-2">
                    {post.subreddit_name_prefixed}
                </a>
                <span className="text-gray-700">
                    <a href={`https://www.reddit.com/user/${post.author}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                        u/{post.author}
                    </a>
                </span>
            </div>
            <h2 className="text-xl font-semibold mb-2 post-title">
                <a href={post.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    {post.title}
                </a>
            </h2>
            {post.post_hint === 'image' && (
                <img 
                    src={post.url} 
                    alt={post.title} 
                    className="mb-2 rounded-lg cursor-pointer"
                    onClick={() => handleImageClick(post.url)}
                />
            )}
            {post.post_hint === 'rich:video' && post.media && post.media.reddit_video && (
                <video controls className="mb-2 rounded-lg w-full">
                    <source src={post.media.reddit_video.fallback_url} type="video/mp4" />
                    Your browser does not support the video tag.
                </video>
            )}
            {post.thumbnail && post.post_hint !== 'image' && post.post_hint !== 'rich:video' && (
                <img 
                    src={post.thumbnail} 
                    alt={post.title} 
                    className="mb-2 rounded-lg" 
                />
            )}
            <div className="flex items-center text-gray-500">
                <span className="mr-2">Score: {post.score}</span>
                <a href={`https://www.reddit.com${post.permalink}`} target="_blank" rel="noopener noreferrer" className="hover:underline mr-2">
                    Comments: {post.num_comments}
                </a>
                <span className="mr-2">
                    <button onClick={() => handleSavePost(post)} className="text-blue-500 hover:underline">
                        {isPostSaved(post.id) ? 'Unsave' : 'Save'}
                    </button>
                </span>
                <span className="text-gray-500">
                    <a href={`https://www.reddit.com${post.permalink}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                        {new Date(post.created_utc * 1000).toLocaleString()}
                    </a>
                </span>
            </div>
        </div>
    );

    const renderPostFeed = () => (
        <div>
            {posts.map(post => (
                renderPost(post)
            ))}
            {loadingPosts && <p>Loading more posts...</p>}
            {!loadingPosts && after && (
                <button onClick={handleLoadMorePosts} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                    Load More Posts
                </button>
            )}
        </div>
    );

    const renderEnlargedPostImages = () => (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-80 flex justify-center items-center z-50" onClick={handleCloseEnlargedImage}>
            <img src={enlargedImage} alt="Enlarged Post" className="max-w-full max-h-full" />
            <button className="absolute top-4 right-4 text-white text-2xl" onClick={handleCloseEnlargedImage}>
                Close
            </button>
        </div>
    );

    const renderEnlargedCommentImages = () => (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-80 flex justify-center items-center z-50" onClick={handleCloseEnlargedCommentImage}>
            <img src={enlargedCommentImage} alt="Enlarged Comment" className="max-w-full max-h-full" />
            <button className="absolute top-4 right-4 text-white text-2xl" onClick={handleCloseEnlargedCommentImage}>
                Close
            </button>
        </div>
    );

    const renderErrorPopup = () => (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-4 rounded-lg">
                <h2 className="text-xl font-semibold mb-2">Error</h2>
                <p>{errorMessage}</p>
                <button onClick={() => setShowErrorPopup(false)} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded mt-4">
                    Close
                </button>
            </div>
        </div>
    );

    const renderDeleteSavedPostPopup = () => (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-4 rounded-lg">
                <h2 className="text-xl font-semibold mb-2">Delete Post</h2>
                <p>Are you sure you want to delete this post?</p>
                <div className="flex justify-end mt-4">
                    <button onClick={closeDeletePopup} className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded mr-2">
                        Cancel
                    </button>
                    <button onClick={confirmDeletePost} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );

    const Toast = ({ message, onClose }) => {
        useEffect(() => {
            const timer = setTimeout(() => {
                onClose();
            }, 3000);
            return () => clearTimeout(timer);
        }, [onClose]);

        return (
            <div className="fixed bottom-4 right-4 bg-green-500 text-white py-2 px-4 rounded-full shadow-lg">
                {message}
                <button onClick={onClose} className="ml-2 focus:outline-none">
                    <i className="fas fa-times"></i>
                </button>
            </div>
        );
    };

    return (
        <div className={darkMode ? 'dark-mode' : ''}>
            <div className="flex h-screen">
                <div className="w-64 bg-gray-200 p-4 subreddit-sidebar">
                    <img src="assets/zennit-logo.png" alt="Zennit Logo" className="mb-4 cursor-pointer" onClick={() => { setSearchPageVisible(false); setSelectedPostId(null); }} />
                    <h2 className="text-xl font-semibold mb-2">Subreddits</h2>
                    <ul>
                        {subreddits.map(subreddit => (
                            <li key={subreddit.name} className="mb-2">
                                <a
                                    href="#"
                                    className={selectedSubreddit === subreddit.name ? "text-blue-500" : "text-gray-700 hover:text-blue-500"}
                                    onClick={() => {
                                        setSelectedSubreddit(subreddit.name);
                                        setSearchPageVisible(false);
                                        setSelectedPostId(null);
                                    }}
                                    onContextMenu={(e) => {
                                        e.preventDefault();
                                        removeSubreddit(subreddit.name);
                                    }}
                                    onTouchStart={(e) => {
                                        //Long press detection for mobile devices
                                        let touchTimer;
                                        const touchDuration = 1000;

                                        const handleTouchStart = () => {
                                            touchTimer = setTimeout(() => {
                                                removeSubreddit(subreddit.name);
                                            }, touchDuration);
                                        };

                                        const handleTouchEnd = () => {
                                            clearTimeout(touchTimer);
                                        };

                                        handleTouchStart();

                                        e.target.addEventListener('touchend', handleTouchEnd, { once: true });
                                        e.target.addEventListener('touchcancel', handleTouchEnd, { once: true });
                                    }}
                                >
                                    {subreddit.name}
                                </a>
                            </li>
                        ))}
                    </ul>
                    <div className="mt-4">
                        <input
                            type="text"
                            placeholder="r/subreddit"
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    addSubreddit(e.target.value);
                                    e.target.value = '';
                                }
                            }}
                        />
                        <button
                            onClick={(e) => {
                                const input = e.target.previousElementSibling;
                                addSubreddit(input.value);
                                input.value = '';
                            }}
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-2"
                        >
                            Add
                        </button>
                    </div>
                    <button
                        onClick={() => setDarkMode(!darkMode)}
                        className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded mt-4 w-full"
                    >
                        {darkMode ? 'Light Mode' : 'Dark Mode'}
                    </button>
                </div>
                <div className="flex-1 p-4">
                    {selectedPostId ? (
                        <CommentSection
                            postId={selectedPostId}
                            comments={comments}
                            loadingComments={loadingComments}
                            loadMoreComments={handleLoadMoreComments}
                            handleCommentImageClick={handleCommentImageClick}
                        />
                    ) : (
                        searchPageVisible ? (
                            <SearchPage
                                searchQuery={searchQuery}
                                setSearchQuery={setSearchQuery}
                                posts={posts}
                                renderPost={renderPost}
                                handleImageClick={handleImageClick}
                                isPostSaved={isPostSaved}
                                handleSavePost={handleSavePost}
                                setShowDeletePopup={setShowDeletePopup}
                                setPostToDelete={setPostToDelete}
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