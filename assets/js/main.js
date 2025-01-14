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
    const [userComments, setUserComments] = useState([]);
    const [sortType, setSortType] = useState(localStorage.getItem('sortType') || 'hot');
    const [sidebarVisible, setSidebarVisible] = useState(false);
    const [enlargedImage, setEnlargedImage] = useState(null);
    const [enlargedCommentImage, setEnlargedCommentImage] = useState(null);
    const [showErrorPopup, setShowErrorPopup] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [showDeletePopup, setShowDeletePopup] = useState(false);
    const [postToDelete, setPostToDelete] = useState(null);
    const [toastMessage, setToastMessage] = useState('');
    const [savedPosts, setSavedPosts] = useState(() => JSON.parse(localStorage.getItem('savedPosts') || '[]'));
    const [showSaved, setShowSaved] = useState(false);
    const [searchPageVisible, setSearchPageVisible] = useState(false);

    const handleKeyDown = (event) => {
        if (event.ctrlKey && event.key === '/') {
            event.preventDefault();
            setSearchPageVisible(true);
        }
    };

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    useEffect(() => {
        localStorage.setItem('sortType', sortType);
    }, [sortType]);

    useEffect(() => {
        localStorage.setItem('selectedSubreddit', selectedSubreddit);
    }, [selectedSubreddit]);

    useEffect(() => {
        localStorage.setItem('subreddits', JSON.stringify(subreddits));
    }, [subreddits]);

    useEffect(() => {
        localStorage.setItem('savedPosts', JSON.stringify(savedPosts));
    }, [savedPosts]);

    useEffect(() => {
        fetchPosts();
    }, [selectedSubreddit, sortType, showSaved]);

    const fetchPosts = async () => {
        if (showSaved) {
            setPosts(savedPosts);
            return;
        }

        setLoadingPosts(true);
        try {
            let url = `https://www.reddit.com/${selectedSubreddit}/${sortType}.json?limit=25`;
            if (after) {
                url += `&after=${after}`;
            }
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setPosts(data.data.children.map(post => post.data));
            setAfter(data.data.after);
        } catch (error) {
            console.error("Could not fetch posts:", error);
            setErrorMessage('Failed to load posts. Please check your connection and try again.');
            setShowErrorPopup(true);
        } finally {
            setLoadingPosts(false);
        }
    };

    const fetchMorePosts = async () => {
        if (!after || showSaved) return;
        setLoadingPosts(true);
        try {
            let url = `https://www.reddit.com/${selectedSubreddit}/${sortType}.json?limit=25&after=${after}`;
            const response = await fetch(url);
            const data = await response.json();
            const newPosts = data.data.children.map(post => post.data);
            setPosts(prevPosts => [...prevPosts, ...newPosts]);
            setAfter(data.data.after);
        } catch (error) {
            console.error("Could not fetch more posts:", error);
            setErrorMessage('Failed to load more posts. Please check your connection and try again.');
            setShowErrorPopup(true);
        } finally {
            setLoadingPosts(false);
        }
    };

    const fetchComments = async (permalink) => {
        setLoadingComments(true);
        try {
            let url = `https://www.reddit.com${permalink}.json?sort=new`;
            if (afterComment) {
                url += `&after=${afterComment}`;
            }
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            if (data && data[1] && data[1].data && data[1].data.children) {
                setComments(data[1].data.children.map(comment => comment.data));
                setAfterComment(data[1].data.after);
            } else {
                console.warn("Unexpected data structure:", data);
                setComments([]);
                setAfterComment(null);
            }
        } catch (error) {
            console.error("Could not fetch comments:", error);
            setErrorMessage('Failed to load comments. Please check your connection and try again.');
            setShowErrorPopup(true);
        } finally {
            setLoadingComments(false);
        }
    };

    const fetchUserComments = async (user) => {
        setLoadingComments(true);
        try {
            let url = `https://www.reddit.com/user/${user}/comments.json?sort=new&limit=25`;
            if (userAfterComment) {
                url += `&after=${userAfterComment}`;
            }
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setUserComments(data.data.children.map(comment => comment.data));
            setUserAfterComment(data.data.after);
        } catch (error) {
            console.error("Could not fetch user comments:", error);
            setErrorMessage('Failed to load user comments. Please check your connection and try again.');
            setShowErrorPopup(true);
        } finally {
            setLoadingComments(false);
        }
    };

    const addSubreddit = (newSubreddit) => {
        if (subreddits.find(sub => sub.name === newSubreddit)) {
            setErrorMessage('Subreddit already exists.');
            setShowErrorPopup(true);
            return;
        }

        setSubreddits(prevSubreddits => [...prevSubreddits, { name: newSubreddit }]);
    };

    const removeSubreddit = (subredditToRemove) => {
        setSubreddits(prevSubreddits => prevSubreddits.filter(sub => sub.name !== subredditToRemove));
        if (selectedSubreddit === subredditToRemove) {
            setSelectedSubreddit(subreddits[0]?.name || 'r/0KB');
        }
    };

    const toggleSidebar = () => {
        setSidebarVisible(!sidebarVisible);
    };

    const handleImageEnlarge = (imageUrl) => {
        setEnlargedImage(imageUrl);
    };

    const handleCommentImageEnlarge = (imageUrl) => {
        setEnlargedCommentImage(imageUrl);
    };

    const handleCloseEnlargedImage = () => {
        setEnlargedImage(null);
        setEnlargedCommentImage(null);
    };

    const handleSavePost = (post) => {
        const alreadySaved = savedPosts.some(savedPost => savedPost.id === post.id);
        if (alreadySaved) {
            setToastMessage('Post already saved!');
            return;
        }

        setSavedPosts(prevSavedPosts => {
            const updatedSavedPosts = [...prevSavedPosts, post];
            localStorage.setItem('savedPosts', JSON.stringify(updatedSavedPosts));
            setToastMessage('Post saved!');
            return updatedSavedPosts;
        });
    };

    const handleDeletePost = (post) => {
        setPostToDelete(post);
        setShowDeletePopup(true);
    };

    const confirmDeletePost = () => {
        if (!postToDelete) return;
        const updatedSavedPosts = savedPosts.filter(savedPost => savedPost.id !== postToDelete.id);
        setSavedPosts(updatedSavedPosts);
        localStorage.setItem('savedPosts', JSON.stringify(updatedSavedPosts));
        setShowDeletePopup(false);
        setToastMessage('Post deleted!');
        setPostToDelete(null);

        if (showSaved) {
            setPosts(updatedSavedPosts);
        }
    };

    const cancelDeletePost = () => {
        setShowDeletePopup(false);
        setPostToDelete(null);
    };

    const renderPost = (post) => {
        const isSaved = savedPosts.some(savedPost => savedPost.id === post.id);

        return (
            <div key={post.id} className="bg-gray-800 rounded-lg shadow-md p-4 mb-4">
                <div className="flex items-center mb-2">
                    <img src={post.thumbnail} alt={post.subreddit} className="w-8 h-8 rounded-full mr-3" onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'assets/favicon/favicon-96x96.png';
                    }} />
                    <div className="text-gray-400">
                        <a href={`https://www.reddit.com/user/${post.author}`} target="_blank" rel="noopener noreferrer" className="hover:text-blue-500">{post.author}</a>
                        {' '}in{' '}
                        <a href={`https://www.reddit.com/${post.subreddit_name_prefixed}`} target="_blank" rel="noopener noreferrer" className="hover:text-blue-500">{post.subreddit_name_prefixed}</a>
                    </div>
                </div>

                <div className="title-container">
                    <a href={post.url} target="_blank" rel="noopener noreferrer" className="text-xl font-semibold text-white hover:text-blue-500 break-words">
                        {post.title}
                    </a>
                </div>

                {post.post_hint === 'image' && (
                    <div className="mt-2 cursor-pointer" onClick={() => handleImageEnlarge(post.url)}>
                        <img src={post.url} alt={post.title} className="rounded-md max-h-64 w-full object-cover" />
                    </div>
                )}

                {post.selftext && (
                    <div className="body-text mt-2 text-gray-300">
                        {post.selftext}
                    </div>
                )}

                <div className="flex items-center mt-4 text-gray-400">
                    <button onClick={() => fetchComments(post.permalink)} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mr-2">
                        View Comments
                    </button>
                    <button
                        onClick={() => handleSavePost(post)}
                        className={`bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mr-2 ${isSaved ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={isSaved}
                    >
                        {isSaved ? 'Saved' : 'Save'}
                    </button>
                    {showSaved && (
                        <button onClick={() => handleDeletePost(post)} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                            Delete
                        </button>
                    )}
                    <span className="ml-auto">Score: {post.score}</span>
                </div>

                {comments.length > 0 && (
                    <div className="mt-4">
                        <h3 className="text-lg font-semibold text-white mb-2">Comments:</h3>
                        {comments.map(comment => (
                            <div key={comment.id} className="bg-gray-700 rounded-lg p-3 mb-2">
                                <div className="text-gray-400">
                                    <a href={`https://www.reddit.com/user/${comment.author}`} target="_blank" rel="noopener noreferrer" className="hover:text-blue-500">{comment.author}</a>
                                </div>
                                <div className="text-gray-300 body-text">
                                    {comment.body}
                                </div>
                                {comment.body && comment.body.match(/\.(jpeg|jpg|gif|png)$/) && (
                                    <div className="mt-2 cursor-pointer" onClick={() => handleCommentImageEnlarge(comment.body)}>
                                        <img src={comment.body} alt="Comment Image" className="rounded-md max-h-64 w-full object-cover" />
                                    </div>
                                )}
                                <div className="text-gray-400 mt-2">Score: {comment.score}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const renderPostFeed = () => {
        if (loadingPosts) {
            return <div className="text-center text-white">Loading posts...</div>;
        }

        if (posts.length === 0) {
            return <div className="text-center text-white">No posts to display.</div>;
        }

        return (
            <>
                {posts.map(post => renderPost(post))}
                {!showSaved && (
                    <div className="text-center">
                        {loadingPosts ? (
                            <p className="text-white">Loading more posts...</p>
                        ) : (
                            <button onClick={fetchMorePosts} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                                Load More
                            </button>
                        )}
                    </div>
                )}
            </>
        );
    };

    const renderEnlargedPostImages = () => {
        return (
            <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-80 z-50 flex justify-center items-center" onClick={handleCloseEnlargedImage}>
                <img src={enlargedImage} alt="Enlarged" className="max-w-full max-h-full object-contain" />
            </div>
        );
    };

    const renderEnlargedCommentImages = () => {
        return (
            <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-80 z-50 flex justify-center items-center" onClick={handleCloseEnlargedImage}>
                <img src={enlargedCommentImage} alt="Enlarged Comment Image" className="max-w-full max-h-full object-contain" />
            </div>
        );
    };

    const renderErrorPopup = () => {
        return (
            <div className="fixed top-0 left-0 w-full h-full bg-gray-900 bg-opacity-50 z-50 flex justify-center items-center">
                <div className="bg-gray-800 p-8 rounded-lg shadow-lg">
                    <h2 className="text-2xl font-semibold text-white mb-4">Error</h2>
                    <p className="text-red-500">{errorMessage}</p>
                    <div className="flex justify-end mt-4">
                        <button onClick={() => setShowErrorPopup(false)} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const renderDeleteSavedPostPopup = () => {
        return (
            <div className="fixed top-0 left-0 w-full h-full bg-gray-900 bg-opacity-50 z-50 flex justify-center items-center">
                <div className="bg-gray-800 p-8 rounded-lg shadow-lg">
                    <h2 className="text-2xl font-semibold text-white mb-4">Delete Post</h2>
                    <p className="text-gray-300">Are you sure you want to delete this saved post?</p>
                    <div className="flex justify-end mt-4">
                        <button onClick={confirmDeletePost} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mr-2">
                            Yes, Delete
                        </button>
                        <button onClick={cancelDeletePost} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                            Cancel
                        </button>
                    </div>
                </div>
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
            <div className="fixed bottom-4 right-4 bg-green-500 text-white py-2 px-4 rounded-full shadow-lg">
                {message}
                <button onClick={onClose} className="ml-2 focus:outline-none">
                    <i className="fas fa-times"></i>
                </button>
            </div>
        );
    };

    return (
        <div className="flex h-screen bg-gray-900">
            {/* Sidebar */}
            <div className={`bg-gray-700 w-64 p-4 shadow-md transform ${sidebarVisible ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out`}>
                <div className="cursor-pointer mb-6" onClick={toggleSidebar}>
                    <img src="assets/zennit-logo.png" alt="Zennit Logo" className="w-48" />
                </div>

                <div className="mb-4">
                    <h2 className="text-lg font-semibold text-white mb-2">Subreddits</h2>
                    <ul>
                        {subreddits.map(subreddit => (
                            <li key={subreddit.name} className={`text-gray-300 hover:text-blue-500 cursor-pointer mb-1 ${selectedSubreddit === subreddit.name ? 'text-blue-500' : ''}`} onClick={() => {
                                setSelectedSubreddit(subreddit.name);
                                setSidebarVisible(false);
                                setAfter(null);
                            }}>
                                {subreddit.name}
                            </li>
                        ))}
                    </ul>
                </div>

                <SubredditForm addSubreddit={addSubreddit} />
                <button onClick={() => setShowSaved(!showSaved)} className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mt-4 w-full">
                    {showSaved ? 'Show Subreddits' : 'Show Saved Posts'}
                </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-y-auto">
                {/* Header */}
                <header className="bg-gray-800 p-4 flex justify-between items-center shadow-md">
                    <div className="flex items-center">
                        <div className="cursor-pointer mr-6" onClick={toggleSidebar}>
                            <img src="assets/zennit-logo.png" alt="Zennit Logo" className="w-32" />
                        </div>
                        <div className="flex">
                            <button onClick={() => setSortType('hot')} className={`text-white px-4 py-2 rounded ${sortType === 'hot' ? 'bg-gray-600' : 'hover:bg-gray-700'}`}>Hot</button>
                            <button onClick={() => setSortType('new')} className={`text-white px-4 py-2 rounded ${sortType === 'new' ? 'bg-gray-600' : 'hover:bg-gray-700'}`}>New</button>
                            <button onClick={() => setSortType('top')} className={`text-white px-4 py-2 rounded ${sortType === 'top' ? 'bg-gray-600' : 'hover:bg-gray-700'}`}>Top</button>
                            <button onClick={() => setSortType('rising')} className={`text-white px-4 py-2 rounded ${sortType === 'rising' ? 'bg-gray-600' : 'hover:bg-gray-700'}`}>Rising</button>
                        </div>
                    </div>
                    <button
                        onClick={() => setSearchPageVisible(true)}
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    >
                        Search
                    </button>
                </header>

                {/* Post Feed */}
                <div className="p-4">
                    {!contentBlockerDetected ? (
                        (searchPageVisible) ? (
                            <SearchPage
                                onClose={() => setSearchPageVisible(false)} 
                            />
                        ) : (
                            renderPostFeed()
                        )
                    ) : (
                        <div className="bg-red-200 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                            <strong className="font-bold">Content Blocker Detected!</strong>
                            <span className="block sm:inline">Please disable your content blocker to view this page properly.</span>
                        </div>
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

const SubredditForm = ({ addSubreddit }) => {
    const [newSubreddit, setNewSubreddit] = useState('');

    const handleSubmit = (event) => {
        event.preventDefault();
        if (newSubreddit.trim() !== '') {
            addSubreddit(newSubreddit);
            setNewSubreddit('');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="mt-4">
            <input
                type="text"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-800 text-white"
                placeholder="Enter subreddit (e.g., r/aww)"
                value={newSubreddit}
                onChange={e => setNewSubreddit(e.target.value)}
            />
            <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mt-2 w-full">
                Add Subreddit
            </button>
        </form>
    );
};

const rootElement = document.getElementById('root');
const root = createRoot(rootElement);
root.render(<App />);