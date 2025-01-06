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
    const [showSettings, setShowSettings] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [currentSort, setCurrentSort] = useState('hot');
	const [isThemeAmethyst, setIsThemeAmethyst] = useState(localStorage.getItem('isThemeAmethyst') === 'true' || false);
    const [enlargedImage, setEnlargedImage] = useState(null);
    const [enlargedCommentImage, setEnlargedCommentImage] = useState(null);
    const [savedPosts, setSavedPosts] = useState(() => JSON.parse(localStorage.getItem('savedPosts') || '[]'));
    const [showErrorPopup, setShowErrorPopup] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [showDeletePopup, setShowDeletePopup] = useState(false);
    const [postToDelete, setPostToDelete] = useState(null);
    const [toastMessage, setToastMessage] = useState('');
    const [searchPageVisible, setSearchPageVisible] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        localStorage.setItem('isThemeAmethyst', isThemeAmethyst);
		if (isThemeAmethyst) {
            document.body.classList.add('amethyst');
        } else {
            document.body.classList.remove('amethyst');
        }
    }, [isThemeAmethyst]);

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
        fetchPosts();
		window.scrollTo(0, 0);
    }, [selectedSubreddit, currentSort]);

    const fetchPosts = async () => {
        setLoadingPosts(true);
        try {
            let url = `https://www.reddit.com/${selectedSubreddit}/${currentSort}.json?limit=25`;
            if (after) {
                url += `&after=${after}`;
            }
            const response = await fetch(url);
            const data = await response.json();
            if (data && data.data && data.data.children) {
                const newPosts = data.data.children.map(post => post.data);
                setPosts(prevPosts => [...newPosts]);
                setAfter(data.data.after);
            } else {
                setErrorMessage('Failed to fetch posts. Please check the subreddit name and try again.');
                setShowErrorPopup(true);
            }
        } catch (error) {
            console.error("Error fetching posts:", error);
            setErrorMessage('Failed to fetch posts. Please check your internet connection and try again.');
            setShowErrorPopup(true);
        } finally {
            setLoadingPosts(false);
        }
    };

    const fetchComments = async (permalink) => {
        setLoadingComments(true);
        try {
            let url = `https://www.reddit.com${permalink}.json?limit=50`;
            if (afterComment) {
                url += `&after=${afterComment}`;
            }
    
            const response = await fetch(url);
            const data = await response.json();
    
            if (Array.isArray(data) && data.length > 1 && data[1].data && data[1].data.children) {
                const newComments = data[1].data.children.map(comment => comment.data);
                setComments(newComments);
                // Find the "Load more comments" listing
                const moreCommentsListing = data[1].data.children.find(item => item.kind === 'more');
    
                if (moreCommentsListing && moreCommentsListing.data && moreCommentsListing.data.children) {
                    // Extract the last ID from the children array
                    const lastCommentId = moreCommentsListing.data.children[moreCommentsListing.data.children.length - 1];
                    setAfterComment(lastCommentId); // Set afterComment to the last comment's ID
                } else {
                    setAfterComment(null); // No more comments to load
                }
            } else {
                console.warn("Unexpected comment structure:", data);
                setComments([]);
                setAfterComment(null);
            }
        } catch (error) {
            console.error("Error fetching comments:", error);
            setErrorMessage('Failed to fetch comments. Please check your internet connection and try again.');
            setShowErrorPopup(true);
            setComments([]);
            setAfterComment(null);
        } finally {
            setLoadingComments(false);
        }
    };

    const handleSubredditAdd = (subredditName) => {
        if (subreddits.find(sub => sub.name === subredditName)) {
            setErrorMessage('Subreddit already exists.');
            setShowErrorPopup(true);
            return;
        }
        const newSubreddit = { name: subredditName };
        setSubreddits(prevSubreddits => [...prevSubreddits, newSubreddit]);
    };

    const handleSubredditSelect = (subredditName) => {
        setSelectedSubreddit(subredditName);
        setIsSidebarOpen(false);
        setAfter(null);
        setPosts([]);
		window.scrollTo(0, 0);
    };

    const handleSubredditDelete = (subredditName) => {
        setSubreddits(prevSubreddits => prevSubreddits.filter(sub => sub.name !== subredditName));
        if (selectedSubreddit === subredditName) {
            setSelectedSubreddit('r/0KB');
        }
    };

    const handlePostClick = (post) => {
        setSelectedPost(post);
        setComments([]);
        setAfterComment(null);
        fetchComments(post.permalink);
		window.scrollTo(0, 0);
    };

    const handleCloseComments = () => {
        setSelectedPost(null);
        setComments([]);
    };

    const handleSortChange = (sortType) => {
        setCurrentSort(sortType);
        setAfter(null);
        setPosts([]);
    };
	
	const toggleTheme = () => {
        setIsThemeAmethyst(prevTheme => !prevTheme);
    };

    const handleImageEnlarge = (imageUrl) => {
        setEnlargedImage(imageUrl);
    };

    const handleCloseEnlargedImage = () => {
        setEnlargedImage(null);
    };

    const handleCommentImageEnlarge = (imageUrl) => {
        setEnlargedCommentImage(imageUrl);
    };

    const handleCloseCommentImageEnlarge = () => {
        setEnlargedCommentImage(null);
    };

    const isPostSaved = (post) => {
        return savedPosts.some(savedPost => savedPost.id === post.id);
    };

    const handleSavePost = (post) => {
        if (isPostSaved(post)) {
            setSavedPosts(prevSavedPosts => prevSavedPosts.filter(savedPost => savedPost.id !== post.id));
            setToastMessage('Post unsaved!');
        } else {
            setSavedPosts(prevSavedPosts => [...prevSavedPosts, post]);
            setToastMessage('Post saved!');
        }
    };

    const handleDeleteSavedPost = (post) => {
        setPostToDelete(post);
        setShowDeletePopup(true);
    };

    const confirmDeleteSavedPost = () => {
        setSavedPosts(prevSavedPosts => prevSavedPosts.filter(savedPost => savedPost.id !== postToDelete.id));
        setShowDeletePopup(false);
        setPostToDelete(null);
        setToastMessage('Post deleted from saved!');
    };

    const cancelDeleteSavedPost = () => {
        setShowDeletePopup(false);
        setPostToDelete(null);
    };

    const closeErrorPopup = () => {
        setShowErrorPopup(false);
    };

    const renderPost = (post) => (
        <div key={post.id} className="bg-gray-200 shadow rounded p-4 mb-4">
            <div className="flex items-center mb-2">
                <img src={`https://www.redditstatic.com/avatars/avatar_default_${Math.floor(Math.random() * 8)}.png`} alt="Subreddit Icon" className="w-8 h-8 rounded-full mr-2" />
                <div className="title-container">
                    <h2 className="text-xl font-semibold">
                        <a href={`https://www.reddit.com${post.permalink}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline" onClick={(e) => {e.preventDefault(); handlePostClick(post);}}>
                            {post.title}
                        </a>
                    </h2>
                </div>
            </div>
            <div className="flex items-center text-gray-600 mb-2">
                <a href={`https://www.reddit.com/${post.subreddit_name_prefixed}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline mr-2">
                    {post.subreddit_name_prefixed}
                </a>
                <span className="mr-2">
                    Posted by: {post.author}
                </span>
                <span>
                    {new Date(post.created_utc * 1000).toLocaleDateString()}
                </span>
            </div>
            {post.post_hint === 'image' && (
                <div className="mb-2">
                    <img 
                        src={post.url} 
                        alt={post.title} 
                        className="w-full rounded cursor-pointer" 
                        onClick={() => handleImageEnlarge(post.url)}
                    />
                </div>
            )}
             {post.is_video && post.media && post.media.reddit_video && (
                <div className="mb-2">
                    <video controls className="w-full rounded">
                        <source src={post.media.reddit_video.fallback_url} type="video/mp4" />
                        Your browser does not support the video tag.
                    </video>
                </div>
            )}
            <p className="text-gray-700">
                Score: {post.score} | Comments: {post.num_comments}
            </p>
            <button onClick={() => handleSavePost(post)} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-2">
                {isPostSaved(post) ? 'Unsave' : 'Save'}
            </button>
        </div>
    );

    const renderComment = (comment, level = 0) => {
        const indent = level * 15;
        const isOP = comment.author === selectedPost.author;
    
        return (
            <div key={comment.id} className="comment" style={{ marginLeft: `${indent}px` }}>
                <div className="flex items-start text-gray-600 mb-2">
                    <span className="mr-2 font-semibold">{comment.author} {isOP && <span className="text-red-500">(OP)</span>}</span>
                    <span className="mr-2">
                        {new Date(comment.created_utc * 1000).toLocaleDateString()}
                    </span>
                    {comment.score != null && (
                        <span>Score: {comment.score}</span>
                    )}
                </div>
                {comment.body && (
                    <p className="text-gray-700 body-text">
                        {comment.body}
                    </p>
                )}
                {comment.replies && comment.replies.data && comment.replies.data.children && (
                    comment.replies.data.children.map(reply => renderComment(reply.data, level + 1))
                )}
                 {comment.body && comment.body.includes('https://i.redd.it/') && (
                    <div className="mb-2">
                        <img 
                            src={comment.body.substring(comment.body.indexOf('https://i.redd.it/'), comment.body.indexOf(' ', comment.body.indexOf('https://i.redd.it/')) > 0 ? comment.body.indexOf(' ', comment.body.indexOf('https://i.redd.it/')) : comment.body.length)}
                            alt="Comment Image"
                            className="w-full rounded cursor-pointer"
                            onClick={() => handleCommentImageEnlarge(comment.body.substring(comment.body.indexOf('https://i.redd.it/'), comment.body.indexOf(' ', comment.body.indexOf('https://i.redd.it/')) > 0 ? comment.body.indexOf(' ', comment.body.indexOf('https://i.redd.it/')) : comment.body.length))}
                        />
                    </div>
                )}
            </div>
        );
    };
    

    const renderPostFeed = () => (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">{selectedSubreddit}</h1>
                <div className="space-x-2">
                    <button onClick={() => handleSortChange('hot')} className={`bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded ${currentSort === 'hot' ? 'bg-gray-400' : ''}`}>Hot</button>
                    <button onClick={() => handleSortChange('new')} className={`bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded ${currentSort === 'new' ? 'bg-gray-400' : ''}`}>New</button>
                    <button onClick={() => handleSortChange('top')} className={`bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded ${currentSort === 'top' ? 'bg-gray-400' : ''}`}>Top</button>
                    <button onClick={() => handleSortChange('rising')} className={`bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded ${currentSort === 'rising' ? 'bg-gray-400' : ''}`}>Rising</button>
                </div>
            </div>
            {posts.map(post => (
                renderPost(post)
            ))}
            {loadingPosts && <p>Loading more posts...</p>}
            {!loadingPosts && after && (
                <button onClick={fetchPosts} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4">
                    Load More
                </button>
            )}
        </div>
    );

    const renderComments = () => (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">Comments</h1>
                <button onClick={handleCloseComments} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
                    Close Comments
                </button>
            </div>
            {comments.map(comment => (
                renderComment(comment)
            ))}
            {loadingComments && <p>Loading more comments...</p>}
            {!loadingComments && afterComment && (
                <button onClick={() => fetchComments(selectedPost.permalink)} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4">
                    Load More Comments
                </button>
            )}
        </div>
    );
	
	const renderSettingsPopup = () => (
        <div className="settings-popup">
            <h2>Settings</h2>
            <button onClick={toggleTheme}>Toggle Theme</button>
            <button onClick={() => setShowSettings(false)}>Close</button>
        </div>
    );

    const renderEnlargedPostImages = () => (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
        }} onClick={handleCloseEnlargedImage}>
            <img src={enlargedImage} alt="Enlarged Post" style={{ maxWidth: '90%', maxHeight: '90%' }} />
        </div>
    );

     const renderEnlargedCommentImages = () => (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
        }} onClick={handleCloseCommentImageEnlarge}>
            <img src={enlargedCommentImage} alt="Enlarged Comment" style={{ maxWidth: '90%', maxHeight: '90%' }} />
        </div>
    );

    const renderErrorPopup = () => (
        <div className="error-popup">
            <h2>Error</h2>
            <p>{errorMessage}</p>
            <button onClick={closeErrorPopup}>OK</button>
        </div>
    );

    const renderDeleteSavedPostPopup = () => (
        <div className="delete-popup">
            <h2>Delete Post</h2>
            <p>Are you sure you want to delete this post from your saved posts?</p>
            <button onClick={confirmDeleteSavedPost}>Yes, Delete</button>
            <button onClick={cancelDeleteSavedPost}>Cancel</button>
        </div>
    );

    const renderSidebar = () => (
        <div className={`sidebar ${isSidebarOpen ? 'open' : ''} bg-gray-100 w-64 p-4`}>
            <div className="mb-4">
                <h2 className="text-xl font-bold mb-2">Subreddits</h2>
                <ul>
                    {subreddits.map(subreddit => (
                        <li key={subreddit.name} className="mb-2">
                            <a
                                href="#"
                                className="text-blue-500 hover:underline"
                                onClick={() => handleSubredditSelect(subreddit.name)}
                                onContextMenu={(e) => {
                                    e.preventDefault();
                                    handleSubredditDelete(subreddit.name);
                                }}
                                onTouchStart={(e) => {
                                    const touchTimeout = setTimeout(() => {
                                        handleSubredditDelete(subreddit.name);
                                    }, 1000);

                                    const handleTouchEnd = () => {
                                        clearTimeout(touchTimeout);
                                        e.target.removeEventListener('touchend', handleTouchEnd);
                                        e.target.removeEventListener('touchcancel', handleTouchEnd);
                                    };

                                    e.target.addEventListener('touchend', handleTouchEnd);
                                    e.target.addEventListener('touchcancel', handleTouchEnd);
                                }}
                            >
                                {subreddit.name}
                            </a>
                        </li>
                    ))}
                </ul>
            </div>
            <div className="mb-4">
                <h2 className="text-xl font-bold mb-2">Add Subreddit</h2>
                <div className="flex">
                    <input
                        type="text"
                        placeholder="r/SubredditName"
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mr-2"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handleSubredditAdd(e.target.value);
                                e.target.value = '';
                            }
                        }}
                    />
                    <button
                        onClick={(e) => {
                            const input = e.target.previousElementSibling;
                            handleSubredditAdd(input.value);
                            input.value = '';
                        }}
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    >
                        Add
                    </button>
                </div>
            </div>
            <div>
                <button onClick={() => {setIsSidebarOpen(false