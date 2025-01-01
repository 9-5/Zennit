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
	const [lastPost, setLastPost] = useState(null);
    const [comments, setComments] = useState([]);
    const [showSidebar, setShowSidebar] = useState(false);
    const [selectedPost, setSelectedPost] = useState(null);
    const [enlargedImage, setEnlargedImage] = useState(null);
    const [enlargedCommentImage, setEnlargedCommentImage] = useState(null);
    const [error, setError] = useState(null);
    const [showErrorPopup, setShowErrorPopup] = useState(false);
    const [sortType, setSortType] = useState(localStorage.getItem('sortType') || 'hot');
    const [showDeletePopup, setShowDeletePopup] = useState(false);
    const [postToDelete, setPostToDelete] = useState(null);
    const [toastMessage, setToastMessage] = useState('');
    const [savedPosts, setSavedPosts] = useState(() => JSON.parse(localStorage.getItem('savedPosts') || '[]'));
	const [theme, setTheme] = useState(localStorage.getItem('theme') || '');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchPageVisible, setSearchPageVisible] = useState(false);
    const [searchResults, setSearchResults] = useState([]);

    const postsRef = useRef(null);
    const observer = useRef(null);
    const isFirstRender = useRef(true);

    const isPostSaved = (post) => {
        return savedPosts.some(savedPost => savedPost.data.id === post.data.id);
    };

    const getTheme = () => {
		return localStorage.getItem('theme') || '';
	}

    const toggleTheme = () => {
        const newTheme = theme === '' ? 'amethyst' : '';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
    };

    const getPosts = async (subreddit, sort = 'hot', after = null) => {
        if (contentBlockerDetected) {
            return;
        }
        setLoadingPosts(true);
        try {
            let url = `https://www.reddit.com/${subreddit}/${sort}.json?limit=10`;
            if (after) {
                url += `&after=${after}`;
            }
            const response = await fetch(url);
            const data = await response.json();
            if (data.error) {
                throw new Error(data.message);
            }
            setPosts(prevPosts => after ? [...prevPosts, ...data.data.children] : data.data.children);
            setAfter(data.data.after);
			if (data.data.children.length > 0) {
				setLastPost(data.data.children[data.data.children.length - 1]);
			} else {
				setLastPost(null);
			}
            setError(null);
        } catch (error) {
            console.error("Error fetching posts:", error);
            setError(error.message || "Failed to load posts.");
            setShowErrorPopup(true);
        } finally {
            setLoadingPosts(false);
        }
    };

    const getComments = async (postId, after = null) => {
        setLoadingComments(true);
        try {
            let url = `https://www.reddit.com/comments/${postId}.json?depth=1&limit=50`;
            if (after) {
                url += `&after=${after}`;
            }
            const response = await fetch(url);
            const data = await response.json();
			//console.log(data);
            if (data.error) {
                throw new Error(data.message);
            }
            setComments(prevComments => after ? [...prevComments, ...data[1].data.children] : data[1].data.children);
            setAfterComment(data[1].data.after);
            setError(null);
        } catch (error) {
            console.error("Error fetching comments:", error);
            setError(error.message || "Failed to load comments.");
            setShowErrorPopup(true);
        } finally {
            setLoadingComments(false);
        }
    };

    const openEnlargedImage = (imageUrl) => {
        setEnlargedImage(imageUrl);
    };

    const closeEnlargedImage = () => {
        setEnlargedImage(null);
    };

	const openEnlargedCommentImage = (imageUrl) => {
        setEnlargedCommentImage(imageUrl);
    };

    const closeEnlargedCommentImage = () => {
        setEnlargedCommentImage(null);
    };

    const handleSubredditChange = (event) => {
        setSelectedSubreddit(event.target.value);
        localStorage.setItem('selectedSubreddit', event.target.value);
    };

    const addSubreddit = () => {
        const newSubreddit = document.getElementById('newSubreddit').value;
        if (newSubreddit && !subreddits.find(sub => sub.name === newSubreddit)) {
            setSubreddits([...subreddits, { name: newSubreddit }]);
        }
    };

    const handleSortTypeChange = (newSortType) => {
        setSortType(newSortType);
        localStorage.setItem('sortType', newSortType);
        setPosts([]);
        setAfter(null);
        getPosts(selectedSubreddit, newSortType);
    };

    const removeSubreddit = (subredditToRemove) => {
        const updatedSubreddits = subreddits.filter(sub => sub.name !== subredditToRemove);
        setSubreddits(updatedSubreddits);
        localStorage.setItem('subreddits', JSON.stringify(updatedSubreddits));
        if (selectedSubreddit === subredditToRemove) {
            setSelectedSubreddit(updatedSubreddits[0]?.name || '');
            localStorage.setItem('selectedSubreddit', updatedSubreddits[0]?.name || '');
        }
    };

    const handlePostClick = (post) => {
        setSelectedPost(post);
        setComments([]);
        setAfterComment(null);
        getComments(post.data.id);
    };

    const closePostPreview = () => {
        setSelectedPost(null);
    };

    const savePost = (post) => {
        const isAlreadySaved = savedPosts.some(savedPost => savedPost.data.id === post.data.id);
        if (!isAlreadySaved) {
            const updatedSavedPosts = [...savedPosts, post];
            setSavedPosts(updatedSavedPosts);
            localStorage.setItem('savedPosts', JSON.stringify(updatedSavedPosts));
            setToastMessage('Post saved!');
        } else {
            setToastMessage('Post already saved!');
        }
    };

    const deleteSavedPost = (post) => {
        setPostToDelete(post);
        setShowDeletePopup(true);
    };

    const confirmDeleteSavedPost = () => {
        if (postToDelete) {
            const updatedSavedPosts = savedPosts.filter(savedPost => savedPost.data.id !== postToDelete.data.id);
            setSavedPosts(updatedSavedPosts);
            localStorage.setItem('savedPosts', JSON.stringify(updatedSavedPosts));
            setToastMessage('Post deleted!');
        }
        closeDeleteSavedPostPopup();
    };

    const closeDeleteSavedPostPopup = () => {
        setShowDeletePopup(false);
        setPostToDelete(null);
    };

    const handleSearchChange = (event) => {
        setSearchQuery(event.target.value);
    };

    const performSearch = async () => {
        if (!searchQuery) return;
        setLoadingPosts(true);
        try {
            const response = await fetch(`https://www.reddit.com/search.json?q=${searchQuery}&limit=10`);
            const data = await response.json();
            if (data.error) {
                throw new Error(data.message);
            }
            setSearchResults(data.data.children);
            setSearchPageVisible(true);
        } catch (error) {
            console.error("Error during search:", error);
            setError(error.message || "Search failed.");
            setShowErrorPopup(true);
        } finally {
            setLoadingPosts(false);
        }
    };

    const closeSearchPage = () => {
        setSearchPageVisible(false);
        setSearchQuery('');
        setSearchResults([]);
    };

    useEffect(() => {
        const saved = localStorage.getItem('subreddits');
        if (saved) {
            setSubreddits(JSON.parse(saved));
        }
		document.body.className = getTheme();
    }, []);

    useEffect(() => {
        localStorage.setItem('subreddits', JSON.stringify(subreddits));
    }, [subreddits]);

    useEffect(() => {
        setPosts([]);
        setAfter(null);
        getPosts(selectedSubreddit, sortType);
    }, [selectedSubreddit, sortType]);

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                setSubreddits(JSON.parse(localStorage.getItem('subreddits') || '[{"name": "r/0KB"}]'));
                setSelectedSubreddit(localStorage.getItem('selectedSubreddit') || 'r/0KB');
                setSortType(localStorage.getItem('sortType') || 'hot');
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    useEffect(() => {
        const checkContentBlocker = async () => {
            try {
                const testAd = await fetch('https://www.reddit.com/api/v1/me', { mode: 'cors' });
                if (testAd.status === 401) {
                    setContentBlockerDetected(false);
                } else {
                    setContentBlockerDetected(true);
                }
            } catch (e) {
                setContentBlockerDetected(true);
            }
        };

        checkContentBlocker();
    }, []);

    useEffect(() => {
        const currentObserver = observer.current;
        if (currentObserver) {
            currentObserver.disconnect();
        }

        observer.current = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && !loadingPosts && lastPost) {
                    getPosts(selectedSubreddit, sortType, after);
                }
            },
            {
                root: null,
                rootMargin: '20px',
                threshold: 1
            }
        );

        if (postsRef.current) {
            observer.current.observe(postsRef.current);
        }

        return () => {
            if (observer.current) {
                observer.current.disconnect();
            }
        };
    }, [posts, loadingPosts, selectedSubreddit, sortType, after, lastPost]);

    const renderPost = (post) => {
        let imageUrl = post.data.url_overridden_by_dest;
        if (post.data.domain === "i.redd.it" && !imageUrl) {
            imageUrl = post.data.url;
        }
		let flair = post.data.link_flair_text;
        return (
            <div key={post.data.id} className="bg-gray-900 border border-gray-700 rounded-lg shadow-md p-4 mb-4">
                <div className="flex items-center mb-2">
                    <div className="title-container">
                        <h2 className="text-white font-bold post-title">{post.data.title}</h2>
                    </div>
                    <button onClick={() => savePost(post)} className="ml-2 text-blue-500 hover:text-blue-700 focus:outline-none">
                        <i className="fas fa-bookmark"></i>
                    </button>
					{flair && (
                        <div className="ml-2 flair">
                            {flair}
                        </div>
                    )}
                </div>
                <p className="text-gray-400">
                    Author: {post.data.author} | Score: {post.data.score} | <a href={post.data.url} className="text-blue-500 hover:text-blue-700" target="_blank">Source</a>
                </p>
                {imageUrl && (
                    <div className="mb-2">
                        <img src={imageUrl} alt="Post Image" className="rounded cursor-pointer" onClick={() => openEnlargedImage(imageUrl)} />
                    </div>
                )}
                <button onClick={() => handlePostClick(post)} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                    View Comments
                </button>
            </div>
        );
    };

    const renderPostFeed = () => {
        if (contentBlockerDetected) {
            return (
                <div className="text-red-500">
                    Content blocker detected! Please disable your content blocker to use Zennit.
                </div>
            );
        }

        if (loadingPosts && posts.length === 0) {
            return <div className="text-white">Loading posts...</div>;
        }

        if (!loadingPosts && posts.length === 0) {
            return <div className="text-white">No posts to display.</div>;
        }
		return (
            <>
                {posts.map(post => renderPost(post))}
                {loadingPosts && <div className="text-white">Loading more posts...</div>}
                <div ref={postsRef} style={{ height: '20px', background: 'transparent' }}></div>
            </>
        );
    };

    const renderSidebar = () => (
        <div className={`sidebar ${showSidebar ? 'open' : ''} bg-gray-900 text-white w-64 p-4 rounded-md shadow-lg`}>
            <div className="mb-4">
                <img src="assets/zennit-logo.png" alt="Zennit Logo" className="w-32 cursor-pointer inverse-colors" onClick={() => {
                        setSearchPageVisible(false);
                        setShowSidebar(!showSidebar);
                    }}
                />
                <h2 className="text-2xl font-bold mb-2">Subreddits</h2>
                <div className="flex mb-2">
                    <input type="text" id="newSubreddit" className="bg-gray-800 text-white px-2 py-1 rounded w-full mr-2" placeholder="r/subreddit" />
                    <button onClick={addSubreddit} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded focus:outline-none focus:shadow-outline">Add</button>
                </div>
                <ul>
                    {subreddits.map(subreddit => (
                        <li key={subreddit.name} className="mb-1">
                            <a
                                href="#"
                                className={`block hover:bg-gray-800 px-2 py-1 rounded ${selectedSubreddit === subreddit.name ? 'bg-gray-800' : ''}`}
                                onClick={() => {
                                    setSelectedSubreddit(subreddit.name);
                                    localStorage.setItem('selectedSubreddit', subreddit.name);
                                    setSearchPageVisible(false);
                                }}
                                onContextMenu={(e) => {
                                    e.preventDefault();
                                    removeSubreddit(subreddit.name);
                                }}
                                onTouchStart={(e) => {
                                    // Long press detection for mobile
                                    let timer = setTimeout(() => {
                                        removeSubreddit(subreddit.name);
                                    }, 1000); // 1 second delay
                                    e.target.addEventListener('touchend', () => clearTimeout(timer), { once: true });
                                    e.target.addEventListener('touchcancel', () => clearTimeout(timer), { once: true });
                                }}
                            >
                                {subreddit.name}
                            </a>
                        </li>
                    ))}
                </ul>
            </div>
            <div>
                <h2 className="text-2xl font-bold mb-2">Sort By</h2>
                <select
                    className="bg-gray-800 text-white px-2 py-1 rounded w-full"
                    value={sortType}
                    onChange={(e) => handleSortTypeChange(e.target.value)}
                >
                    <option value="hot">Hot</option>
                    <option value="new">New</option>
                    <option value="top">Top</option>
                    <option value="rising">Rising</option>
                </select>
            </div>
			<div>
                <h2 className="text-2xl font-bold mb-2">Theme</h2>
				<button onClick={toggleTheme} className="theme-switcher">
					<img src="assets/zennit-logo.png" alt="Theme Switcher" className="w-6 cursor-pointer inverse-colors" />
				</button>
            </div>
        </div>
    );

    const renderPostPreview = () => {
        if (!selectedPost) {
            return null;
        }

        let imageUrl = selectedPost.data.url_overridden_by_dest;
        if (selectedPost.data.domain === "i.redd.it" && !imageUrl) {
            imageUrl = selectedPost.data.url;
        }

        return (
            <div className="post-preview expanded fixed top-0 left-0 w-full h-full bg-gray-900 bg-opacity-90 z-50 overflow-y-auto">
                <div className="container mx-auto mt-8 p-8 bg-gray-800 rounded-lg shadow-lg relative">
                    <button onClick={closePostPreview} className="absolute top-4 right-4 text-white hover:text-gray-300 focus:outline-none">
                        <i className="fas fa-times-circle text-3xl"></i>
                    </button>
                    <h2 className="text-3xl font-bold text-white mb-4">{selectedPost.data.title}</h2>
                    <p className="text-gray-400 mb-4">
                        Author: {selectedPost.data.author} | Score: {selectedPost.data.score} | <a href={selectedPost.data.url} className="text-blue-500 hover:text-blue-700" target="_blank">Source</a>
                    </p>
                    {imageUrl && (
                        <div className="mb-4">
                            <img src={imageUrl} alt="Post Image" className="rounded max-w-full cursor-pointer" onClick={() => openEnlargedImage(imageUrl)} />
                        </div>
                    )}
                    <h3 className="text-2xl font-bold text-white mb-4">Comments</h3>
                    {comments.map(comment => {
                        let commentImageUrl;
                        if (comment.data.body.includes('https://')) {
                            commentImageUrl = comment.data.body.match(/https:\/\/[^\s]+/)?.[0];
                        }
						if (comment.data.body.includes('http://')) {
                            commentImageUrl = comment.data.body.match(/http:\/\/[^\s]+/)?.[0];
                        }
						if (!commentImageUrl) {
                            commentImageUrl = comment.data.body.match(/(?:!\[.*?\]\()(?<filename>.*?)(?:\))/)?.[1];
                            commentImageUrl = comment.data.body.match(/^(?:.*?)?(?P<url>https?:\/\/[\S]+)(?:.*?)?\/?$/)?.[1];
                            commentImageUrl = comment.data.body.match(/\[(.*?)\]\((.*?)\)/)?.[2];
                            commentImageUrl = comment.data.body.match(/<img.*?src="(.*?)"/)?.[1];
                            commentImageUrl = comment.data.body.match(/src="(.*?)"/)?.[1];
                        }
						return (
                            <div key={comment.data.id} className="bg-gray-900 border border-gray-700 rounded-lg shadow-md p-4 mb-4">
                                <div className="flex items-center mb-2">
                                    <div className="title-container">
                                        <h3 className="text-white font-bold">Author: {comment.data.author}</h3>
                                    </div>
                                </div>
                                <p className="text-gray-400 body-text">{comment.data.body}</p>
								{commentImageUrl && (
                                    <div className="mb-2">
                                        <img src={commentImageUrl} alt="Comment Image" className="rounded cursor-pointer" onClick={() => openEnlargedCommentImage(commentImageUrl)} />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    {loadingComments && <div className="text-white">Loading more comments...</div>}
                </div>
            </div>
        );
    };

    const renderEnlargedPostImages = () => {
        if (!enlargedImage) {
            return null;
        }

        return (
            <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-90 z-50 flex justify-center items-center">
                <img src={enlargedImage} alt="Enlarged Post" className="max-w-full max-h-full rounded" onClick={closeEnlargedImage} />
                <button onClick={closeEnlargedImage} className="absolute top-4 right-4 text-white hover:text-gray-300 focus:outline-none">
                    <i className="fas fa-times-circle text-3xl"></i>
                </button>
            </div>
        );
    };

    const renderEnlargedCommentImages = () => {
        if (!enlargedCommentImage) {
            return null;
        }

        return (
            <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-90 z-50 flex justify-center items-center">
                <img src={enlargedCommentImage} alt="Enlarged Comment" className="max-w-full max-h-full rounded" onClick={closeEnlargedCommentImage} />
                <button onClick={closeEnlargedCommentImage} className="absolute top-4 right-4 text-white hover:text-gray-300 focus:outline-none">
                    <i className="fas fa-times-circle text-3xl"></i>
                </button>
            </div>
        );
    };

    const renderErrorPopup = () => (
        <div className="fixed top-0 left-0 w-full h-full bg-gray-900 bg-opacity-75 z-50 flex justify-center items-center">
            <div className="bg-red-600 text-white p-8 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold mb-4">Error</h2>
                <p>{error}</p>
                <button onClick={() => setShowErrorPopup(false)} className="mt-4 bg-gray-700 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                    Close
                </button>
            </div>
        </div>
    );

    const renderDeleteSavedPostPopup = () => (
        <div className="fixed top-0 left-0 w-full h-full bg-gray-900 bg-opacity-75 z-50 flex justify-center items-center">
            <div className="bg-gray-800 text-white p-8 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold mb-4">Delete Saved Post</h2>
                <p>Are you sure you want to delete this saved post?</p>
                <div className="flex justify-around">
                    <button onClick={confirmDeleteSavedPost} className="mt-4 bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                        Yes, Delete
                    </button>
                    <button onClick={closeDeleteSavedPostPopup} className="mt-4 bg-gray-700 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );

    const Toast = ({ message, onClose }) => (
        <div className="fixed bottom-4 left-4 bg-green-500 text-white py-2 px-4 rounded-full shadow-md z-50">
            {message}
            <button onClick={onClose} className="ml-2 focus:outline-none">
                <i className="fas fa-times"></i>
            </button>
        </div>
    );

    const renderSearchPage = () => (
        <div className="fixed top-0 left-0 w-full h-full bg-gray-900 z-50 overflow-y-auto">
            <div className="container mx-auto mt-8 p-8">
                <h2 className="text-3xl font-bold text-white mb-4">Search Results for "{searchQuery}"</h2>
                <button onClick={closeSearchPage} className="absolute top-4 right-4 text-white hover:text-gray-300 focus:outline-none">
                    <i className="fas fa-times-circle text-3xl"></i>
                </button>
                {searchResults.length > 0 ? (
                    searchResults.map(post => renderPost(post))
                ) : (
                    <p className="text-white">No results found.</p>
                )}
            </div>
        </div>
    );

    return (
        <