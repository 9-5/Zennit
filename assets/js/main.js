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
    const [selectedPost, setSelectedPost] = useState(null);
    const [sidebarVisible, setSidebarVisible] = useState(false);
    const [contextMenuVisible, setContextMenuVisible] = useState(false);
    const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
    const [selectedSubredditForContextMenu, setSelectedSubredditForContextMenu] = useState(null);
    const [subredditInput, setSubredditInput] = useState('');
    const [showErrorPopup, setShowErrorPopup] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
	const [selectedTheme, setSelectedTheme] = useState(localStorage.getItem('selectedTheme') || 'default');
    const [enlargedImage, setEnlargedImage] = useState(null);
    const [enlargedCommentImage, setEnlargedCommentImage] = useState(null);
    const [showDeletePopup, setShowDeletePopup] = useState(false);
    const [selectedSavedPost, setSelectedSavedPost] = useState(null);
    const [toastMessage, setToastMessage] = useState('');
    const [showSearchPage, setSearchPageVisible] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [loadingSearchResults, setLoadingSearchResults] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showLoadingSpinner, setShowLoadingSpinner] = useState(false);

    const sidebarRef = useRef(null);
    const overlayRef = useRef(null);

    const closeSidebar = () => {
        setSidebarVisible(false);
    };

    const openSidebar = () => {
        setSidebarVisible(true);
    };

    const toggleSidebar = () => {
        setSidebarVisible(!sidebarVisible);
    };

    const handleThemeChange = (themeName) => {
		setSelectedTheme(themeName);
		localStorage.setItem('selectedTheme', themeName);
	};

    const handleSubredditChange = (event) => {
        setSubredditInput(event.target.value);
    };

    const addSubreddit = () => {
        const newSubredditName = subredditInput.trim();
        if (newSubredditName && !subreddits.find(sub => sub.name.toLowerCase() === newSubredditName.toLowerCase())) {
            const newSubreddit = { name: newSubredditName };
            setSubreddits([...subreddits, newSubreddit]);
            localStorage.setItem('subreddits', JSON.stringify([...subreddits, newSubreddit]));
            setSubredditInput('');
        }
    };

    const selectSubreddit = (subredditName) => {
        setSelectedSubreddit(subredditName);
        localStorage.setItem('selectedSubreddit', subredditName);
        setPosts([]);
        setAfter(null);
        fetchPosts(subredditName);
    };

    const removeSubreddit = (subredditName) => {
        const updatedSubreddits = subreddits.filter(sub => sub.name !== subredditName);
        setSubreddits(updatedSubreddits);
        localStorage.setItem('subreddits', JSON.stringify(updatedSubreddits));
        if (selectedSubreddit === subredditName) {
            if (updatedSubreddits.length > 0) {
                selectSubreddit(updatedSubreddits[0].name);
            } else {
                setPosts([]);
                setSelectedSubreddit(null);
                localStorage.removeItem('selectedSubreddit');
            }
        }
        closeContextMenu();
    };

    const handlePostClick = (post) => {
        setSelectedPost(post);
        setComments([]);
        setAfterComment(null);
        fetchComments(post.data.permalink);
    };

    const handleImageClick = (url) => {
        setEnlargedImage(url);
    };

    const handleCommentImageClick = (url) => {
        setEnlargedCommentImage(url);
    };

    const closeEnlargedImage = () => {
        setEnlargedImage(null);
    };

    const closeEnlargedCommentImage = () => {
        setEnlargedCommentImage(null);
    };

    const handleOverlayClick = (e) => {
        if (sidebarVisible && e.target === overlayRef.current) {
            closeSidebar();
        }
    };

    const fetchPosts = async (subreddit, newAfter = null) => {
        if(loadingPosts) return;
        setLoadingPosts(true);
        setShowLoadingSpinner(true);
        try {
            let url = `https://www.reddit.com/${subreddit}/hot.json?limit=10`;
            if (newAfter) {
                url += `&after=${newAfter}`;
            }
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setPosts(prevPosts => [...prevPosts, ...data.data.children]);
            setAfter(data.data.after);
        } catch (error) {
            console.error("Could not fetch posts: " + error);
            setErrorMessage('Failed to load posts. Please check your connection and subreddit name.');
            setShowErrorPopup(true);
        } finally {
            setLoadingPosts(false);
            setShowLoadingSpinner(false);
        }
    };

    const fetchComments = async (permalink, newAfterComment = null) => {
        if(loadingComments) return;
        setLoadingComments(true);
        try {
            let url = `https://www.reddit.com${permalink}.json?limit=10`;
            if (newAfterComment) {
                url += `&after=${newAfterComment}`;
            }
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (Array.isArray(data) && data.length > 1 && data[1].data && data[1].data.children) {
                setComments(prevComments => [...prevComments, ...data[1].data.children]);
                setAfterComment(data[1].data.after);
            } else {
                console.warn("Unexpected data format for comments:", data);
            }
        } catch (error) {
            console.error("Could not fetch comments: " + error);
            setErrorMessage('Failed to load comments. Please check your connection.');
            setShowErrorPopup(true);
        } finally {
            setLoadingComments(false);
        }
    };

    const fetchMorePosts = () => {
        if (after) {
            fetchPosts(selectedSubreddit, after);
        }
    };

    const fetchMoreComments = () => {
        if (afterComment) {
            fetchComments(selectedPost.data.permalink, afterComment);
        }
    };

    const handleScroll = (event) => {
        const { scrollTop, clientHeight, scrollHeight } = event.target;
        if (scrollTop + clientHeight >= scrollHeight - 20 && !loadingPosts) {
            if (selectedPost) {
                fetchMoreComments();
            } else {
                fetchMorePosts();
            }
        }
    };

    const handleSubredditContextMenu = (e, subredditName) => {
        e.preventDefault();
        setContextMenuPosition({ x: e.clientX, y: e.clientY });
        setSelectedSubredditForContextMenu(subredditName);
        setContextMenuVisible(true);
    };

    const closeContextMenu = () => {
        setContextMenuVisible(false);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (contextMenuVisible && !event.target.closest('.context-menu') && !event.target.closest('.sidebar-list li')) {
                closeContextMenu();
            }
        };

        window.addEventListener('click', handleClickOutside);

        return () => {
            window.removeEventListener('click', handleClickOutside);
        };
    }, [contextMenuVisible]);

    useEffect(() => {
        if (selectedSubreddit) {
            fetchPosts(selectedSubreddit);
        }
    }, []);

    const renderSubreddits = () => {
        return subreddits.map((subreddit) => (
            <li
                key={subreddit.name}
                onContextMenu={(e) => handleSubredditContextMenu(e, subreddit.name)}
            >
                <a href="#" onClick={() => selectSubreddit(subreddit.name)}>
                    {subreddit.name}
                </a>
            </li>
        ));
    };

    const renderPosts = () => {
        if (!posts || posts.length === 0) {
            return <div>No posts loaded.</div>;
        }

        return posts.map((post) => {
            const postData = post.data;
            let imageUrl = null;

            if (postData.url_overridden_by_dest) {
                imageUrl = postData.url_overridden_by_dest;
            } else if (postData.preview && postData.preview.images && postData.preview.images.length > 0) {
                imageUrl = postData.preview.images[0].source.url;
            }
			
            return (
                <div key={postData.id} className="bg-gray-800 rounded shadow-md p-4 mb-4">
                    <div className="title-container">
                        <h2 className="text-xl font-semibold mb-2 text-white">
                            <a href="#" onClick={() => handlePostClick(post)}>
                                {postData.title}
                            </a>
                        </h2>
                    </div>

                    {imageUrl && (
                        <div className="mb-2">
                            <img
                                src={imageUrl}
                                alt="Post Image"
                                className="w-full rounded cursor-pointer"
                                onClick={() => handleImageClick(imageUrl)}
                            />
                        </div>
                    )}
                    <p className="text-gray-400">
                        Score: {postData.score} | Comments: {postData.num_comments}
                    </p>
                    {postData.selftext && (
                        <div className="post-preview">
                            <p className="text-gray-400 body-text">{postData.selftext}</p>
                        </div>
                    )}
                </div>
            );
        });
    };

    const renderComments = () => {
        if (!comments || comments.length === 0) {
            return <div>No comments loaded.</div>;
        }

        return comments.map((comment) => {
            const commentData = comment.data;
            let imageUrl = null;
        
            // Check if the comment body contains an image URL
            const urlRegex = /(https?:\/\/[^\s]+?(?:jpe?g|png|gif))/i;
            const match = commentData.body?.match(urlRegex);
        
            if (match) {
                imageUrl = match[0];
            }
        
            return (
                <div key={commentData.id} className="bg-gray-700 rounded shadow-md p-4 mb-4">
                    <p className="text-white body-text">{commentData.body}</p>
                    {imageUrl && (
                        <div className="mt-2">
                            <img
                                src={imageUrl}
                                alt="Comment Image"
                                className="w-full rounded cursor-pointer"
                                onClick={() => handleCommentImageClick(imageUrl)}
                            />
                        </div>
                    )}
                    <p className="text-gray-400 mt-2">Author: {commentData.author} | Score: {commentData.score}</p>
                </div>
            );
        });
    };

    const renderEnlargedPostImages = () => {
        return (
            <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-80 z-50 flex justify-center items-center" onClick={closeEnlargedImage}>
                <img id="post-image" src={enlargedImage} alt="Enlarged Post" className="max-w-full max-h-screen" />
            </div>
        );
    };

    const renderEnlargedCommentImages = () => {
        return (
            <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-80 z-50 flex justify-center items-center" onClick={closeEnlargedCommentImage}>
                <img id="comment-image" src={enlargedCommentImage} alt="Enlarged Comment" className="max-w-full max-h-screen" />
            </div>
        );
    };

    const renderSidebar = () => {
        return (
            <>
                <div ref={overlayRef} className={`overlay ${sidebarVisible ? 'active' : ''}`} onClick={handleOverlayClick}></div>
                <div ref={sidebarRef} className={`sidebar ${sidebarVisible ? 'open' : ''}`}>
                    <h2 className="text-2xl font-semibold mb-4">Subreddits</h2>
                    <ul className="sidebar-list">
                        {renderSubreddits()}
                    </ul>
                    <div>
                        <input
                            type="text"
                            className="bg-gray-700 text-white rounded p-2 w-full mb-2"
                            placeholder="r/SubredditName"
                            value={subredditInput}
                            onChange={handleSubredditChange}
                        />
                        <button onClick={addSubreddit} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                            Add Subreddit
                        </button>
                    </div>
					<div className="mt-4">
						<h3 className="text-lg font-semibold mb-2">Themes</h3>
						<button onClick={() => handleThemeChange('default')} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded mr-2">
							Default
						</button>
						<button onClick={() => handleThemeChange('amethyst')} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded">
							Amethyst
						</button>
					</div>
                </div>
            </>
        );
    };

    const renderPostFeed = () => {
        return (
            <div className="content" onScroll={handleScroll}>
                {renderPosts()}
                {loadingPosts && <div>Loading more posts...</div>}
            </div>
        );
    };

    const renderCommentSection = () => {
        return (
            <div className="comments-section" onScroll={handleScroll}>
                <button onClick={() => setSelectedPost(null)} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4">
                    Back to Posts
                </button>
                <h2 className="text-xl font-semibold mb-4 text-white">Comments</h2>
                {renderComments()}
                {loadingComments && <div>Loading more comments...</div>}
            </div>
        );
    };

    const renderContextMenu = () => {
        return (
            contextMenuVisible && (
                <div
                    className="context-menu"
                    style={{
                        top: contextMenuPosition.y,
                        left: contextMenuPosition.x,
                    }}
                >
                    <ul>
                        <li onClick={() => removeSubreddit(selectedSubredditForContextMenu)}>Remove Subreddit</li>
                    </ul>
                </div>
            )
        );
    };

    const renderErrorPopup = () => {
        return (
            <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 z-50 flex justify-center items-center">
                <div className="bg-gray-800 p-8 rounded shadow-lg">
                    <h2 className="text-xl font-semibold mb-4 text-white">Error</h2>
                    <p className="text-gray-400">{errorMessage}</p>
                    <div className="flex justify-end mt-4">
                        <button onClick={() => setShowErrorPopup(false)} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    };
    const renderDeleteSavedPostPopup = () => {
        if (!showDeletePopup) return null;
    
        return (
            <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 z-50 flex justify-center items-center">
                <div className="bg-gray-800 p-8 rounded shadow-lg">
                    <h2 className="text-xl font-semibold mb-4 text-white">Confirm Delete</h2>
                    <p className="text-gray-400">Are you sure you want to delete this saved post?</p>
                    <div className="flex justify-end mt-4">
                        <button onClick={() => setShowDeletePopup(false)} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded mr-2">
                            Cancel
                        </button>
                        <button onClick={() => { /*handleDeleteSavedPost(selectedSavedPost.id);*/ setShowDeletePopup(false); }} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const handleSearch = async (query) => {
        setSearchQuery(query);
        if (query.trim() === '') {
            setSearchResults([]);
            return;
        }

        setLoadingSearchResults(true);
        try {
            //const response = await fetch(`YOUR_SEARCH_API_ENDPOINT?q=${query}`);
            //const data = await response.json();
            //setSearchResults(data.results);
        } catch (error) {
            console.error("Search failed", error);
            setErrorMessage('Failed to perform search. Please try again.');
            setShowErrorPopup(true);
        } finally {
            setLoadingSearchResults(false);
        }
    };

    const renderSearchPage = () => {
        return (
            <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 z-50 flex justify-center items-center">
                <div className="bg-gray-800 p-8 rounded shadow-lg w-3/4 max-w-md">
                    <h2 className="text-xl font-semibold mb-4 text-white">Search</h2>
                    <input
                        type="text"
                        className="bg-gray-700 text-white rounded p-2 w-full mb-2"
                        placeholder="Enter search query"
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                    />
                    {loadingSearchResults ? (
                        <div>Loading...</div>
                    ) : (
                        <ul>
                            {searchResults.map((result) => (
                                <li key={result.id} className="text-gray-400">{result.title}</li>
                            ))}
                        </ul>
                    )}
                    <div className="flex justify-end mt-4">
                        <button onClick={() => setSearchPageVisible(false)} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className={selectedTheme}>
            {showLoadingSpinner && (
                <div className="spinner-container">
                    <div className="spinner"></div>
                </div>
            )}
            {renderSidebar()}
            {renderContextMenu()}
            <div className="container mx-auto px-4 h-screen">
                <header className="flex justify-between items-center py-4">
                    <div className="flex items-center">
                        <button onClick={toggleSidebar} className="sidebar-toggle mr-4">
                            <i className="fas fa-bars"></i>
                        </button>
                        <img src="assets/zennit-logo.png" alt="Zennit Logo" className="h-8" />
                    </div>
                    <div>
                        <button onClick={() => setSearchPageVisible(true)} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                            <i className="fas fa-search"></i>
                        </button>
                    </div>
                </header>
                <div className="content-container">
                    {selectedPost ? (
                        renderCommentSection()
                    ) : (
                        showSearchPage ? (
                            <SearchPage
                                searchQuery={searchQuery}
                                searchResults={searchResults}
                                loadingSearchResults={loadingSearchResults}
                                onSearch={handleSearch}
                                onClose={() => setSearchPageVisible(false)} 
                            />
                        ) : (
                            renderPostFeed()
                        )
                    )}
                </div>
                {enlargedImage && (renderEnlargedPostImages())}
                {enlarg