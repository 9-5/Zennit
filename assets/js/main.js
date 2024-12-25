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
    const [showAddSubreddit, setShowAddSubreddit] = useState(false);
    const [currentTheme, setCurrentTheme] = useState(localStorage.getItem('theme') || 'dark');
    const [searchPageVisible, setSearchPageVisible] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loadingSearchResults, setLoadingSearchResults] = useState(false);
    const [enlargedImage, setEnlargedImage] = useState(null);
    const [enlargedCommentImage, setEnlargedCommentImage] = useState(null);
    const [showErrorPopup, setShowErrorPopup] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [savedPosts, setSavedPosts] = useState(() => JSON.parse(localStorage.getItem('savedPosts') || '[]'));
    const [showDeletePopup, setShowDeletePopup] = useState(false);
    const [postToDelete, setPostToDelete] = useState(null);
    const [toastMessage, setToastMessage] = useState('');

    useEffect(() => {
        document.body.className = currentTheme === 'light' ? 'light-theme' : '';
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
        const isContentBlockerDetected = () => {
            try {
                window.beforescroll.indexOf("webkit") > -1
            } catch (e) {
                setContentBlockerDetected(true);
            }
        };

        isContentBlockerDetected();
        loadPosts();
    }, [selectedSubreddit]);

    const toggleTheme = () => {
        setCurrentTheme(currentTheme === 'light' ? 'dark' : 'light');
    };

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

    const loadPosts = async (loadMore = false) => {
        if (loadingPosts) return;

        setLoadingPosts(true);
        const url = `https://www.reddit.com/${selectedSubreddit}/hot.json?limit=10${loadMore ? `&after=${after}` : ''}`;

        try {
            const response = await fetch(url);
            const data = await response.json();

            if (data.data.children.length === 0 && contentBlockerDetected === false) {
                setContentBlockerDetected(true);
            }

            setPosts(loadMore ? [...posts, ...data.data.children] : data.data.children);
            setAfter(data.data.after);
        } catch (error) {
            console.error("Error loading posts:", error);
        } finally {
            setLoadingPosts(false);
        }
    };

    const loadCommentsForPost = async (postId, loadMore = false) => {
        if (loadingComments) return;

        setLoadingComments(true);
        const url = `https://www.reddit.com/comments/${postId}.json?depth=1${loadMore ? `&after=${afterComment}` : ''}`;
		try {
			const response = await fetch(url);
			const data = await response.json();
			const newComments = data[1].data.children;
			setComments(loadMore ? [...comments, ...newComments] : newComments);
			setAfterComment(data[1].data.after);
		} catch (error) {
			console.error("Error loading comments:", error);
		} finally {
			setLoadingComments(false);
		}
    };

    const openPost = (post) => {
        setSelectedPost(post);
        loadCommentsForPost(post.id);
    };

    const closePost = () => {
        setSelectedPost(null);
        setComments([]);
    };

    const addSubreddit = (subredditName) => {
        const newSubreddit = { name: subredditName };
        setSubreddits([...subreddits, newSubreddit]);
        setShowAddSubreddit(false);
    };

    const removeSubreddit = (subredditName) => {
        const updatedSubreddits = subreddits.filter(subreddit => subreddit.name !== subredditName);
        setSubreddits(updatedSubreddits);
        if (selectedSubreddit === subredditName && updatedSubreddits.length > 0) {
            setSelectedSubreddit(updatedSubreddits[0].name);
        } else if (updatedSubreddits.length === 0) {
            setSelectedSubreddit(null);
        }
    };

    const Sidebar = () => (
        <div className={`sidebar ${sidebarVisible ? 'open' : ''} bg-gray-900 text-white w-64 p-4 h-full fixed top-0 left-0 z-50 transform transition-transform duration-300 ease-in-out ${sidebarVisible ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                    <img src="assets/favicon/favicon.svg" alt="Zennit Logo" className="h-8 w-8 mr-2" />
                    <h1 className="text-xl font-bold">Zennit</h1>
                </div>
                <button onClick={() => setSidebarVisible(false)} className="text-gray-400 hover:text-white focus:outline-none">
                    <i className="fas fa-times"></i>
                </button>
            </div>
            <h2 className="text-lg font-semibold mb-2">Subreddits</h2>
            <ul>
                {subreddits.map(subreddit => (
                    <li key={subreddit.name} className={`mb-2 cursor-pointer hover:text-blue-500 ${selectedSubreddit === subreddit.name ? 'font-bold' : ''}`}
                        onClick={() => {
                            setSelectedSubreddit(subreddit.name);
                            setSidebarVisible(false);
                        }}
                        onContextMenu={(e) => {
                            e.preventDefault();
                            removeSubreddit(subreddit.name);
                        }}
                        onTouchStart={(e) => {
                            // Simple long press detection
                            let touchTimer = setTimeout(() => {
                                removeSubreddit(subreddit.name);
                            }, 1000); // 1 second delay
                            const touchEndHandler = () => {
                                clearTimeout(touchTimer);
                                document.removeEventListener('touchend', touchEndHandler);
                                document.removeEventListener('touchcancel', touchEndHandler);
                            };
                            document.addEventListener('touchend', touchEndHandler);
                            document.addEventListener('touchcancel', touchEndHandler);
                        }}>
                        {subreddit.name}
                    </li>
                ))}
            </ul>
            <button onClick={() => setShowAddSubreddit(true)} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                Add Subreddit
            </button>
        </div>
    );

    const AddSubredditPopup = ({ onClose, onAdd }) => {
        const [subredditName, setSubredditName] = useState('');

        const handleSubmit = () => {
            if (subredditName.trim() !== '') {
                onAdd(subredditName);
                onClose();
            }
        };

        return (
            <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 z-50 flex justify-center items-center">
                <div className="bg-gray-800 p-8 rounded shadow-lg">
                    <h2 className="text-xl font-semibold mb-4 text-white">Add Subreddit</h2>
                    <input
                        type="text"
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 text-white"
                        placeholder="r/subreddit"
                        value={subredditName}
                        onChange={e => setSubredditName(e.target.value)}
                    />
                    <div className="flex justify-end mt-4">
                        <button className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mr-2" onClick={onClose}>
                            Cancel
                        </button>
                        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" onClick={handleSubmit}>
                            Add
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const renderPostFeed = () => (
        <div>
            {posts.map(post => (
                <div key={post.data.id} className="bg-gray-900 rounded-md shadow-md p-4 mb-4">
                    <div className="flex items-center mb-2">
                        <span className="text-sm text-gray-400 mr-2">{post.data.subreddit_name_prefixed}</span>
                        <span className="text-sm text-gray-500">Score: {post.data.score}</span>
                        {savedPosts.some(savedPost => savedPost.data.id === post.data.id) ? (
                            <button className="text-red-500 hover:text-red-700 ml-2 focus:outline-none" onClick={() => {
                                setPostToDelete(post);
                                setShowDeletePopup(true);
                            }}>
                                <i className="fas fa-heart"></i>
                            </button>
                        ) : (
                            <button className="text-gray-500 hover:text-red-500 ml-2 focus:outline-none" onClick={() => savePost(post)}>
                                <i className="far fa-heart"></i>
                            </button>
                        )}
                    </div>
                    <div className="title-container">
                        <h2 className="text-xl font-semibold mb-2 text-white">{post.data.title}</h2>
                    </div>
                    {post.data.post_hint === 'image' && (
                        <div className="mt-3">
                            <img src={post.data.url} alt={post.data.title} className="rounded-md cursor-pointer" style={{ maxWidth: '100%', maxHeight: '400px' }} onClick={() => handleImageClick(post.data.url)} />
                        </div>
                    )}
                    {post.data.selftext && (
                        <div className="post-preview">
                            <p className="text-gray-400 body-text">{post.data.selftext}</p>
                        </div>
                    )}
                    <div className="flair" style={{backgroundColor: post.data.link_flair_background_color, color: post.data.link_flair_text_color}}>
                        {post.data.link_flair_text}
                    </div>
                    <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" onClick={() => openPost(post.data)}>
                        View Comments
                    </button>
                    {post.data.url.includes('v.redd.it') && (
                        <video controls width="250">
                          <source src={post.data.url} type="video/mp4"/>
                            Your browser does not support HTML video.
                        </video>
                    )}
                </div>
            ))}
            {loadingPosts && <p className="text-center text-gray-500">Loading more posts...</p>}
            {!loadingPosts && after && (
                <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" onClick={() => loadPosts(true)}>
                    Load More
                </button>
            )}
        </div>
    );

    const renderComments = () => (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-75 z-50 flex justify-center items-center overflow-y-scroll">
            <div className="bg-gray-800 rounded-md shadow-lg p-8 max-w-3xl w-full mx-4 relative">
                <button onClick={closePost} className="absolute top-4 right-4 text-gray-400 hover:text-white focus:outline-none">
                    <i className="fas fa-times"></i>
                </button>
                <h2 className="text-xl font-semibold mb-4 text-white">{selectedPost.title}</h2>
                <div className="mb-4">
                    {comments.map(comment => {
                        if (comment.kind === 't1') {
                            return renderComment(comment.data, 0);
                        } else {
                            return null;
                        }
                    })}
                </div>
                {loadingComments && <p className="text-center text-gray-500">Loading more comments...</p>}
				{!loadingComments && afterComment && (
					<button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" onClick={() => loadCommentsForPost(selectedPost.id, true)}>
						Load More
					</button>
				)}
            </div>
        </div>
    );

    const savePost = (post) => {
        setSavedPosts([...savedPosts, post]);
        setToastMessage('Post saved!');
    };

    const renderEnlargedPostImages = () => (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-75 z-50 flex justify-center items-center" onClick={closeEnlargedImage}>
            <img src={enlargedImage} alt="Enlarged" className="max-w-full max-h-screen" />
        </div>
    );

    const renderEnlargedCommentImages = () => (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-75 z-50 flex justify-center items-center" onClick={closeEnlargedCommentImage}>
            <img src={enlargedCommentImage} alt="Enlarged Comment Image" className="max-w-full max-h-screen" />
        </div>
    );

    const ErrorPopup = ({ message, onClose }) => (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-gray-800 p-8 rounded shadow-lg">
                <h2 className="text-xl font-semibold mb-4 text-white">Error</h2>
                <p className="text-red-500">{message}</p>
                <button className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mt-4" onClick={onClose}>
                    Close
                </button>
            </div>
        </div>
    );

    const renderErrorPopup = () => (
        <ErrorPopup message={errorMessage} onClose={() => setShowErrorPopup(false)} />
    );

    const DeleteSavedPostPopup = ({ post, onClose, onDelete }) => (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-gray-800 p-8 rounded shadow-lg">
                <h2 className="text-xl font-semibold mb-4 text-white">Delete Saved Post</h2>
                <p className="text-gray-400">Are you sure you want to delete this saved post?</p>
                <div className="flex justify-end mt-4">
                    <button className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mr-2" onClick={onClose}>
                        Cancel
                    </button>
                    <button className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" onClick={onDelete}>
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );

    const deleteSavedPost = (post) => {
        const updatedSavedPosts = savedPosts.filter(savedPost => savedPost.data.id !== post.data.id);
        setSavedPosts(updatedSavedPosts);
        setShowDeletePopup(false);
        setToastMessage('Post unsaved!');
    };

    const renderDeleteSavedPostPopup = () => (
        <DeleteSavedPostPopup
            post={postToDelete}
            onClose={() => setShowDeletePopup(false)}
            onDelete={() => deleteSavedPost(postToDelete)}
        />
    );

    const Toast = ({ message, onClose }) => {
        useEffect(() => {
            const timer = setTimeout(() => {
                onClose();
            }, 3000);

            return () => clearTimeout(timer);
        }, [onClose]);

        return (
            <div className="fixed bottom-4 right-4 bg-green-500 text-white py-2 px-4 rounded-md shadow-lg">
                {message}
                <button onClick={onClose} className="ml-2 focus:outline-none">
                    <i className="fas fa-times"></i>
                </button>
            </div>
        );
    };

    const performSearch = async () => {
        if (!searchTerm) return;

        setLoadingSearchResults(true);
        try {
            const response = await fetch(`https://www.reddit.com/search.json?q=${searchTerm}&limit=10`);
            const data = await response.json();
            setSearchResults(data.data.children);
        } catch (error) {
            console.error("Error during search:", error);
            setErrorMessage("Error occurred during search. Please try again.");
            setShowErrorPopup(true);
        } finally {
            setLoadingSearchResults(false);
        }
    };

    const handleSearchInputChange = (event) => {
        setSearchTerm(event.target.value);
    };

    const toggleSearchPage = () => {
        setSearchPageVisible(!searchPageVisible);
    };

    const renderSearchResults = () => (
        <div>
            {searchResults.map(result => (
                <div key={result.data.id} className="bg-gray-900 rounded-md shadow-md p-4 mb-4">
                    <h2 className="text-xl font-semibold mb-2 text-white">{result.data.title}</h2>
                    <p className="text-gray-400">{result.data.selftext}</p>
                    <a href={`https://www.reddit.com${result.data.permalink}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700">
                        View on Reddit
                    </a>
                </div>
            ))}
        </div>
    );

    const SearchPage = ({ onClose }) => (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-75 z-50 flex justify-center items-center">
            <div className="bg-gray-800 rounded-md shadow-lg p-8 max-w-3xl w-full mx-4 relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white focus:outline-none">
                    <i className="fas fa-times"></i>
                </button>
                <h2 className="text-xl font-semibold mb-4 text-white">Search Reddit</h2>
                <div className="flex">
                    <input
                        type="text"
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 text-white mr-2"
                        placeholder="Enter search term"
                        value={searchTerm}
                        onChange={handleSearchInputChange}
                    />
                    <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" onClick={performSearch}>
                        Search
                    </button>
                </div>
                {loadingSearchResults ? (
                    <p className="text-center text-gray-500 mt-4">Loading search results...</p>
                ) : (
                    <div className="mt-4">{renderSearchResults()}</div>
                )}
            </div>
        </div>
    );

    const renderComment = (comment, level) => {
        const imageUrl = comment.body.match(/https?:\/\/.*\.(?:png|jpg|jpeg|gif)/i)?.[0];
        const indent = level * 20; // Increase indent based on level
        return (
            <div key={comment.id} style={{ marginLeft: `${indent}px` }} className="mb-4">
                <div className="comment-header flex items-center">
                    <span className="comment-author text-sm font-semibold text-blue-500">{comment.author}</span>
                    <span className="comment-age text-xs text-gray-500 ml-2">{comment.created_utc}</span>
                    <span className="comment-score text-sm text-gray-500 ml-2">Score: {comment.score}</span>
                </div>
				{imageUrl ? (
					<div className="mt-3">
						<img src={imageUrl} alt="Comment Image" className="rounded-md cursor-pointer" style={{ maxWidth: '100%', maxHeight: '400px' }} onClick={() => handleCommentImageClick(imageUrl)}/>
					</div>
				) : (
					<div className="comment-body text-gray-400 body-text">{comment.body}</div>
				)}
                {comment.replies && comment.replies.data && comment.replies.data.children.map(reply => {
					if (reply.kind === 't1') {
						return renderComment(reply.data, level + 1);
					} else {
						return null;
					}
				})}
            </div>
        );
    };

    const

    return (
        <div className="App">
            <Sidebar />
            <div className="content">
                <header className="bg-gray-800 p-4 flex items-center justify-between">
                    <button onClick={() => setSidebarVisible(true)} className="text-gray-400 hover:text-white focus:outline-none">
                        <i className="fas fa-bars fa-lg"></i>
                    </button>
                    <h1 className="text-xl font-bold text-white">{selectedSubreddit}</h1>
                    <button onClick={toggleTheme} className="text-gray-400 hover:text-white focus:outline-none">
                        {currentTheme === 'light' ? <i className="fas fa-moon fa-lg"></i> : <i className="fas fa-sun fa-lg"></i>}
                    </button>
                </header>
                {contentBlockerDetected ? (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                        <strong className="font-bold">Content Blocker Detected!</strong>
                        <span className="block sm:inline">Please disable your content blocker to view posts.</span>
                    </div>
                ) : (
                    selectedPost ? (
                        renderComments()
                    ) : (
                        searchPageVisible ? (
                            <SearchPage
                                onClose={() => setSearchPageVisible(false)} 
                            />
                        ) : (
                            renderPostFeed()
                        )
                    )}
                )}
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