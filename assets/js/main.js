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
    const [showSidebar, setShowSidebar] = useState(false);
	const [showSearch, setShowSearch] = useState(false);
    const [selectedPost, setSelectedPost] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searchPageVisible, setSearchPageVisible] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [currentTheme, setCurrentTheme] = useState(localStorage.getItem('theme') || 'dark');
    const [enlargedImage, setEnlargedImage] = useState(null);
    const [enlargedCommentImage, setEnlargedCommentImage] = useState(null);
    const [showErrorPopup, setShowErrorPopup] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [showDeletePopup, setShowDeletePopup] = useState(false);
    const [postToDelete, setPostToDelete] = useState(null);
    const [savedPosts, setSavedPosts] = useState(() => JSON.parse(localStorage.getItem('savedPosts') || '[]'));
    const [toastMessage, setToastMessage] = useState('');

    const sidebarRef = useRef(null);

    useEffect(() => {
        document.documentElement.className = currentTheme;
        localStorage.setItem('theme', currentTheme);
    }, [currentTheme]);

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
        const saved = localStorage.getItem('savedPosts');
        if (saved) {
            setSavedPosts(JSON.parse(saved));
        }
    }, []);

    useEffect(() => {
        const checkContentBlocker = async () => {
            try {
                const testAd = await fetch('https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js');
                if (!testAd.ok) {
                    setContentBlockerDetected(true);
                }
            } catch (error) {
                setContentBlockerDetected(true);
            }
        };

        checkContentBlocker();
    }, []);

    useEffect(() => {
        fetchPosts(selectedSubreddit);
    }, [selectedSubreddit]);

    const handleImageClick = (imageUrl) => {
        setEnlargedImage(imageUrl);
    };

    const handleCommentImageClick = (imageUrl) => {
        setEnlargedCommentImage(imageUrl);
    };

    const closeEnlargedImage = () => {
        setEnlargedImage(null);
        setEnlargedCommentImage(null);
    };

    const fetchPosts = async (subreddit, loadMore = false) => {
        if (loadMore) {
            setLoadingPosts(true);
        } else {
            setLoadingPosts(true);
            setPosts([]);
            setAfter(null);
        }
        try {
            let url = `https://www.reddit.com/${subreddit}/hot.json?raw_json=1&limit=10`;
            if (loadMore && after) {
                url += `&after=${after}`;
            }
            const response = await fetch(url);
            const data = await response.json();
            if (data.data && data.data.children) {
                const newPosts = data.data.children.map(post => post.data);
                setPosts(prevPosts => loadMore ? [...prevPosts, ...newPosts] : newPosts);
                setAfter(data.data.after);
            } else {
                console.error('Error fetching posts:', data);
            }
        } catch (error) {
            console.error('Error fetching posts:', error);
        } finally {
            setLoadingPosts(false);
        }
    };

    const fetchComments = async (permalink, loadMore = false) => {
        if (!permalink) {
            console.error('Permalink is undefined or null');
            return;
        }
        if (loadMore) {
            setLoadingComments(true);
        } else {
            setLoadingComments(true);
            setComments([]);
            setAfterComment(null);
        }
        try {
            let url = `https://www.reddit.com${permalink}.json?raw_json=1&sort=confidence&limit=5`;
            if (loadMore && afterComment) {
                url += `&after=${afterComment}`;
            }
            const response = await fetch(url);
            const data = await response.json();
			if (Array.isArray(data) && data.length > 1 && data[1].data && data[1].data.children) {
				const newComments = data[1].data.children.map(comment => comment.data);
				setComments(prevComments => loadMore ? [...prevComments, ...newComments] : newComments);
				setAfterComment(data[1].data.after);
			} else {
				console.error('Error fetching comments:', data);
			}
        } catch (error) {
            console.error('Error fetching comments:', error);
        } finally {
            setLoadingComments(false);
        }
    };

    const handleSubredditChange = (event) => {
        setSelectedSubreddit(event.target.value);
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

    const handlePostClick = (post) => {
        setSelectedPost(post);
        fetchComments(post.permalink);
    };

    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
    };

    const handleSearchSubmit = async (event) => {
        event.preventDefault();
        setSearchPageVisible(true);
        setSearchResults([]);
        try {
            const response = await fetch(`https://www.reddit.com/search.json?q=${searchTerm}&raw_json=1`);
            const data = await response.json();
            if (data.data && data.data.children) {
                setSearchResults(data.data.children.map(result => result.data));
            }
        } catch (error) {
            console.error('Error fetching search results:', error);
        }
    };

    const handleThemeChange = (theme) => {
        setCurrentTheme(theme);
    };

    const toggleSidebar = () => {
        setShowSidebar(!showSidebar);
    };

	const toggleSearch = () => {
		setShowSearch(!showSearch);
	}

    const handleLoadMorePosts = () => {
        fetchPosts(selectedSubreddit, true);
    };

    const handleLoadMoreComments = () => {
        if (selectedPost) {
            fetchComments(selectedPost.permalink, true);
        }
    };

    const savePost = (post) => {
        const alreadySaved = savedPosts.find(savedPost => savedPost.id === post.id);
        if (alreadySaved) {
            setErrorMessage('Post already saved.');
            setShowErrorPopup(true);
            return;
        }
        setSavedPosts([...savedPosts, post]);
        setToastMessage('Post saved!');
    };

    const deleteSavedPost = (post) => {
        setPostToDelete(post);
        setShowDeletePopup(true);
    };

    const confirmDeletePost = () => {
        setSavedPosts(savedPosts.filter(savedPost => savedPost.id !== postToDelete.id));
        setShowDeletePopup(false);
        setToastMessage('Post deleted!');
    };

    const cancelDeletePost = () => {
        setShowDeletePopup(false);
    };

    const renderPost = (post) => {
        let imageUrl = null;
        if (post.url_overridden_by_dest) {
            if (post.url_overridden_by_dest.match(/\.(jpeg|jpg|gif|png)$/) != null) {
                imageUrl = post.url_overridden_by_dest;
            }
        }
        const isSaved = savedPosts.some(savedPost => savedPost.id === post.id);
        return (
            <div key={post.id} className="bg-gray-900 rounded-lg shadow-md p-4 mb-4">
                <div className="flex items-center mb-2">
                    <img src={post.thumbnail} alt={post.subreddit} className="w-8 h-8 rounded-full mr-2" />
                    <div className="text-sm">
                        <a href={`https://www.reddit.com/${post.subreddit_name_prefixed}`} target="_blank" rel="noopener noreferrer" className="text-white font-semibold hover:underline">{post.subreddit_name_prefixed}</a>
                        <p className="text-gray-400">Posted by u/{post.author}</p>
                    </div>
                </div>
                <div className="title-container">
                    <h2 className="text-xl font-semibold mb-2 text-white">{post.title}</h2>
                </div>
                {imageUrl && (
                    <img
                        src={imageUrl}
                        alt={post.title}
                        className="w-full h-auto rounded-md mb-2 cursor-pointer"
                        onClick={() => handleImageClick(imageUrl)}
                    />
                )}
                {post.is_video && (
                    <video controls className="w-full h-auto rounded-md mb-2">
                        <source src={post.media.reddit_video.fallback_url} type="video/mp4" />
                        Your browser does not support the video tag.
                    </video>
                )}
                {post.selftext && (
                    <div className="body-text">
                        <p className="text-gray-300 mb-2">{post.selftext}</p>
                    </div>
                )}
                <div className="flex justify-between items-center">
                    <a href={`https://www.reddit.com${post.permalink}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                        View on Reddit
                    </a>
                    <div>
                        <button onClick={() => handlePostClick(post)} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-2">
                            Comments
                        </button>
                        {!isSaved ? (
                            <button onClick={() => savePost(post)} className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
                                Save
                            </button>
                        ) : (
                            <button onClick={() => deleteSavedPost(post)} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
                                Delete
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const renderComment = (comment) => {
        let imageUrl = null;
        if (comment.body.match(/\.(jpeg|jpg|gif|png)$/) != null) {
            imageUrl = comment.body;
        }
        return (
            <div key={comment.id} className="bg-gray-800 rounded-lg shadow-md p-4 mb-4">
                <div className="flex items-center mb-2">
                    <div className="text-sm">
                        <p className="text-gray-400">u/{comment.author}</p>
                    </div>
                </div>
                {imageUrl && (
                    <img
                        src={imageUrl}
                        alt={comment.author}
                        className="w-full h-auto rounded-md mb-2 cursor-pointer"
                        onClick={() => handleCommentImageClick(imageUrl)}
                    />
                )}
                <div className="body-text">
                    <p className="text-gray-300 mb-2">{comment.body}</p>
                </div>
            </div>
        );
    };

    const renderPostFeed = () => (
        <div>
            {posts.map(post => (
                renderPost(post)
            ))}
            {loadingPosts && <p className="text-center">Loading...</p>}
            {!loadingPosts && after && (
                <div className="flex justify-center">
                    <button onClick={handleLoadMorePosts} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded m-3">
                        Load More Posts
                    </button>
                </div>
            )}
        </div>
    );

    const renderCommentsSection = () => (
        <div>
            <h2 className="text-2xl font-semibold mb-4 text-white">Comments</h2>
            {comments.map(comment => (
                renderComment(comment)
            ))}
            {loadingComments && <p className="text-center">Loading...</p>}
            {!loadingComments && afterComment && (
                <div className="flex justify-center">
                    <button onClick={handleLoadMoreComments} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded m-3">
                        Load More Comments
                    </button>
                </div>
            )}
        </div>
    );

    const renderSubredditList = () => (
        <ul>
            {subreddits.map(subreddit => (
                <li key={subreddit.name} className="mb-2">
                    <button
                        onClick={() => setSelectedSubreddit(subreddit.name)}
                        className={`block w-full text-left px-4 py-2 rounded hover:bg-gray-700 ${selectedSubreddit === subreddit.name ? 'bg-gray-700' : ''}`}
                    >
                        {subreddit.name}
                    </button>
                </li>
            ))}
        </ul>
    );

    const renderEnlargedPostImages = () => (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-80 flex justify-center items-center z-50" onClick={closeEnlargedImage}>
            <img src={enlargedImage} alt="Enlarged" className="max-w-5xl max-h-5xl rounded-md" />
        </div>
    );

    const renderEnlargedCommentImages = () => (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-80 flex justify-center items-center z-50" onClick={closeEnlargedImage}>
            <img src={enlargedCommentImage} alt="Enlarged" className="max-w-5xl max-h-5xl rounded-md" />
        </div>
    );

    const renderErrorPopup = () => (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-gray-700 p-8 rounded-md">
                <h2 className="text-xl font-semibold mb-4 text-white">Error</h2>
                <p className="text-gray-300">{errorMessage}</p>
                <div className="flex justify-end mt-4">
                    <button onClick={() => setShowErrorPopup(false)} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                        OK
                    </button>
                </div>
            </div>
        </div>
    );

    const renderDeleteSavedPostPopup = () => (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-gray-700 p-8 rounded-md">
                <h2 className="text-xl font-semibold mb-4 text-white">Delete Post</h2>
                <p className="text-gray-300">Are you sure you want to delete this saved post?</p>
                <div className="flex justify-end mt-4">
                    <button onClick={confirmDeletePost} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded mr-2">
                        Delete
                    </button>
                    <button onClick={cancelDeletePost} className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">
                        Cancel
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
            <div className="fixed bottom-4 left-4 bg-green-500 text-white py-2 px-4 rounded-md shadow-lg z-50">
                {message}
                <button onClick={onClose} className="ml-4 focus:outline-none">
                    <i className="fas fa-times"></i>
                </button>
            </div>
        );
    };

    const Settings = ({ isOpen, onClose }) => {
        if (!isOpen) return null;

        return (
            <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex justify-center items-center z-50">
                <div className="bg-gray-800 p-8 rounded-md">
                    <h2 className="text-xl font-semibold mb-4 text-white">Settings</h2>
                    <div className="mb-4">
                        <label className="block text-gray-300 text-sm font-bold mb-2">
                            Theme
                        </label>
                        <div className="flex">
                            <button
                                onClick={() => handleThemeChange('light-theme')}
                                className={`bg-gray-900 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded mr-2 ${currentTheme === 'light-theme' ? 'bg-gray-700' : ''}`}
                            >
                                Light
                            </button>
                            <button
                                onClick={() => handleThemeChange('dark')}
                                className={`bg-gray-900 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded mr-2 ${currentTheme === 'dark' ? 'bg-gray-700' : ''}`}
                            >
                                Dark
                            </button>
                            <button
                                onClick={() => handleThemeChange('amethyst')}
                                className={`bg-gray-900 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded ${currentTheme === 'amethyst' ? 'bg-gray-700' : ''}`}
                            >
                                Amethyst
                            </button>
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <button onClick={onClose} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const SearchPage = ({ searchTerm, searchResults, onClose }) => {
        return (
            <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex justify-center items-center z-50">
                <div className="bg-gray-800 p-8 rounded-md w-4/5 max-h-5xl overflow-y-auto">
                    <h2 className="text-2xl font-semibold mb-4 text-white">Search Results for "{searchTerm}"</h2>
                    {searchResults.length > 0 ? (
                        searchResults.map(post => (
                            <div key={post.id} className="bg-gray-900 rounded-lg shadow-md p-4 mb-4">
                                <div className="flex items-center mb-2">
                                    <img src={post.thumbnail} alt={post.subreddit} className="w-8 h-8 rounded-full mr-2" />
                                    <div className="text-sm">
                                        <a href={`https://www.reddit.com/${post.subreddit_name_prefixed}`} target="_blank" rel="noopener noreferrer" className="text-white font-semibold hover:underline">{post.subreddit_name_prefixed}</a>
                                        <p className="text-gray-400">Posted by u/{post.author}</p>
                                    </div>
                                </div>
                                <div className="title-container">
                                    <h2 className="text-xl font-semibold mb-2 text-white">{post.title}</h2>
                                </div>
                                <a href={`https://www.reddit.com${post.permalink}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                                    View on Reddit
                                </a>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-300">No results found.</p>
                    )}
                    <div className="flex justify-end mt-4">
                        <button onClick={onClose} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="flex h-screen">
            {contentBlockerDetected && (
                <div className="absolute top-0 left-0 w-full h-full bg-gray-900 text-white flex justify-center items-center z-50">
                    <div className="text-center">
                        <h2 className="text-2xl font-semibold mb-4">Content Blocker Detected</h2>
                        <p className="mb-4">Please disable your content blocker to use Zennit.</p>
                    </div>
                </div>
            )}
            <div className="w-64 bg-gray-800 text-white flex-shrink-0 h-full">
                <div className="p-4">
                    <img src="assets/zennit-logo.png" alt="Zennit" className="w-32 cursor-pointer" onClick={toggleSidebar} />
                </div>
                {showSidebar && (
                    <div className="p-4">
                        <h2 className="text-xl font-semibold mb-2">Subreddits</h2>
                        {renderSubredditList()}
                        <div className="mt-4">
                            <input
                                type="text"
                                placeholder="r/SubredditName"
                                className="bg-gray-700 text-white rounded-md p-2 mb-2 w-full"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        addSubreddit(e.target.value);
                                        e.target.value = '';
                                    }
                                }}
                            />
                            <button
                                onClick={(e) => {
                                    const input = e.target.parentElement.querySelector('input');
                                    addSubreddit(input.value);
                                    input.value = '';
                                }}
                                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full"
                            >
                                Add Subreddit
                            </button>
                        </div>
                    </div>
                )}
            </div>
            <div className="flex-1 p-8 h-full overflow-y-auto">
				<div className="flex justify-between items-center mb-4">
					<h1 className="text-3xl font-semibold text-white">{selectedSubreddit}</h1>
					<div>
						<button onClick={() => setIsSettingsOpen(true)} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded mr-2">
							<i className="fas fa-cog"></i>
						</button>
						<button onClick={toggleSearch} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded">
							<i className="fas fa-search"></i>
						</button>
					</div>
				</div>
				{showSearch && (
					<form onSubmit={handleSearchSubmit} className="mb-4">
						<div className="flex">
							<input
								type="text"
								placeholder="Search Reddit"
								className="bg-gray-700 text-white rounded-md p-2 w-full mr-2"
								value={searchTerm}
								onChange={handleSearchChange}
							/>
							<button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
								Search
							</button>
						</div>
					</form>
				)}
                <Settings isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
                {selectedPost ? (
                    renderCommentsSection()
                ) : (
                    !searchPageVisible ? (
                        renderPostFeed()
                    ) : (
                        <SearchPage
                            searchTerm={searchTerm}
                            searchResults={searchResults}
                            onClose={() => setSearchPageVisible(false)} 
                            />
                        )
                    )}
                {enlargedImage && (renderEnlargedPostImages())}
                {enlargedCommentImage && (renderEnlargedCommentImages