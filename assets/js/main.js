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
    const [newSubreddit, setNewSubreddit] = useState('');
    const [error, setError] = useState(null);
	const [showErrorPopup, setShowErrorPopup] = useState(false);
    const [selectedPost, setSelectedPost] = useState(null);
    const [enlargedImage, setEnlargedImage] = useState(null);
    const [enlargedCommentImage, setEnlargedCommentImage] = useState(null);
    const [currentTheme, setCurrentTheme] = useState(localStorage.getItem('currentTheme') || 'dark');
    const [savedPosts, setSavedPosts] = useState(() => JSON.parse(localStorage.getItem('savedPosts') || '[]'));
    const [showDeletePopup, setShowDeletePopup] = useState(false);
    const [postToDelete, setPostToDelete] = useState(null);
    const [toastMessage, setToastMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searchPageVisible, setSearchPageVisible] = useState(false);
    const [selectedSearchResult, setSelectedSearchResult] = useState(null);

    const handleSearchResultClick = (post) => {
        setSelectedSearchResult(post);
        setSearchPageVisible(false);
        setSelectedPost(post);
        setComments([]);
        setAfterComment(null);
        setUserAfterComment(null);
        loadComments(post.data.permalink);
    };

    const handleSearch = async () => {
        if (!searchQuery) {
            setSearchResults([]);
            return;
        }

        try {
            const response = await fetch(`https://www.reddit.com/search.json?q=${searchQuery}&sort=relevance&t=all&limit=10`);
            const data = await response.json();
            setSearchResults(data.data.children);
            setSearchPageVisible(true);
        } catch (error) {
            console.error("Error fetching search results:", error);
            setError(error.message || 'Failed to fetch search results');
			setShowErrorPopup(true);
        }
    };

    useEffect(() => {
        localStorage.setItem('savedPosts', JSON.stringify(savedPosts));
    }, [savedPosts]);

    const handleSavePost = (post) => {
        const isPostSaved = savedPosts.some(savedPost => savedPost.data.id === post.data.id);
        if (isPostSaved) {
            setSavedPosts(savedPosts.filter(savedPost => savedPost.data.id !== post.data.id));
            setToastMessage('Post unsaved!');
        } else {
            setSavedPosts([...savedPosts, post]);
            setToastMessage('Post saved!');
        }
    };

    const isPostSaved = (post) => {
        return savedPosts.some(savedPost => savedPost.data.id === post.data.id);
    };

    const confirmDeleteSavedPost = (post) => {
        setPostToDelete(post);
        setShowDeletePopup(true);
    };

    const handleDeleteSavedPost = () => {
        if (postToDelete) {
            setSavedPosts(savedPosts.filter(savedPost => savedPost.data.id !== postToDelete.data.id));
            setToastMessage('Post deleted from saved!');
        }
        closeDeleteSavedPostPopup();
    };
	
	const closeDeleteSavedPostPopup = () => {
        setShowDeletePopup(false);
        setPostToDelete(null);
    };

    const toggleTheme = () => {
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        setCurrentTheme(newTheme);
        localStorage.setItem('currentTheme', newTheme);
    };

    useEffect(() => {
        document.body.className = currentTheme;
    }, [currentTheme]);

    useEffect(() => {
        localStorage.setItem('selectedSubreddit', selectedSubreddit);
    }, [selectedSubreddit]);

    useEffect(() => {
        localStorage.setItem('subreddits', JSON.stringify(subreddits));
    }, [subreddits]);

    useEffect(() => {
        loadPosts();
    }, [selectedSubreddit]);

    const loadPosts = async (loadMore = false) => {
        if (loadingPosts) return;
        setLoadingPosts(true);
        setError(null);
		
        const afterParam = loadMore ? `&after=${after}` : '';
		
        try {
            let url = `https://www.reddit.com/${selectedSubreddit}/hot.json?limit=10${afterParam}`;
			
			const response = await fetch(url, {
				headers: {
					'Content-Type': 'application/json'
				}
			});

            if (response.status === 403) {
                setContentBlockerDetected(true);
                setLoadingPosts(false);
                return;
            }

            const data = await response.json();
			
            if (loadMore) {
                setPosts(prevPosts => [...prevPosts, ...data.data.children]);
            } else {
                setPosts(data.data.children);
            }
			
            setAfter(data.data.after);
        } catch (e) {
            console.error("Error fetching posts:", e);
            setError(e.message || 'Failed to load posts');
			setShowErrorPopup(true);
        } finally {
            setLoadingPosts(false);
        }
    };
	
	const renderErrorPopup = () => (
        
            
                Error
            
            
                {error}
            
            
                Close
            
        
    );

    const loadComments = async (permalink, loadMore = false) => {
        if (loadingComments) return;
        setLoadingComments(true);
        setError(null);

        const afterParam = loadMore ? `&after=${afterComment}` : '';
        try {
            const response = await fetch(`https://www.reddit.com${permalink}.json?sort=top${afterParam}`);
            const data = await response[0].json();

            if (!data || !data.data || !data.data.children) {
                console.error("Invalid comment data:", data);
                setError('Failed to load comments due to invalid data.');
				setShowErrorPopup(true);
                setLoadingComments(false);
                return;
            }
			
            const newComments = data.data.children.filter(comment => comment.kind === 't1');

            if (loadMore) {
                setComments(prevComments => [...prevComments, ...newComments]);
            } else {
                setComments(newComments);
            }

            setAfterComment(data.data.after);

        } catch (e) {
            console.error("Error fetching comments:", e);
            setError(e.message || 'Failed to load comments');
			setShowErrorPopup(true);
        } finally {
            setLoadingComments(false);
        }
    };

    const openSidebar = () => {
        setShowSidebar(true);
    };

    const closeSidebar = () => {
        setShowSidebar(false);
    };

    const addSubreddit = () => {
        if (newSubreddit && !subreddits.find(sub => sub.name === newSubreddit)) {
            setSubreddits([...subreddits, { name: newSubreddit }]);
            setNewSubreddit('');
        }
    };

    const selectSubreddit = (subredditName) => {
        setSelectedSubreddit(subredditName);
        closeSidebar();
    };

    const handleSubredditChange = (e) => {
        setNewSubreddit(e.target.value);
    };
	
	const deleteSubreddit = (subredditToDelete) => {
        setSubreddits(subreddits.filter(subreddit => subreddit.name !== subredditToDelete));
    };

    const openPost = (post) => {
        setSelectedPost(post);
        setComments([]);
        setAfterComment(null);
        setUserAfterComment(null);
        loadComments(post.data.permalink);
    };

    const closePost = () => {
        setSelectedPost(null);
        setComments([]);
    };
	
	const renderDeleteSavedPostPopup = () => (
        
            
                Delete Saved Post
            
            
                Are you sure you want to delete this saved post?
            
            
                Cancel
                Delete
            
        
    );

    const renderSidebar = () => (
        
            
                
                    
                        
                            
                                Zennit
                            
                        
                        
                            <input
                                type="text"
                                value={newSubreddit}
                                onChange={handleSubredditChange}
                                placeholder="r/SubredditName"
                                className="bg-gray-700 text-white rounded-md p-2 w-full mb-2"
                            />
                            <button onClick={addSubreddit} className="bg-blue-500 hover:bg-blue-700 text-white rounded-md p-2 w-full">
                                Add
                            </button>
                        
                        
                            {subreddits.map((subreddit, index) => (
                                
                                    <span onClick={() => selectSubreddit(subreddit.name)} className="block hover:bg-gray-600 p-2 rounded-md cursor-pointer">
                                        {subreddit.name}
                                    </span>
									<button onClick={() => deleteSubreddit(subreddit.name)} className="text-red-600 hover:text-red-800">
										X
									</button>
                                
                            ))}
                        
                    
                
            
        
    );

    const renderPost = (post) => {
        const isSaved = isPostSaved(post);
        return (
            
                
                    
                        
                            
                                
                                    {post.data.title}
                                
                                
                                    
                                        
                                            {post.data.author}
                                        
                                        
                                            {new Date(post.data.created_utc * 1000).toLocaleDateString()}
                                        
                                    
                                
                            
                            
                                
                                    
                                        {post.data.ups}
                                    
                                    
                                        {post.data.num_comments}
                                    
                                    
                                        
                                            {isSaved ? 'Unsave' : 'Save'}
                                        
                                    
                                
                            
                        
                    
                
            
        );
    };

    const renderPostFeed = () => (
        
            {posts.map(post => (
                
                    {renderPost(post)}
                
            ))}
            
                {loadingPosts ? 'Loading...' : 'Load More'}
            
        
    );

    const renderComment = (comment) => {
        return (
            
                
                    
                        {comment.data.author}
                        
                    
                    
                        {comment.data.body}
                    
                
            
        );
    };

    const renderComments = () => (
        
            {comments.map(comment => (
                
                    {renderComment(comment)}
                
            ))}
            
                {loadingComments ? 'Loading...' : 'Load More Comments'}
            
        
    );
    
    const renderEnlargedPostImages = () => (
        
            
                
                
                    
                
            
        
    );

    const renderEnlargedCommentImages = () => (
        
            
                
                
                    
                
            
        
    );

    const handleImageClick = (url, isComment = false) => {
        if (isComment) {
            setEnlargedCommentImage(url);
        } else {
            setEnlargedImage(url);
        }
    };

    const closeEnlargedImage = () => {
        setEnlargedImage(null);
		setEnlargedCommentImage(null);
    };

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

    const SearchPage = ({ searchQuery, searchResults, onSelect, onClose }) => (
        
            
                
                    Search Results for "{searchQuery}"
                    
                
                
                    {searchResults.length > 0 ? (
                        searchResults.map(post => (
                            
                                {post.data.title}
                            
                        ))
                    ) : (
                        
                            No results found.
                        
                    )}
                
                
                    Close Search
                
            
        );
		
    return (
        
            
                
                    
                        
                            
                        
                        
                            
                                
                                    
                                        
                                            Zennit
                                        
                                    
                                    
                                        Search
                                        
                                    
                                
                            
                        
                    
                    
                        
                            {selectedPost ? (
                                
                                    
                                        
                                            
                                                {selectedPost.data.title}
                                            
                                        
                                        {renderComments()}
                                    
                                    
                                        Close Post
                                    
                                
                            ) : (
                                renderPostFeed()
                            )}
                        
                    
                
                {enlargedImage && (renderEnlargedPostImages())}
                {enlargedCommentImage && (renderEnlargedCommentImages())}
            
            {showErrorPopup && renderErrorPopup()}
            {showDeletePopup && (renderDeleteSavedPostPopup())}
            {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage('')} />}
            {searchPageVisible && (
                
                    {searchQuery}
                    searchResults={searchResults}
                    onSelect={handleSearchResultClick}
                    onClose={() => setSearchPageVisible(false)} 
                />
            )}
        
    )
}

const rootElement = document.getElementById('root');
const root = createRoot(rootElement);
root.render(<App />);