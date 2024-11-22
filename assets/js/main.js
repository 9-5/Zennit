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
    const [sortType, setSortType] = useState('hot');
    const [showSidebar, setShowSidebar] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [enlargedImage, setEnlargedImage] = useState(null);
    const [enlargedCommentImage, setEnlargedCommentImage] = useState(null);
	const [showErrorPopup, setShowErrorPopup] = useState(false);
	const [errorMessage, setErrorMessage] = useState('');
    const [savedPosts, setSavedPosts] = useState(() => JSON.parse(localStorage.getItem('savedPosts') || '[]'));
    const [showDeletePopup, setShowDeletePopup] = useState(false);
    const [postToDelete, setPostToDelete] = useState(null);
    const [toastMessage, setToastMessage] = useState('');
    const [isOffline, setIsOffline] = useState(!navigator.onLine);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchPageVisible, setSearchPageVisible] = useState(false);
    const sidebarRef = useRef(null);

    useEffect(() => {
        const handleOfflineStatus = () => setIsOffline(!navigator.onLine);
        window.addEventListener('offline', handleOfflineStatus);
        window.addEventListener('online', handleOfflineStatus);
        return () => {
            window.removeEventListener('offline', handleOfflineStatus);
            window.removeEventListener('online', handleOfflineStatus);
        };
    }, []);

    useEffect(() => {
        if (!contentBlockerDetected) {
            fetch('https://www.reddit.com/r/0kb/new.json?limit=1')
                .then(response => {
                    if (!response.ok && response.status === 403) {
                        setContentBlockerDetected(true);
                    }
                })
                .catch(() => {
                    setContentBlockerDetected(true);
                });
        }
    }, [contentBlockerDetected]);

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
    }, [selectedSubreddit, sortType]);

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (searchQuery.trim() !== '') {
            setSearchPageVisible(true);
        } else {
            setSearchPageVisible(false);
        }
    };

    const handleClickOutside = (event) => {
        if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
            setShowSidebar(false);
        }
    };

    const toggleSidebar = () => {
        setShowSidebar(!showSidebar);
    };

    const toggleSettings = () => {
        setShowSettings(!showSettings);
    };

    const fetchPosts = async (loadMore = false) => {
        if (contentBlockerDetected) {
            return;
        }
        setLoadingPosts(true);
        try {
            const url = `https://www.reddit.com/${selectedSubreddit}/${sortType}.json?limit=10&${loadMore ? `after=${after}` : ''}`;
            const response = await fetch(url);
            const data = await response.json();
			if (response.status === 403) {
				setContentBlockerDetected(true);
				setErrorMessage('Content blocker detected. Please disable it to load content.');
				setShowErrorPopup(true);
				return;
			}

            if (loadMore) {
                setPosts(prevPosts => [...prevPosts, ...data.data.children]);
            } else {
                setPosts(data.data.children);
            }
            setAfter(data.data.after);
        } catch (error) {
			setErrorMessage('Failed to load posts. Please check your internet connection and subreddit name.');
			setShowErrorPopup(true);
            console.error("Error fetching posts:", error);
        } finally {
            setLoadingPosts(false);
        }
    };

    const fetchComments = async (postId, loadMore = false, userFetch = false) => {
        setLoadingComments(true);
        try {
            let url = `https://www.reddit.com/r/${selectedSubreddit.substring(2)}/comments/${postId}.json?sort=confidence&limit=10`;
    
            if (loadMore) {
                url += `&after=${userFetch ? userAfterComment : afterComment}`;
            }
    
            const response = await fetch(url);
            const data = await response.json();
    
            if (data && data[1] && data[1].data && data[1].data.children) {
                const newComments = data[1].data.children.filter(comment => comment.kind === 't1');
    
                if (loadMore) {
                    setComments(prevComments => [...prevComments, ...newComments]);
                } else {
                    setComments(newComments);
                }
    
                if (userFetch) {
                    setUserAfterComment(data[1].data.after);
                } else {
                    setAfterComment(data[1].data.after);
                }
            }
        } catch (error) {
            console.error("Error fetching comments:", error);
        } finally {
            setLoadingComments(false);
        }
    };

    const handleSubredditChange = (event) => {
        setSelectedSubreddit(event.target.value);
    };

    const addSubreddit = (subredditName) => {
        if (subredditName && !subreddits.find(sub => sub.name === subredditName)) {
            setSubreddits([...subreddits, { name: subredditName }]);
        }
    };

    const removeSubreddit = (subredditName) => {
        setSubreddits(subreddits.filter(sub => sub.name !== subredditName));
    };

    const openPost = (postId) => {
        setSelectedPostId(postId);
        fetchComments(postId);
    };

    const closePost = () => {
        setSelectedPostId(null);
		setComments([]);
    };

    const handleSortChange = (type) => {
        setSortType(type);
    };

	const handleImageClick = (imageUrl) => {
        setEnlargedImage(imageUrl);
    };

	const handleCommentImageClick = (imageUrl) => {
        setEnlargedCommentImage(imageUrl);
    };

    const savePost = (post) => {
        const isPostSaved = savedPosts.some(savedPost => savedPost.data.id === post.data.id);
        if (!isPostSaved) {
            setSavedPosts([...savedPosts, post]);
			setToastMessage('Post saved!');
        } else {
			setToastMessage('Post already saved!');
		}
    };

    const deleteSavedPost = (postId) => {
        setPostToDelete(postId);
        setShowDeletePopup(true);
    };

    const confirmDeleteSavedPost = () => {
        setSavedPosts(savedPosts => savedPosts.filter(post => post.data.id !== postToDelete));
        setShowDeletePopup(false);
		setToastMessage('Post removed!');
    };

    const cancelDeleteSavedPost = () => {
        setShowDeletePopup(false);
    };

	const closeErrorPopup = () => {
        setShowErrorPopup(false);
    };

    const parseCommentImages = (commentBody) => {
        const imageUrls = [];
    
        // Match Markdown image syntax: ![alt text](url)
        const markdownRegex = /!\[.*?\]\((.*?)\)/g;
        let markdownMatch;
        while ((markdownMatch = markdownRegex.exec(commentBody)) !== null) {
            imageUrls.push(markdownMatch[1]);
        }
    
        // Match HTML image tags: <img src="url" ...>
        const htmlRegex = /<img.*?src="(.*?)"/g;
        let htmlMatch;
        while ((htmlMatch = htmlRegex.exec(commentBody)) !== null) {
            imageUrls.push(htmlMatch[1]);
        }
    
        return imageUrls;
    };

    const ErrorPopup = ({ message, onClose }) => (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-white p-8 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold mb-4">Error</h2>
                <p className="mb-4">{message}</p>
                <button onClick={onClose} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
                    Close
                </button>
            </div>
        </div>
    );

    const DeleteSavedPostPopup = ({ onConfirm, onCancel }) => (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-white p-8 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold mb-4">Delete Saved Post</h2>
                <p className="mb-4">Are you sure you want to delete this saved post?</p>
                <div className="flex justify-end">
                    <button onClick={onCancel} className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded mr-2">
                        Cancel
                    </button>
                    <button onClick={onConfirm} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
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
            <div className="fixed bottom-4 right-4 bg-green-500 text-white p-3 rounded-md shadow-lg z-50 flex items-center">
                <span className="mr-2">{message}</span>
                <button onClick={onClose} className="focus:outline-none">
                    <i className="fas fa-times"></i>
                </button>
            </div>
        );
    };

    const SearchPage = ({ searchQuery, onClose }) => {
        const [searchResults, setSearchResults] = useState([]);
        const [loading, setLoading] = useState(true);
    
        useEffect(() => {
            const fetchSearchResults = async () => {
                setLoading(true);
                try {
                    const response = await fetch(`https://www.reddit.com/search.json?q=${searchQuery}&limit=10`);
                    const data = await response.json();
                    setSearchResults(data.data.children);
                } catch (error) {
                    console.error("Error fetching search results:", error);
                    setSearchResults([]);
                } finally {
                    setLoading(false);
                }
            };
    
            fetchSearchResults();
        }, [searchQuery]);
    
        return (
            <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-80 z-50 flex justify-center items-center">
                <div className="bg-gray-900 p-8 rounded-lg shadow-md w-4/5 max-h-screen overflow-y-auto">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-white">Search Results for "{searchQuery}"</h2>
                        <button onClick={onClose} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded focus:outline-none">
                            <i className="fas fa-times"></i>
                        </button>
                    </div>
                    {loading ? (
                        <p className="text-white">Loading...</p>
                    ) : (
                        <div>
                            {searchResults.length > 0 ? (
                                searchResults.map(post => (
                                    <div key={post.data.id} className="mb-4 p-4 bg-gray-800 rounded-lg">
                                        <h3 className="text-xl font-semibold text-blue-500 hover:underline">
                                            <a href={`https://www.reddit.com${post.data.permalink}`} target="_blank" rel="noopener noreferrer">{post.data.title}</a>
                                        </h3>
                                        <p className="text-gray-400">Subreddit: {post.data.subreddit_name_prefixed}</p>
                                        {post.data.selftext && (
                                            <p className="text-white">{post.data.selftext.substring(0, 100)}...</p>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <p className="text-white">No results found.</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    };

	const renderEnlargedPostImages = () => (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-80 z-50 flex justify-center items-center">
            <img src={enlargedImage} alt="Enlarged Post Image" className="max-w-full max-h-full" onClick={() => setEnlargedImage(null)} />
            <button onClick={() => setEnlargedImage(null)} className="absolute top-4 right-4 bg-gray-800 text-white p-2 rounded-full focus:outline-none">
                <i className="fas fa-times text-2xl"></i>
            </button>
        </div>
    );
	
	const renderCommentImages = (commentBody) => {
		const imageUrls = parseCommentImages(commentBody);

		if (imageUrls.length > 0) {
			return (
				<div className="comment-images">
					{imageUrls.map((imageUrl, index) => (
						<img key={index} src={imageUrl} alt={`Image ${index + 1}`} className="comment-image" onClick={() => handleCommentImageClick(imageUrl)} />
					))}
				</div>
			);
		}

		return null;
	};
	
	const renderEnlargedCommentImages = () => (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-80 z-50 flex justify-center items-center">
            <img src={enlargedCommentImage} alt="Enlarged Comment Image" className="max-w-full max-h-full" onClick={() => setEnlargedCommentImage(null)} />
            <button onClick={() => setEnlargedCommentImage(null)} className="absolute top-4 right-4 bg-gray-800 text-white p-2 rounded-full focus:outline-none">
                <i className="fas fa-times text-2xl"></i>
            </button>
        </div>
    );

    const renderPostFeed = () => (
        
            
                {posts.map(post => (
                    
                        
                            
                                <img src="assets/zennit-logo.png" alt="Zennit" className="w-8 h-8 rounded-full mr-2" />
                                
                                    {post.data.subreddit_name_prefixed}
                                
                            
                            
                                {new Date(post.data.created_utc * 1000).toLocaleDateString()}
                            
                        
                        
                            {post.data.title}
                        
                        
                            
                                {post.data.url_overridden_by_dest && (
                                    
                                        {post.data.url_overridden_by_dest.match(/\.(jpeg|jpg|gif|png)$/) ? (
                                            <img src={post.data.url_overridden_by_dest} alt={post.data.title} className="w-full rounded-md mb-2" onClick={() => handleImageClick(post.data.url_overridden_by_dest)} />
                                        ) : (
                                            
                                                
                                                    {post.data.domain}
                                                
                                            
                                        )}
                                    
                                )}
                            
                            
                                
                                    
                                        
                                            
                                                {post.data.ups}
                                            
                                        
                                        
                                            
                                                {post.data.num_comments}
                                            
                                        
                                    
                                    
                                        
                                            
                                        
                                    
                                
                            
                        
                    
                ))}
                
                    {loadingPosts ? (
                        
                    ) : (
                        after && (
                            Load More
                        )
                    )}
                
            
        
    );

    const renderComment = (comment) => {
        if (!comment || !comment.data) {
            return null;
        }
    
        return (
            
                
                    
                        <img src="assets/zennit-logo.png" alt="User Avatar" className="w-6 h-6 rounded-full mr-2" />
                        
                            {comment.data.author}
                        
                    
                    
                        {new Date(comment.data.created_utc * 1000).toLocaleDateString()}
                    
                
                
                    {comment.data.body}
					{renderCommentImages(comment.data.body)}
                
            
        );
    };

    const renderPost = () => {
        const post = posts.find(post => post.data.id === selectedPostId);
        if (!post) return null;
    
        return (
            
                
                    
                        <img src="assets/zennit-logo.png" alt="Zennit" className="w-8 h-8 rounded-full mr-2" />
                        
                            {post.data.subreddit_name_prefixed}
                        
                    
                    
                        {new Date(post.data.created_utc * 1000).toLocaleDateString()}
                    
                
                
                    {post.data.title}
                
                
                    
                        {post.data.url_overridden_by_dest && (
                            
                                {post.data.url_overridden_by_dest.match(/\.(jpeg|jpg|gif|png)$/) ? (
                                    <img src={post.data.url_overridden_by_dest} alt={post.data.title} className="w-full rounded-md mb-2" onClick={() => handleImageClick(post.data.url_overridden_by_dest)} />
                                ) : (
                                    
                                        
                                            
                                                {post.data.domain}
                                            
                                        
                                    
                                )}
                            
                        )}
                    
                
                
                    
                        
                            
                                
                                    {post.data.ups}
                                
                            
                            
                                
                                    {post.data.num_comments}
                                
                            
                        
                        
                            
                                
                            
                        
                    
                
                
                    {comments.map(comment => renderComment(comment))}
                    {loadingComments ? (
                        
                    ) : (
                        comments.length > 0 && afterComment && (
                            Load More Comments
                        )
                    )}
                
            
        );
    };

    const renderSidebar = () => (
        
            
                
                    
                        
                            
                        
                    
                
                
                    
                        
                            
                        
                    
                
                
                    Subreddits
                    
                        {subreddits.map(subreddit => (
                            
                                {subreddit.name}
                            
                        ))}
                    
                
                
                    
                        
                    
                
            
        
    );

    return (
        
            
                
                    
                        
                            
                        
                        
                            
                        
                    
                
                
                    
                        
                            
                        
                        
                            
                                {isOffline ? (
                                    
                                        
                                        Offline
                                    
                                ) : (
                                    
                                        
                                            
                                                
                                            
                                            
                                                
                                            
                                            
                                                
                                            
                                        
                                    
                                )}
                            
                        
                        
                            
                                
                                    
                                        
                                    
                                
                            
                        
                    
                    
                        
                            
                                
                            
                        
                    
                
            

            
                {selectedPostId ? (
                    renderPost()
                ) : (
                    searchPageVisible ? (
                        
                            
                                
                                    
                                
                            
                            
                                
                            
                        
                    ) : (
                        renderPostFeed()
                    )
                )}
                {enlargedImage && (renderEnlargedPostImages())}
                {enlargedCommentImage && (renderEnlargedCommentImages())}
            

            {showErrorPopup && renderErrorPopup()}
            {showDeletePopup && (renderDeleteSavedPostPopup())}
            {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage('')} />}
        
    )
}

const rootElement = document.getElementById('root');
const root = createRoot(rootElement);
root.render();