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
    const [userData, setUserData] = useState([]);
    const [savedPosts, setSavedPosts] = useState(() => JSON.parse(localStorage.getItem('savedPosts') || '[]'));
    const [newSubreddit, setNewSubreddit] = useState('');
	const [enlargedImage, setEnlargedImage] = useState(null);
	const [enlargedCommentImage, setEnlargedCommentImage] = useState(null);
    const [toastMessage, setToastMessage] = useState('');
    const [sidebarVisible, setSidebarVisible] = useState(false);
    const [postSort, setPostSort] = useState(localStorage.getItem('postSort') || 'hot');
    const [showErrorPopup, setShowErrorPopup] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [currentTheme, setCurrentTheme] = useState(localStorage.getItem('theme') || 'default');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchPageVisible, setSearchPageVisible] = useState(false);
    const [deleteSavedPostId, setDeleteSavedPostId] = useState(null);
    const [showDeletePopup, setShowDeletePopup] = useState(false);

    const observerRef = useRef(null);
    const observerCommentRef = useRef(null);
    const observerUserCommentRef = useRef(null);
    const postsRef = useRef(posts);
    const savedPostsRef = useRef(savedPosts);
    const subredditsRef = useRef(subreddits);
    postsRef.current = posts;
    savedPostsRef.current = savedPosts;
    subredditsRef.current = subreddits;

    useEffect(() => {
        localStorage.setItem('theme', currentTheme);
        document.documentElement.className = currentTheme;
    }, [currentTheme]);

    useEffect(() => {
        localStorage.setItem('postSort', postSort);
    }, [postSort]);

    useEffect(() => {
        localStorage.setItem('selectedSubreddit', selectedSubreddit);
        fetchPosts(selectedSubreddit, postSort);
    }, [selectedSubreddit, postSort]);

    useEffect(() => {
        localStorage.setItem('subreddits', JSON.stringify(subreddits));
    }, [subreddits]);

    useEffect(() => {
        localStorage.setItem('savedPosts', JSON.stringify(savedPosts));
    }, [savedPosts]);

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') || 'default';
        document.documentElement.className = savedTheme;
        setCurrentTheme(savedTheme);
    }, []);

    useEffect(() => {
        const detectAdBlock = () => {
            if (document.querySelector('. AdSense')) {
                setContentBlockerDetected(true);
            } else {
                setContentBlockerDetected(false);
            }
        };

        window.addEventListener('load', detectAdBlock);

        return () => {
            window.removeEventListener('load', detectAdBlock);
        };
    }, []);

    const fetchPosts = async (subreddit, sort) => {
        setLoadingPosts(true);
        try {
            let url = `https://www.reddit.com/${subreddit}/${sort}.json?limit=25`;
            if (after) {
                url += `&after=${after}`;
            }
            const response = await fetch(url);
            const data = await response.json();
            if (after) {
                setPosts(prevPosts => [...prevPosts, ...data.data.children]);
            } else {
                setPosts(data.data.children);
            }
            setAfter(data.data.after);
        } catch (error) {
            setErrorMessage('Failed to load posts. Please check your internet connection and the subreddit name.');
            setShowErrorPopup(true);
        } finally {
            setLoadingPosts(false);
        }
    };

    const fetchComments = async (permalink) => {
        setLoadingComments(true);
        try {
            let url = `https://www.reddit.com${permalink}.json?limit=25`;
            if (afterComment) {
                url += `&after=${afterComment}`;
            }
            const response = await fetch(url);
            const data = await response.json();
            setComments(data[1].data.children);
            setAfterComment(data[1].data.after);
        } catch (error) {
            console.error("Error fetching comments:", error);
            setToastMessage('Failed to load comments.');
        } finally {
            setLoadingComments(false);
        }
    };
	
	const fetchUserComments = async (user) => {
        setLoadingComments(true);
        try {
            let url = `https://www.reddit.com/user/${user}/comments.json?limit=25`;
            if (userAfterComment) {
                url += `&after=${userAfterComment}`;
            }
            const response = await fetch(url);
            const data = await response.json();
            setUserData(data.data.children);
            setUserAfterComment(data.data.after);
        } catch (error) {
            console.error("Error fetching user comments:", error);
            setToastMessage('Failed to load user comments.');
        } finally {
            setLoadingComments(false);
        }
    };

    const handleScroll = React.useCallback(() => {
        if (loadingPosts) return;
        if (window.innerHeight + document.documentElement.scrollTop < document.documentElement.offsetHeight - 100) return;
        fetchPosts(selectedSubreddit, postSort);
    }, [loadingPosts, selectedSubreddit, postSort, fetchPosts]);

    const handleCommentScroll = React.useCallback(() => {
        if (loadingComments) return;
        if (window.innerHeight + document.documentElement.scrollTop < document.documentElement.offsetHeight - 100) return;
        //fetchComments(selectedSubreddit, postSort);
    }, [loadingComments]);
	
	const handleUserCommentScroll = React.useCallback(() => {
        if (loadingComments) return;
        if (window.innerHeight + document.documentElement.scrollTop < document.documentElement.offsetHeight - 100) return;
        //fetchComments(selectedSubreddit, postSort);
    }, [loadingComments]);

    useEffect(() => {
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [handleScroll]);

    const addSubreddit = (event) => {
        event.preventDefault();
        if (newSubreddit.trim() !== '') {
            const subredditExists = subreddits.some(sub => sub.name.toLowerCase() === newSubreddit.toLowerCase());
            if (!subredditExists) {
                setSubreddits([...subreddits, { name: newSubreddit }]);
                setNewSubreddit('');
            } else {
                setToastMessage('Subreddit already exists.');
            }
        }
    };

    const removeSubreddit = (subredditToRemove) => {
        setSubreddits(subreddits.filter(subreddit => subreddit.name !== subredditToRemove));
        if (selectedSubreddit === subredditToRemove) {
            setSelectedSubreddit(subreddits[0]?.name || 'r/0KB');
        }
    };

    const toggleSavePost = (post) => {
        const isSaved = savedPostsRef.current.some(savedPost => savedPost.data.id === post.data.id);
        if (isSaved) {
            setDeleteSavedPostId(post.data.id);
            setShowDeletePopup(true);
        } else {
            setSavedPosts([...savedPostsRef.current, post]);
            setToastMessage('Post saved!');
        }
    };

    const confirmDeleteSavedPost = () => {
        setSavedPosts(savedPostsRef.current.filter(savedPost => savedPost.data.id !== deleteSavedPostId));
        setShowDeletePopup(false);
        setToastMessage('Post unsaved!');
    };

    const cancelDeleteSavedPost = () => {
        setShowDeletePopup(false);
    };

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

    const toggleSidebar = () => {
        setSidebarVisible(!sidebarVisible);
    };

    const setTheme = (themeName) => {
        localStorage.setItem('theme', themeName);
        document.documentElement.className = themeName;
        setCurrentTheme(themeName);
    }

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const closeMenu = () => {
        setIsMenuOpen(false);
    };

    const toggleUserMenu = () => {
        setUserMenuOpen(!userMenuOpen);
    };

     const closeUserMenu = () => {
        setUserMenuOpen(false);
    };
	
	const handleSearch = () => {
        if (searchQuery.trim() !== '') {
            setSearchPageVisible(true);
        }
    };

    const renderErrorPopup = () => (
        <div className="error-popup">
            <p>{errorMessage}</p>
            <button onClick={() => setShowErrorPopup(false)}>Close</button>
        </div>
    );

    const renderDeleteSavedPostPopup = () => (
        <div className="delete-saved-post-popup">
            <p>Unsave this post?</p>
            <button onClick={confirmDeleteSavedPost}>Yes</button>
            <button onClick={cancelDeleteSavedPost}>No</button>
        </div>
    );

	const renderEnlargedPostImages = () => (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-80 z-50 flex justify-center items-center" onClick={closeEnlargedImage}>
            <img 
				src={enlargedImage} 
				alt="Enlarged" 
				className="max-w-4/5 max-h-4/5 object-contain" 
				style={{maxWidth: '80%', maxHeight: '80%'}}
				onClick={(e) => e.stopPropagation()}
			/>
            <button className="absolute top-4 right-4 text-white text-4xl" onClick={closeEnlargedImage}>&times;</button>
        </div>
    );
	
	const renderEnlargedCommentImages = () => (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-80 z-50 flex justify-center items-center" onClick={closeEnlargedImage}>
            <img 
				src={enlargedCommentImage} 
				alt="Enlarged Comment" 
				className="max-w-4/5 max-h-4/5 object-contain" 
				style={{maxWidth: '80%', maxHeight: '80%'}}
				onClick={(e) => e.stopPropagation()}
			/>
            <button className="absolute top-4 right-4 text-white text-4xl" onClick={closeEnlargedImage}>&times;</button>
        </div>
    );

    const renderPostFeed = () => (
        <>
            {posts.map(post => (
                <Post
                    key={post.data.id}
                    post={post}
                    toggleSavePost={toggleSavePost}
					handleImageClick={handleImageClick}
                    isSaved={savedPosts.some(savedPost => savedPost.data.id === post.data.id)}
                />
            ))}
            {loadingPosts && <p>Loading more posts...</p>}
        </>
    );

    return (
        <div className={`app-container ${currentTheme}`}>
            <header className="bg-gray-900 text-white p-4 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center">
                    <button onClick={toggleSidebar} className="mr-4">
                        <img src="assets/zennit-logo.png" alt="Zennit Logo" className="w-8 h-8 rounded-full" />
                    </button>
                    <h1 className="text-xl font-bold">Zennit</h1>
                </div>

                <div className="flex items-center">
					<div className="relative mr-4">
                        <input
                            type="text"
                            placeholder="Search..."
                            className="bg-gray-800 text-white rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <button 
							onClick={handleSearch}
							className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
                            <i className="fas fa-search"></i>
                        </button>
                    </div>
                    <button onClick={toggleMenu} className="focus:outline-none">
                        <i className="fas fa-cog text-2xl"></i>
                    </button>

                    {isMenuOpen && (
                        <div className="absolute right-4 mt-8 w-48 bg-gray-800 rounded-md shadow-xl z-10">
                            <button onClick={() => { setPostSort('hot'); closeMenu(); }} className="block px-4 py-2 text-sm text-white hover:bg-gray-700 w-full text-left">Hot</button>
                            <button onClick={() => { setPostSort('new'); closeMenu(); }} className="block px-4 py-2 text-sm text-white hover:bg-gray-700 w-full text-left">New</button>
                            <button onClick={() => { setPostSort('top'); closeMenu(); }} className="block px-4 py-2 text-sm text-white hover:bg-gray-700 w-full text-left">Top</button>
                            <button onClick={() => { setPostSort('rising'); closeMenu(); }} className="block px-4 py-2 text-sm text-white hover:bg-gray-700 w-full text-left">Rising</button>
                        </div>
                    )}

                    <button onClick={toggleUserMenu} className="ml-4 focus:outline-none">
                         <i className="fas fa-user text-2xl"></i>
                    </button>

                    {userMenuOpen && (
                        <div className="absolute right-4 mt-8 w-48 bg-gray-800 rounded-md shadow-xl z-10">
                            <button onClick={() => { setTheme('default'); closeUserMenu(); }} className="block px-4 py-2 text-sm text-white hover:bg-gray-700 w-full text-left">Default Theme</button>
                            <button onClick={() => { setTheme('amethyst'); closeUserMenu(); }} className="block px-4 py-2 text-sm text-white hover:bg-gray-700 w-full text-left">Amethyst Theme</button>
                            <button onClick={() => { closeUserMenu(); }} className="block px-4 py-2 text-sm text-white hover:bg-gray-700 w-full text-left">Saved Posts</button>
                        </div>
                    )}
                </div>
            </header>

            <div className="flex">
                <aside className={`bg-gray-800 text-white w-64 min-h-screen p-4 ${sidebarVisible ? 'block' : 'hidden'} md:block`}>
                    <h2 className="text-lg font-bold mb-4">Subreddits</h2>
                    <SubredditForm addSubreddit={addSubreddit} newSubreddit={newSubreddit} setNewSubreddit={setNewSubreddit} />
                    <ul>
                        {subreddits.map(subreddit => (
                            <li key={subreddit.name} className="mb-2">
                                <a
                                    href="#"
                                    className={`block hover:bg-gray-700 p-2 rounded ${selectedSubreddit === subreddit.name ? 'bg-gray-700' : ''}`}
                                    onClick={() => { setSelectedSubreddit(subreddit.name); setSidebarVisible(false); }}
                                    onContextMenu={(e) => {
                                        e.preventDefault();
                                        removeSubreddit(subreddit.name);
                                    }}
                                    onTouchStart={(e) => {
                                        let timer = setTimeout(() => {
                                            removeSubreddit(subreddit.name);
                                        }, 1000);

                                        e.target.addEventListener('touchend', () => clearTimeout(timer), { once: true });
                                        e.target.addEventListener('touchcancel', () => clearTimeout(timer), { once: true });
                                    }}
                                >
                                    {subreddit.name}
                                </a>
                            </li>
                        ))}
                    </ul>
                </aside>

                <div className="flex-1 p-4">
                    {contentBlockerDetected ? (
                        <div className="bg-red-200 border-l-4 border-red-500 text-red-700 p-4" role="alert">
                            <p className="font-bold">Content Blocker Detected</p>
                            <p>Please disable your content blocker to ensure the best experience.</p>
                        </div>
                    ) : (
                        searchPageVisible ? (
                            <SearchPage 
                                searchQuery={searchQuery}
                                handleImageClick={handleImageClick}
                                toggleSavePost={toggleSavePost}
                                isSaved={savedPosts.some(savedPost => savedPost.data.id === post.data.id)}
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