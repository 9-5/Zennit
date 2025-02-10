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
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [showAddSubreddit, setShowAddSubreddit] = useState(false);
    const [newSubreddit, setNewSubreddit] = useState('');
    const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
    const [isContextMenuVisible, setIsContextMenuVisible] = useState(false);
    const [subredditToRemove, setSubredditToRemove] = useState(null);
    const [currentSort, setCurrentSort] = useState('hot');
    const [showThemeSwitcher, setShowThemeSwitcher] = useState(false);
    const [currentTheme, setCurrentTheme] = useState(localStorage.getItem('theme') || 'default');
    const [error, setError] = useState(null);
    const [showErrorPopup, setShowErrorPopup] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [showSavePostConfirmation, setShowSavePostConfirmation] = useState(false);
    const [postToSave, setPostToSave] = useState(null);
    const [savedPosts, setSavedPosts] = useState(() => JSON.parse(localStorage.getItem('savedPosts') || '[]'));
    const [showDeletePopup, setShowDeletePopup] = useState(false);
    const [postToDelete, setPostToDelete] = useState(null);
    const [searchPageVisible, setSearchPageVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loadingSearchResults, setLoadingSearchResults] = useState(false);
    const [enlargedImage, setEnlargedImage] = useState(null);
    const [enlargedCommentImage, setEnlargedCommentImage] = useState(null);

    const handleImageClick = (imageUrl) => {
        setEnlargedImage(imageUrl);
    };
    const handleCommentImageClick = (imageUrl) => {
        setEnlargedCommentImage(imageUrl);
    };

    const renderEnlargedPostImages = () => (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-80 z-50 flex justify-center items-center" onClick={() => setEnlargedImage(null)}>
            <img src={enlargedImage} alt="Enlarged Post Image" className="max-w-4/5 max-h-4/5 object-contain" />
        </div>
    );
    const renderEnlargedCommentImages = () => (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-80 z-50 flex justify-center items-center" onClick={() => setEnlargedCommentImage(null)}>
            <img src={enlargedCommentImage} alt="Enlarged Comment Image" className="max-w-4/5 max-h-4/5 object-contain" />
        </div>
    );
    const handleSearch = async () => {
        setLoadingSearchResults(true);
        try {
            const response = await fetch(`https://www.reddit.com/search.json?q=${searchQuery}&sort=relevance&t=all&limit=25`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setSearchResults(data.data.children.map(post => post.data));
        } catch (error) {
            setError(error.message);
            setShowErrorPopup(true);
        } finally {
            setLoadingSearchResults(false);
        }
    };
    const handleSearchInputChange = (event) => {
        setSearchQuery(event.target.value);
    };
    const renderSearchResults = () => (
        <div>
            {loadingSearchResults ? (
                <p>Loading search results...</p>
            ) : (
                searchResults.length > 0 ? (
                    searchResults.map(post => (
                        <div key={post.id} className="post">
                            <a href={post.url} target="_blank" rel="noopener noreferrer">
                                <div className="title-container">
                                    <h2 className="post-title">{post.title}</h2>
                                </div>
                            </a>
                            <p className="post-author">Posted by: {post.author}</p>
                            <p className="post-score">Score: {post.score}</p>
                        </div>
                    ))
                ) : (
                    <p>No results found for "{searchQuery}"</p>
                )
            )}
        </div>
    );

    const confirmDeleteSavedPost = (post) => {
        setPostToDelete(post);
        setShowDeletePopup(true);
    };
    const renderDeleteSavedPostPopup = () => (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-white p-4 rounded-md">
                <p>Are you sure you want to delete this saved post?</p>
                <div className="flex justify-around mt-4">
                    <button className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded" onClick={deleteSavedPost}>Yes, Delete</button>
                    <button className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded" onClick={() => setShowDeletePopup(false)}>Cancel</button>
                </div>
            </div>
        </div>
    );
    const deleteSavedPost = () => {
        const updatedSavedPosts = savedPosts.filter(post => post.id !== postToDelete.id);
        setSavedPosts(updatedSavedPosts);
        localStorage.setItem('savedPosts', JSON.stringify(updatedSavedPosts));
        setToastMessage('Post deleted successfully!');
        setShowDeletePopup(false);
    };
    const savePost = () => {
        const isPostAlreadySaved = savedPosts.some(post => post.id === postToSave.id);
        if (!isPostAlreadySaved) {
            const updatedSavedPosts = [...savedPosts, postToSave];
            setSavedPosts(updatedSavedPosts);
            localStorage.setItem('savedPosts', JSON.stringify(updatedSavedPosts));
            setToastMessage('Post saved successfully!');
        } else {
            setToastMessage('Post is already saved!');
        }
        setShowSavePostConfirmation(false);
    };
    const confirmSavePost = (post) => {
        setPostToSave(post);
        setShowSavePostConfirmation(true);
    };
    const renderSavePostConfirmation = () => (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-white p-4 rounded-md">
                <p>Do you want to save this post?</p>
                <div className="flex justify-around mt-4">
                    <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded" onClick={savePost}>Yes, Save</button>
                    <button className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded" onClick={() => setShowSavePostConfirmation(false)}>Cancel</button>
                </div>
            </div>
        </div>
    );

    const renderErrorPopup = () => (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                <strong className="font-bold">Error:</strong>
                <span className="block sm:inline">{error}</span>
                <span className="absolute top-0 bottom-0 right-0 px-4 py-3" onClick={() => setShowErrorPopup(false)}>
                    <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg>
                </span>
            </div>
        </div>
    );

    const toggleTheme = () => {
        const newTheme = currentTheme === 'default' ? 'amethyst' : 'default';
        setCurrentTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        document.body.className = newTheme;
    };

    const changeSortOrder = (sort) => {
        setCurrentSort(sort);
        setPosts([]);
        setAfter(null);
        fetchPosts(sort);
    };

    useEffect(() => {
        document.body.className = localStorage.getItem('theme') || 'default';
    }, []);

    const handleContextMenu = (event, subredditName) => {
        event.preventDefault();
        setSubredditToRemove(subredditName);
        setContextMenuPosition({ x: event.clientX, y: event.clientY });
        setIsContextMenuVisible(true);
    };

    const removeSubreddit = () => {
        const updatedSubreddits = subreddits.filter(sub => sub.name !== subredditToRemove);
        setSubreddits(updatedSubreddits);
        localStorage.setItem('subreddits', JSON.stringify(updatedSubreddits));
        setIsContextMenuVisible(false);
        if (selectedSubreddit === subredditToRemove) {
            setSelectedSubreddit(updatedSubreddits.length > 0 ? updatedSubreddits[0].name : '');
        }
        setSubredditToRemove(null);
    };

    const handleAddSubreddit = () => {
        if (newSubreddit.trim() !== '') {
            const subredditObject = { name: newSubreddit.trim() };
            setSubreddits([...subreddits, subredditObject]);
            localStorage.setItem('subreddits', JSON.stringify([...subreddits, subredditObject]));
            setNewSubreddit('');
            setShowAddSubreddit(false);
        }
    };

    const handleSubredditClick = (subredditName) => {
        setSelectedSubreddit(subredditName);
        localStorage.setItem('selectedSubreddit', subredditName);
        setPosts([]);
        setAfter(null);
        fetchPosts('hot', subredditName);
    };

    const openSidebar = () => {
        setIsSidebarOpen(true);
    };

    const closeSidebar = () => {
        setIsSidebarOpen(false);
    };

    const fetchPosts = async (sort = 'hot', subreddit = selectedSubreddit) => {
        setLoadingPosts(true);
        try {
            let url = `https://www.reddit.com/${subreddit}/${sort}.json?limit=10`;
            if (after) {
                url += `&after=${after}`;
            }
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setPosts(prevPosts => [...prevPosts, ...data.data.children.map(post => post.data)]);
            setAfter(data.data.after);
        } catch (e) {
            setContentBlockerDetected(true);
            setError(e.message);
            setShowErrorPopup(true);
        } finally {
            setLoadingPosts(false);
        }
    };
    const fetchComments = async (postId) => {
        setLoadingComments(true);
        try {
            const response = await fetch(`https://www.reddit.com/comments/${postId}.json`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response[1].json();
            setComments(data.data.children.map(comment => comment.data));
            setAfterComment(data.data.after);
        } catch (e) {
            setContentBlockerDetected(true);
            setError(e.message);
            setShowErrorPopup(true);
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

    useEffect(() => {
        fetchPosts();
    }, []);
    const handleScroll = () => {
        if (
            document.documentElement.scrollTop + document.documentElement.clientHeight
            >= document.documentElement.scrollHeight - 200
        ) {
            if (!loadingPosts && after) {
                fetchPosts();
            }
        }
    };
    useEffect(() => {
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [after, loadingPosts]);

    const renderPostFeed = () => (
        <div>
            <div className="flex justify-around mb-4">
                <button className={`bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded ${currentSort === 'hot' ? 'bg-gray-600' : ''}`} onClick={() => changeSortOrder('hot')}>Hot</button>
                <button className={`bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded ${currentSort === 'new' ? 'bg-gray-600' : ''}`} onClick={() => changeSortOrder('new')}>New</button>
                <button className={`bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded ${currentSort === 'top' ? 'bg-gray-600' : ''}`} onClick={() => changeSortOrder('top')}>Top</button>
                <button className={`bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded ${currentSort === 'rising' ? 'bg-gray-600' : ''}`} onClick={() => changeSortOrder('rising')}>Rising</button>
                <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={() => setSearchPageVisible(true)}>
                    <i className="fas fa-search"></i>
                </button>
            </div>
            {savedPosts.length > 0 && (
                <div>
                    <h2>Saved Posts</h2>
                    {savedPosts.map(post => (
                        <div key={post.id} className="post">
                            <a href={post.url} target="_blank" rel="noopener noreferrer">
                                <div className="title-container">
                                    <h2 className="post-title">{post.title}</h2>
                                </div>
                            </a>
                            <p className="post-author">Posted by: {post.author}</p>
                            <p className="post-score">Score: {post.score}</p>
                            <button className="bg-red-600 hover:bg-red-800 text-white font-bold py-2 px-4 rounded" onClick={() => confirmDeleteSavedPost(post)}>
                                Delete
                            </button>
                        </div>
                    ))}
                </div>
            )}
            {posts.map(post => (
                <div key={post.id} className="post">
                    <a href={post.url} target="_blank" rel="noopener noreferrer">
                        <div className="title-container">
                            <h2 className="post-title">{post.title}</h2>
                        </div>
                    </a>
                    <p className="post-author">Posted by: {post.author}</p>
                    <p className="post-score">Score: {post.score}</p>
                    <p className="post-comments" onClick={() => handlePostClick(post.id)}>
                        Comments: {post.num_comments}
                    </p>
                    <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded" onClick={() => confirmSavePost(post)}>
                        Save Post
                    </button>
                    {post.url.match(/\.(jpeg|jpg|gif|png)$/) && (
                        <img
                            src={post.url}
                            alt={post.title}
                            className="mt-2 cursor-pointer"
                            style={{ maxWidth: '100%', maxHeight: '300px' }}
                            onClick={() => handleImageClick(post.url)}
                        />
                    )}
                    {selectedPostId === post.id && (
                        <div>
                            <h3>Comments:</h3>
                            {comments.map(comment => (
                                <div key={comment.id} className="comment">
                                    <p>{comment.author}: {comment.body}</p>
                                    {comment.url && comment.url.match(/\.(jpeg|jpg|gif|png)$/) && (
                                        <img
                                            src={comment.url}
                                            alt="Comment Image"
                                            className="mt-2 cursor-pointer"
                                            style={{ maxWidth: '100%', maxHeight: '200px' }}
                                            onClick={() => handleCommentImageClick(comment.url)}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
            {loadingPosts && <p>Loading more posts...</p>}
            {contentBlockerDetected && <p>Content blocker detected. Please disable it to load posts.</p>}
        </div>
    );

    return (
        <div className="App">
            <button className="sidebar-button" onClick={openSidebar}>
                <i className="fas fa-bars"></i>
            </button>
            <button className="theme-switcher" onClick={toggleTheme}>
                <i className="fas fa-adjust"></i> Change Theme
            </button>
            <div className="absolute top-1 left-1 z-50">
                <img src="assets/favicon/favicon.svg" height="50" width="50" onClick={openSidebar} className="cursor-pointer" />
            </div>
            <div className={`subreddit-sidebar ${isSidebarOpen ? 'open' : ''}`}>
                <button className="close-button" onClick={closeSidebar}>
                    <i className="fas fa-times"></i>
                </button>
                <h2>Subreddits</h2>
                <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={() => setShowAddSubreddit(true)}>
                    Add Subreddit
                </button>
                {showAddSubreddit && (
                    <div className="mt-2">
                        <input
                            type="text"
                            id="add-subreddit-input"
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            placeholder="r/subreddit"
                            value={newSubreddit}
                            onChange={(e) => setNewSubreddit(e.target.value)}
                        />
                        <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mt-2" onClick={handleAddSubreddit}>
                            Add
                        </button>
                    </div>
                )}
                <ul>
                    {subreddits.map(subreddit => (
                        <li key={subreddit.name} className={`p-2 rounded-md hover:bg-gray-800 cursor-pointer ${selectedSubreddit === subreddit.name ? 'bg-gray-700' : ''}`}
                            onClick={() => handleSubredditClick(subreddit.name)}
                            onContextMenu={(event) => handleContextMenu(event, subreddit.name)}>
                            {subreddit.name}
                        </li>
                    ))}
                </ul>
            </div>
            {isContextMenuVisible && (
                <div className="fixed z-50" style={{ top: contextMenuPosition.y, left: contextMenuPosition.x }}>
                    <div className="bg-gray-800 shadow-md rounded-md py-2">
                        <button className="block px-4 py-2 text-white hover:bg-gray-700" onClick={removeSubreddit}>
                            Remove Subreddit
                        </button>
                    </div>
                </div>
            )}
            <div className="content" style={{ marginLeft: isSidebarOpen ? '0' : '0' }}>
                <div className="container mx-auto px-4">
                    {showSavePostConfirmation && (renderSavePostConfirmation())}
                    {searchPageVisible ? (
                        <SearchPage
                            searchQuery={searchQuery}
                            searchResults={searchResults}
                            loadingSearchResults={loadingSearchResults}
                            handleSearchInputChange={handleSearchInputChange}
                            handleSearch={handleSearch}
                            renderSearchResults={renderSearchResults}
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
const SearchPage = ({ searchQuery, searchResults, loadingSearchResults, handleSearchInputChange, handleSearch, renderSearchResults, onClose }) => (
    <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 z-50 flex justify-center items-center">
        <div className="bg-gray-900 p-4 rounded-md w-3/4 max-w-2xl