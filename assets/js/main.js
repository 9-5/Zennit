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
    const [selectedPost, setSelectedPost] = useState(null);
    const [enlargedImage, setEnlargedImage] = useState(null);
    const [enlargedCommentImage, setEnlargedCommentImage] = useState(null);
    const [sortType, setSortType] = useState('hot');
    const [showErrorPopup, setShowErrorPopup] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [showDeletePopup, setShowDeletePopup] = useState(false);
    const [postToDelete, setPostToDelete] = useState(null);
    const [toastMessage, setToastMessage] = useState('');
    const [savedPosts, setSavedPosts] = useState(() => JSON.parse(localStorage.getItem('savedPosts') || '[]'));
    const [searchPageVisible, setSearchPageVisible] = useState(false);
    const [searchResults, setSearchResults] = useState([]);


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
        if (selectedPost) {
            fetchComments(selectedPost.data.permalink);
        }
    }, [selectedPost]);
	
	const fetchUserComments = async (commentPermalink) => {
		setLoadingComments(true);
		try {
			const response = await fetch(`https://www.reddit.com${commentPermalink}.json`);
			const data = await response.json();
			setUserComments(data[1].data.children);
			setUserAfterComment(data[1].data.after);
		} catch (error) {
			console.error("Error fetching comments:", error);
		} finally {
			setLoadingComments(false);
		}
	};

    const fetchPosts = async (loadMore = false) => {
        if (contentBlockerDetected) return;
        setLoadingPosts(true);
        try {
            const apiUrl = `https://www.reddit.com/${selectedSubreddit}/${sortType}.json?limit=10${loadMore ? `&after=${after}` : ''}`;
            const response = await fetch(apiUrl);
            const data = await response.json();

            if (loadMore) {
                setPosts(prevPosts => [...prevPosts, ...data.data.children]);
            } else {
                setPosts(data.data.children);
            }
            setAfter(data.data.after);
        } catch (error) {
            console.error("Error fetching posts:", error);
        } finally {
            setLoadingPosts(false);
        }
    };

    const fetchComments = async (permalink, loadMore = false) => {
        setLoadingComments(true);
        try {
            const apiUrl = `https://www.reddit.com${permalink}.json?limit=10${loadMore ? `&after=${afterComment}` : ''}`;
            const response = await fetch(apiUrl);
            const data = await response.json();
            if (loadMore) {
                setComments(prevComments => [...prevComments, ...data[1].data.children]);
            } else {
                setComments(data[1].data.children);
            }
            setAfterComment(data[1].data.after);
        } catch (error) {
            console.error("Error fetching comments:", error);
        } finally {
            setLoadingComments(false);
        }
    };

    const addSubreddit = (subredditName) => {
        if (subreddits.find(sub => sub.name === subredditName)) {
            setErrorMessage('Subreddit already exists.');
            setShowErrorPopup(true);
            return;
        }

        setSubreddits(prevSubreddits => [...prevSubreddits, { name: subredditName }]);
    };

    const removeSubreddit = (subredditName) => {
        setSubreddits(prevSubreddits => prevSubreddits.filter(sub => sub.name !== subredditName));
        if (selectedSubreddit === subredditName) {
            setSelectedSubreddit('r/0KB');
        }
    };

    const handleSubredditClick = (subredditName) => {
        setSelectedSubreddit(subredditName);
        setAfter(null);
    };

    const handlePostClick = (post) => {
        setSelectedPost(post);
		fetchUserComments(post.data.permalink)
    };

    const handleCloseComments = () => {
        setSelectedPost(null);
    };

    const handleImageClick = (url) => {
        setEnlargedImage(url);
    };

    const handleCloseEnlargedImage = () => {
        setEnlargedImage(null);
    };

    const handleCommentImageClick = (url) => {
        setEnlargedCommentImage(url);
    };

    const handleCloseEnlargedCommentImage = () => {
        setEnlargedCommentImage(null);
    };

    const handleSortChange = (type) => {
        setSortType(type);
        setAfter(null);
    };

    const handleErrorPopupClose = () => {
        setShowErrorPopup(false);
        setErrorMessage('');
    };

    const handleSavePost = (post) => {
        const isPostSaved = savedPosts.some(savedPost => savedPost.data.id === post.data.id);
        if (isPostSaved) {
            setToastMessage('Post already saved!');
            return;
        }
        setSavedPosts(prevSavedPosts => [...prevSavedPosts, post]);
        setToastMessage('Post saved!');
    };

    const handleDeletePost = (post) => {
        setPostToDelete(post);
        setShowDeletePopup(true);
    };

    const confirmDeletePost = () => {
        setSavedPosts(prevSavedPosts => prevSavedPosts.filter(savedPost => savedPost.data.id !== postToDelete.data.id));
        setShowDeletePopup(false);
        setPostToDelete(null);
        setToastMessage('Post deleted!');
    };

    const cancelDeletePost = () => {
        setShowDeletePopup(false);
        setPostToDelete(null);
    };

    const renderSubredditSidebar = () => (
        
            
                
                    Zennit
                
                
                    {(e) => {
                        e.preventDefault();
                        const subredditName = e.target.subreddit.value;
                        addSubreddit(subredditName);
                        e.target.reset();
                    }}
                >
                    
                    
                    
                
                
                    {subreddits.map(subreddit => (
                         handleSubredditClick(subreddit.name)}
                            onContextMenu={(e) => {
                                e.preventDefault();
                                removeSubreddit(subreddit.name);
                            }}
                            onTouchStart={(e) => {
                                handleTouchStart(e, subreddit.name);
                            }}
                            onTouchEnd={(e) => {
                                clearTimeout(touchTimeout.current);
                            }}
                            onTouchCancel={() => {
                                clearTimeout(touchTimeout.current);
                            }}
                        >
                            {subreddit.name}
                        
                    ))}
                
                
                    Saved Posts
                    Search Subreddits
                
            
        
    );

    const renderPost = (post) => {
        const isSaved = savedPosts.some(savedPost => savedPost.data.id === post.data.id);
        return (
            
                
                    
                        
                            
                                {post.data.title}
                            
                            
                                {post.data.flair && (
                                    {post.data.flair}
                                )}
                            
                        
                        
                            {post.data.url.match(/\.(jpeg|jpg|gif|png)$/) && (
                                
                            )}
                        
                    
                    
                        
                            u/{post.data.author}
                            {new Date(post.data.created_utc * 1000).toLocaleString()}
                            {post.data.num_comments} comments
                            {isSaved ? (
                                 handleDeletePost(post)} className="save-button">Delete Post ) : (
                                 handleSavePost(post)} className="save-button">Save Post
                            )}
                        
                    
                
                {selectedPost && selectedPost.data.id === post.data.id && renderPostPreview(post)}
            
        );
    };
	
	const renderUserComment = (comment) => {
		return (
			
				
					
						u/{comment.data.author}
						{new Date(comment.data.created_utc * 1000).toLocaleString()}
					
					
						{comment.data.body}
					
				
			
		);
	}

    const renderPostPreview = (post) => (
        
            
                
                    Close
                
                
                    {comments.map(comment => (
                        
                            
                                u/{comment.data.author}
                                {new Date(comment.data.created_utc * 1000).toLocaleString()}
                            
                            
                                {comment.data.body}
                                {comment.data.url.match(/\.(jpeg|jpg|gif|png)$/) && (
                                    
                                )}
                            
                        
                    ))}
					
                
            
    );

    const renderPostFeed = () => (
        
            
                
                    Hot
                    New
                    Top
                    Rising
                
                {posts.map(post => (
                    renderPost(post)
                ))}
                {loadingPosts ? (
                    Loading more posts...
                ) : (
                    
                )}
            
    );
	
	const performSearch = async (query) => {
        try {
            const response = await fetch(`https://www.reddit.com/search.json?q=${query}&type=sr`);
            const data = await response.json();
            setSearchResults(data.data.children);
        } catch (error) {
            console.error("Error fetching search results:", error);
        }
    };
	
	const renderSearchPage = () => {
		const [searchQuery, setSearchQuery] = useState('');
		
		const handleSearchSubmit = (e) => {
            e.preventDefault();
            performSearch(searchQuery);
        };
		
		return (
            
                
                    
                        Search Subreddits
                        
                            
                                
                            
                            
                                Search
                            
                        
                    
                    
                        {searchResults.length > 0 ? (
                            
                                {searchResults.map(result => (
                                    
                                        
                                            r/{result.data.display_name}
                                        
                                    
                                ))}
                            
                        ) : (
                            No results found.
                        )}
                    
                    
                        Close
                    
                
            
        );
	};

    const renderEnlargedPostImages = () => (
        
            
                
                    
                
            
        
    );

    const renderEnlargedCommentImages = () => (
        
            
                
                    
                
            
        
    );

    const renderErrorPopup = () => (
        
            
                
                    Error
                    {errorMessage}
                    
                
            
        
    );

    const renderDeleteSavedPostPopup = () => (
        
            
                
                    
                        Are you sure you want to delete this post?
                    
                    
                        
                            Cancel
                            Delete
                        
                    
                
            
        
    );

    const touchTimeout = useRef(null);
    const handleTouchStart = (e, subredditName) => {
        touchTimeout.current = setTimeout(() => {
            removeSubreddit(subredditName);
        }, 1500);
    };

    return (
        
            
                {renderSubredditSidebar()}
            
            
                
                    {searchPageVisible ? (
                        
                            onClose={() => setSearchPageVisible(false)} 
                        />
                    ) : (
                        renderPostFeed()
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
root.render(<App />);