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
    const [sortType, setSortType] = useState('hot');
    const [currentTheme, setCurrentTheme] = useState(localStorage.getItem('theme') || 'default');
    const [showErrorPopup, setShowErrorPopup] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
     const [showDeletePopup, setShowDeletePopup] = useState(false);
    const [postToDelete, setPostToDelete] = useState(null);
    const [toastMessage, setToastMessage] = useState('');
    const [savedPosts, setSavedPosts] = useState(() => JSON.parse(localStorage.getItem('savedPosts') || '[]'));
    const [searchPageVisible, setSearchPageVisible] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [enlargedImage, setEnlargedImage] = useState(null);
    const [enlargedCommentImage, setEnlargedCommentImage] = useState(null);
    const sidebarRef = useRef(null);

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            setCurrentTheme(savedTheme);
            document.body.className = savedTheme;
        }
    }, []);

    useEffect(() => {
        document.body.className = currentTheme;
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
        loadPosts();
    }, [selectedSubreddit, sortType]);

     useEffect(() => {
        const handleClickOutside = (event) => {
            if (sidebarRef.current && !sidebarRef.current.contains(event.target) && event.target.id !== 'sidebar-toggle') {
                setShowSidebar(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const loadPosts = async () => {
        setLoadingPosts(true);
        try {
            let url = `https://www.reddit.com/${selectedSubreddit}/${sortType}.json?limit=10`;
            if (after) {
                url += `&after=${after}`;
            }
            const response = await fetch(url);
            const data = await response.json();
            if (data && data.data && data.data.children) {
                const newPosts = data.data.children.map(post => post.data);
                setPosts(prevPosts => [...newPosts]);
                setAfter(data.data.after);
                setContentBlockerDetected(false);
            } else {
                 setContentBlockerDetected(true);
                 setErrorMessage('Content blocker detected. Please disable it to load posts.');
                 setShowErrorPopup(true);
            }
        } catch (error) {
             setContentBlockerDetected(true);
             setErrorMessage('Failed to load posts. Please check your internet connection and try again.');
             setShowErrorPopup(true);
        } finally {
            setLoadingPosts(false);
        }
    };
    const loadCommentsForPost = async (postId, user = null) => {
        setLoadingComments(true);
         try {
            let url = `https://www.reddit.com/comments/${postId}.json?limit=5`;
            if(user){
                if(userAfterComment){
                     url = `https://www.reddit.com/user/${user}/comments.json?limit=5`;
                     url += `&after=${userAfterComment}`;
                }else{
                    url = `https://www.reddit.com/user/${user}/comments.json?limit=5`;
                }
            } else {
                if (afterComment) {
                    url += `&after=${afterComment}`;
                }
            }

            const response = await fetch(url);
            const data = await response.json();

            if (data && data[1] && data[1].data && data[1].data.children) {
                const newComments = data[1].data.children.map(comment => comment.data);
                if(user){
                    setComments(prevComments => [...newComments]);
                    setUserAfterComment(data[1].data.after);
                } else {
                     setComments(prevComments => [...newComments]);
                     setAfterComment(data[1].data.after);
                }
            } else {
                  setErrorMessage('Failed to load comments.');
                  setShowErrorPopup(true);
            }
        } catch (error) {
            setErrorMessage('Error loading comments. Please try again.');
            setShowErrorPopup(true);
        } finally {
            setLoadingComments(false);
        }
    };
    const handlePostClick = (postId) => {
        setSelectedPostId(postId);
        setAfterComment(null)
        loadCommentsForPost(postId);
    };
    const loadMorePosts = () => {
        loadPosts();
    };
    const loadMoreComments = () => {
        loadCommentsForPost(selectedPostId);
    };
    const toggleSidebar = () => {
        setShowSidebar(!showSidebar);
    };
    const changeSortType = (type) => {
        setSortType(type);
        setAfter(null);
    };
    const addSubreddit = (event) => {
        if (event.key === 'Enter') {
            const newSubredditName = event.target.value.trim();
            if (newSubredditName && !subreddits.find(sub => sub.name === `r/${newSubredditName}`)) {
                const newSubreddit = { name: `r/${newSubredditName}` };
                setSubreddits([...subreddits, newSubreddit]);
                event.target.value = '';
            }
        }
    };

    const removeSubreddit = (subredditName) => {
        const updatedSubreddits = subreddits.filter(subreddit => subreddit.name !== subredditName);
        setSubreddits(updatedSubreddits);
        if (selectedSubreddit === subredditName) {
            setSelectedSubreddit(updatedSubreddits.length > 0 ? updatedSubreddits[0].name : 'r/0KB');
        }
    };
    const selectSubreddit = (subredditName) => {
        setSelectedSubreddit(subredditName);
        setShowSidebar(false);
        setPosts([]);
        setAfter(null);
    };
    const toggleTheme = () => {
        setCurrentTheme(currentTheme === 'default' ? 'amethyst' : 'default');
    };
    const closeErrorPopup = () => {
        setShowErrorPopup(false);
    };
    const savePost = (post) => {
        const isPostSaved = savedPosts.some(savedPost => savedPost.id === post.id);
        if (!isPostSaved) {
            setSavedPosts([...savedPosts, post]);
            setToastMessage('Post saved!');
            setTimeout(() => setToastMessage(''), 3000);
        } else {
            setToastMessage('Post already saved!');
             setTimeout(() => setToastMessage(''), 3000);
        }
    };
    const deleteSavedPost = (postId) => {
        setPostToDelete(postId);
        setShowDeletePopup(true);
    };

    const confirmDeletePost = () => {
        const updatedSavedPosts = savedPosts.filter(post => post.id !== postToDelete);
        setSavedPosts(updatedSavedPosts);
        setShowDeletePopup(false);
        setPostToDelete(null);
        setToastMessage('Post deleted!');
        setTimeout(() => setToastMessage(''), 3000);
    };

    const cancelDeletePost = () => {
        setShowDeletePopup(false);
        setPostToDelete(null);
    };
    const renderPost = (post) => {
        const isSaved = savedPosts.some(savedPost => savedPost.id === post.id);
        return (
            
                
                    
                        
                            {post.title}
                        
                        
                            
                                {post.author}
                            
                            
                                {new Date(post.created_utc * 1000).toLocaleString()}
                            
                        
                    
                    
                        {post.post_hint === 'image' && (
                            
                        )}
                        {post.url_overridden_by_dest && (
                            <a href={post.url_overridden_by_dest} target="_blank" rel="noopener noreferrer">
                                {post.domain}
                            </a>
                        )}
                        {post.selftext && (
                            
                                {post.selftext}
                            
                        )}
                         {post.media && post.media.reddit_video && (
                            <video controls width="100%">
                                <source src={post.media.reddit_video.fallback_url} type="video/mp4" />
                                Your browser does not support the video tag.
                            </video>
                        )}
                        {post.gallery_data && post.gallery_data.items && (
                            
                                {post.gallery_data.items.map((item) => {
                                    const media_id = item.media_id;
                                    const image = post.media_metadata[media_id];
                                    return (
                                        
                                            <img
                                                key={item.id}
                                                src={image.s.u}
                                                alt={item.caption}
                                                 onClick={() => openEnlargedImage(image.s.u)}
                                                style={{ maxWidth: '100%', height: 'auto', margin: '5px' }}
                                            />
                                        
                                    );
                                })}
                            
                        )}
                    
                    
                        
                            
                                {post.score} points
                            
                            
                                Comments
                            
                            
                                {isSaved ? (
                                    
                                        Delete
                                    
                                ) : (
                                    
                                        Save
                                    
                                )}
                            
                        
                    
                
            
        );
    };

    const renderComment = (comment) => (
        
            
                
                    {comment.author}
                
                
                    {new Date(comment.created_utc * 1000).toLocaleString()}
                
            
            
                {comment.body}
                 {comment.url && (
                            <a href={comment.url} target="_blank" rel="noopener noreferrer">
                                {comment.domain}
                            </a>
                        )}
                {comment.replies && comment.replies.data && comment.replies.data.children && (
                    
                        {comment.replies.data.children.map(reply => (
                            renderComment(reply.data)
                        ))}
                    
                )}
                {comment.body && comment.body.includes('i.redd.it') ?
                    
                : null}
            
        
    );
     const performSearch = async (query) => {
        try {
            const response = await fetch(`https://www.reddit.com/search.json?q=${query}&limit=10`);
            const data = await response.json();
            if (data && data.data && data.data.children) {
                setSearchResults(data.data.children.map(result => result.data));
            } else {
                setSearchResults([]);
            }
        } catch (error) {
            console.error('Search failed', error);
            setSearchResults([]);
        }
    };
     const openSearchPage = () => {
        setSearchPageVisible(true);
    };
    const closeSearchPage = () => {
        setSearchPageVisible(false);
    };
    const renderPostFeed = () => (
        
            {loadingPosts && !posts.length ? (
                
                    Loading posts...
                
            ) : (
                
                    {posts.map(post => (
                        renderPost(post)
                    ))}
                    
                        {loadingPosts ? 'Loading more posts...' : 'Load More Posts'}
                    
                
            )}
        
    );
    const renderCommentsSection = () => (
        
            
                
                    Comments:
                    {loadingComments && !comments.length ? (
                        
                            Loading comments...
                        
                    ) : (
                        
                            {comments.map(comment => (
                                renderComment(comment)
                            ))}
                        
                        
                            {loadingComments ? 'Loading more comments...' : 'Load More Comments'}
                        
                    )}
                
            
        
    );
    const renderThemeSwitcher = () => (
        
            
                Switch Theme
            
        
    );
    const renderErrorPopup = () => (
        
            
                
                    <h2>Error</h2>
                    
                        {errorMessage}
                    
                    
                        <button onClick={closeErrorPopup}>Close</button>
                    
                
            
    );
    const renderDeleteSavedPostPopup = () => (
        
            
                
                    <h2>Delete Post</h2>
                    
                        Are you sure you want to delete this post?
                    
                    
                        <button onClick={confirmDeletePost}>Yes, Delete</button>
                        <button onClick={cancelDeletePost}>Cancel</button>
                    
                
            
    );
     const renderEnlargedPostImages = () => (
        
            
                
            
        
    );
    const renderEnlargedCommentImages = () => (
        
            
                
            
        
    );
    const openEnlargedImage = (imageUrl) => {
        setEnlargedImage(imageUrl);
    };
    const closeEnlargedImage = () => {
        setEnlargedImage(null);
    };
    return (
        
            
                
                    
                        
                            Zennit
                        
                        
                            
                                <button id="sidebar-toggle" onClick={toggleSidebar}>
                                    ☰
                                </button>
                            
                            
                                 openSearchPage()}
                                />
                            
                            {renderThemeSwitcher()}
                        
                    
                
                
                    
                        <h2>Subreddits</h2>
                        
                            
                                <a
                                    key={subreddit.name}
                                    href="#"
                                    className={selectedSubreddit === subreddit.name ? 'active' : ''}
                                    onClick={() => selectSubreddit(subreddit.name)}
                                    onContextMenu={(e) => {
                                        e.preventDefault();
                                        removeSubreddit(subreddit.name)}
                                    }
                                >
                                    {subreddit.name}
                                
                            ))
                        }
                    
                    
                        
                            <input
                                type="text"
                                className="subreddit-input"
                                placeholder="Enter subreddit (e.g., funny)"
                                onKeyDown={addSubreddit}
                            />
                        
                    
                
            
            
                
                    {selectedPostId ? (
                        renderCommentsSection()
                    ) :  (
                        searchPageVisible ? (
                            
                                
                                    
                                        
                                            
                                                
                                                    <input
                                                        type="text"
                                                        className="search-input"
                                                        placeholder="Search Reddit"
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                performSearch(e.target.value);
                                                            }
                                                        }}
                                                    />
                                                
                                                
                                                    {searchResults.map(post => (
                                                        
                                                            
                                                                {post.title}
                                                            
                                                        
                                                    ))}
                                                
                                            
                                        
                                        
                                            Close
                                        
                                    
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
root.render(<App />);