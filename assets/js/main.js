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
    const [showSidebar, setShowSidebar] = useState(false);
    const [enlargedImage, setEnlargedImage] = useState(null);
    const [enlargedCommentImage, setEnlargedCommentImage] = useState(null);
    const [error, setError] = useState(null);
    const [showErrorPopup, setShowErrorPopup] = useState(false);
    const [savedPosts, setSavedPosts] = useState(() => JSON.parse(localStorage.getItem('savedPosts') || '[]'));
    const [showDeletePopup, setShowDeletePopup] = useState(false);
    const [postToDelete, setPostToDelete] = useState(null);
	const [toastMessage, setToastMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searchPageVisible, setSearchPageVisible] = useState(false);

    const sidebarRef = useRef(null);
    const [sortType, setSortType] = useState('hot');

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
        const handleClickOutside = (event) => {
            if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
                setShowSidebar(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        fetchPosts();
    }, [selectedSubreddit, sortType]);

    useEffect(() => {
        if (error) {
            setShowErrorPopup(true);
        } else {
            setShowErrorPopup(false);
        }
    }, [error]);

    const fetchPosts = async () => {
        setLoadingPosts(true);
        try {
            let url = `https://www.reddit.com/${selectedSubreddit}/${sortType}.json?limit=25`;
            if (after) {
                url += `&after=${after}`;
            }
            const response = await fetch(url);
            const data = await response.json();

            if (data.error) {
                setError(`Failed to fetch posts: ${data.message}`);
                setLoadingPosts(false);
                return;
            }

            const newPosts = data.data.children.map(post => post.data);
            setPosts(prevPosts => [...newPosts]);
            setAfter(data.data.after);
            setError(null); // Clear any previous errors
        } catch (error) {
            setError(`An error occurred while fetching posts: ${error.message}`);
        } finally {
            setLoadingPosts(false);
        }
    };

    const fetchComments = async (postId, type = 'comments') => {
        setLoadingComments(true);
        try {
            let url = `https://www.reddit.com/${selectedSubreddit}/comments/${postId}.json`;
            const response = await fetch(url);
            const data = await response.json();
            if (data.error) {
                 setError(`Failed to fetch comments: ${data.message}`);
                 return;
            }
            setComments(data[1].data.children.map(comment => comment.data));
            setSelectedPostId(postId);
        } catch (error) {
            setError(`An error occurred while fetching comments: ${error.message}`);
        } finally {
            setLoadingComments(false);
        }
    };

    const addSubreddit = (newSubreddit) => {
        if (!newSubreddit.startsWith('r/')) {
            newSubreddit = 'r/' + newSubreddit;
        }

        if (subreddits.find(sub => sub.name === newSubreddit)) {
			setToastMessage('Subreddit already exists!');
            return;
        }
        setSubreddits(prevSubreddits => [...prevSubreddits, { name: newSubreddit }]);
		setToastMessage('Subreddit added!');
    };

    const removeSubreddit = (subredditToRemove) => {
        setSubreddits(prevSubreddits => prevSubreddits.filter(sub => sub.name !== subredditToRemove));
		setToastMessage('Subreddit removed!');
    };

    const selectSubreddit = (subreddit) => {
        setSelectedSubreddit(subreddit);
        setShowSidebar(false);
        setPosts([]);
        setAfter(null);
    };

    const toggleSidebar = () => {
        setShowSidebar(!showSidebar);
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

    const savePost = (post) => {
        const isPostSaved = savedPosts.some(savedPost => savedPost.id === post.id);
        if (!isPostSaved) {
            setSavedPosts(prevSavedPosts => [...prevSavedPosts, post]);
			setToastMessage('Post saved!');
        } else {
			setToastMessage('Post already saved!');
		}
    };

    const deleteSavedPost = (postId) => {
        setPostToDelete(postId);
        setShowDeletePopup(true);
    };

    const confirmDeletePost = () => {
        setSavedPosts(prevSavedPosts => prevSavedPosts.filter(post => post.id !== postToDelete));
        setShowDeletePopup(false);
		setToastMessage('Post deleted!');
    };

    const cancelDeletePost = () => {
        setShowDeletePopup(false);
        setPostToDelete(null);
    };

    const clearError = () => {
        setError(null);
        setShowErrorPopup(false);
    };

    const handleSortChange = (type) => {
        setSortType(type);
        setPosts([]);
        setAfter(null);
    };

    const handleSearchInputChange = (event) => {
        setSearchQuery(event.target.value);
    };

    const handleSearchSubmit = async (event) => {
        event.preventDefault();
        if (!searchQuery) return;
        setSearchPageVisible(true);
        try {
            const response = await fetch(`https://www.reddit.com/search.json?q=${searchQuery}&sort=relevance&t=all&limit=25`);
            const data = await response.json();
            if (data.error) {
                 setError(`Failed to fetch search results: ${data.message}`);
                 return;
            }
            setSearchResults(data.data.children.map(result => result.data));
        } catch (error) {
            setError(`An error occurred while fetching search results: ${error.message}`);
        }
    };

    const handleSearchResultClick = (post) => {
        setSearchPageVisible(false);
        setPosts([post]); // Display only the selected post
    };

    const renderSubredditList = () => (
        
            {subreddits.map((subreddit, index) => (
                
                    {subreddit.name}
                
            ))}
        
    );

	const renderPosts = () => (
		
			{posts.map(post => (
				
					{post.title}
					{post.url && (
						
							{post.url}
						
					)}
					{post.thumbnail && (
						
					)}
					{post.author} | {post.score} points | {post.num_comments} comments
					
						{post.selftext && (
							
								{post.selftext}
							
						)}
					
				
			))}
		
	);

    const renderPostFeed = () => (
        
            
                
                    Hot
                
                
                    New
                
                
                    Top
                
                
                    Rising
                
            
            {posts.length > 0 ? (
                renderPosts()
            ) : (
                
                    {loadingPosts ? 'Loading posts...' : 'No posts to display.'}
                
            )}
            {after && (
                
                    Load More
                
            )}
        
    );

    const renderComments = () => (
        
            {comments.map(comment => (
                
                    {comment.author}
                    {comment.body}
                
            ))}
        
    );

    const renderEnlargedPostImages = () => (
        
            
                
                    
                
            
        
    );

    const renderEnlargedCommentImages = () => (
        
            
                
                    
                
            
        
    );

    const renderErrorPopup = () => (
        
            
                
                    Error
                
                
                    {error}
                
                
                    OK
                
            
        
    );

    const renderDeleteSavedPostPopup = () => (
        
            
                
                    Confirm Delete
                
                
                    Are you sure you want to delete this post?
                
                
                    
                        
                            Cancel
                        
                        
                            Delete
                        
                    
                
            
        
    );
	
	const Toast = ({ message, onClose }) => {
		useEffect(() => {
			const timer = setTimeout(() => {
				onClose();
			}, 3000);
			return () => clearTimeout(timer);
		}, [onClose]);

		return (
			
				{message}
			
		);
	};

    const SearchPage = ({ searchQuery, searchResults, onSelect, onClose }) => {
        return (
            
                
                    
                        Search results for "{searchQuery}"
                    
                    
                        Close
                    
                
                {searchResults.length > 0 ? (
                    
                        {searchResults.map(result => (
                            
                                {result.title}
                            
                        ))}
                    
                ) : (
                    
                        No results found.
                    
                )}
            
        );
    };

    return (
        
            
                
                    
                        
                        
                            
                        
                        
                            
                                
                            
                            
                                
                            
                        
                    
                    
                        
                            
                                
                                    
                                        {subreddits.map((subreddit) => (
                                            
                                                {subreddit.name}
                                            
                                        ))}
                                    
                                    
                                        
                                            Add Subreddit
                                        
                                    
                                
                            
                        
                    
                
                
                    
                        
                            
                                
                                    
                                        
                                            
                                        
                                    
                                
                            
                        
                    
                    {searchPageVisible ? (
                        
                            {searchQuery}
                            searchResults={searchResults}
                            onSelect={handleSearchResultClick}
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
            
                
                    {searchQuery}
                    searchResults={searchResults}
                    onSelect={handleSearchResultClick}
                    onClose={() => setSearchPageVisible(false)} 
                />
            
        
    )
}

const rootElement = document.getElementById('root');
const root = createRoot(rootElement);
root.render(<App />);