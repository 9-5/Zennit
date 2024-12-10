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
    const [sortType, setSortType] = useState('hot');
    const [sidebarVisible, setSidebarVisible] = useState(false);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchPageVisible, setSearchPageVisible] = useState(false);
    const [enlargedImage, setEnlargedImage] = useState(null);
    const [enlargedCommentImage, setEnlargedCommentImage] = useState(null);
    const [savedPosts, setSavedPosts] = useState(() => JSON.parse(localStorage.getItem('savedPosts') || '[]'));
    const [showErrorPopup, setShowErrorPopup] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [selectedPostToDelete, setSelectedPostToDelete] = useState(null);
    const [showDeletePopup, setShowDeletePopup] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
    const [userSettingsVisible, setUserSettingsVisible] = useState(false);

    const observer = useRef();
    const commentObserver = useRef();

    const handleSidebarToggle = () => {
        setSidebarVisible(!sidebarVisible);
    };

    const addSubreddit = (newSubreddit) => {
        const subredditExists = subreddits.some(sub => sub.name.toLowerCase() === newSubreddit.toLowerCase());

        if (!subredditExists) {
            const updatedSubreddits = [...subreddits, { name: newSubreddit }];
            setSubreddits(updatedSubreddits);
            localStorage.setItem('subreddits', JSON.stringify(updatedSubreddits));
            setToastMessage('Subreddit added!');
        } else {
            setErrorMessage('Subreddit already exists.');
            setShowErrorPopup(true);
        }
    };

    const handleSubredditSubmit = (event) => {
        event.preventDefault();
        const newSubreddit = event.target.elements.subreddit.value;
        if (newSubreddit.trim() !== '') {
            addSubreddit(newSubreddit);
            event.target.reset();
        }
    };
    const deleteSubreddit = (subredditToDelete) => {
        const updatedSubreddits = subreddits.filter(sub => sub.name !== subredditToDelete);
        setSubreddits(updatedSubreddits);
        localStorage.setItem('subreddits', JSON.stringify(updatedSubreddits));
        if (selectedSubreddit === subredditToDelete) {
            setSelectedSubreddit(updatedSubreddits.length > 0 ? updatedSubreddits[0].name : null);
            localStorage.setItem('selectedSubreddit', updatedSubreddits.length > 0 ? updatedSubreddits[0].name : null);
            setPosts([]);
        }
        setToastMessage('Subreddit deleted!');
    };
    const removeSubreddit = (subredditName) => {
        deleteSubreddit(subredditName);
    };
    const selectSubreddit = (subreddit) => {
        setSelectedSubreddit(subreddit);
        localStorage.setItem('selectedSubreddit', subreddit);
        setPosts([]);
        setAfter(null);
        setSidebarVisible(false);
    };
    const fetchPosts = async () => {
        if (loadingPosts) return;
        setLoadingPosts(true);
        try {
            const response = await fetch(`https://www.reddit.com/${selectedSubreddit}/${sortType}.json?limit=25&after=${after}`);
            const data = await response.json();
            setPosts(prevPosts => [...prevPosts, ...data.data.children]);
            setAfter(data.data.after);
        } catch (error) {
            console.error("Error fetching posts:", error);
            setError(error.message || "Failed to load posts.");
        } finally {
            setLoadingPosts(false);
        }
    };
    const fetchComments = async (permalink) => {
        if (loadingComments) return;
        setLoadingComments(true);
        try {
            const response = await fetch(`https://www.reddit.com${permalink}.json?sort=new&limit=25&after=${afterComment}`);
            const data = await response.json();
            setComments(data[1].data.children)
            setAfterComment(data[1].data.after);
        } catch (error) {
            console.error("Error fetching comments:", error);
            setError(error.message || "Failed to load comments.");
        } finally {
            setLoadingComments(false);
        }
    };
    useEffect(() => {
        setPosts([]);
        setAfter(null);
        fetchPosts();
    }, [selectedSubreddit, sortType]);

    useEffect(() => {
        const options = {
            root: null,
            rootMargin: '20px',
            threshold: 0.1
        };

        observer.current = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && !loadingPosts && after) {
                fetchPosts();
            }
        }, options);

        const target = document.getElementById('load-more');
        if (target) {
            observer.current.observe(target);
        }

        return () => {
            if (observer.current) {
                observer.current.disconnect();
            }
        };
    }, [selectedSubreddit, sortType, after, loadingPosts]);
    const handleSortChange = (type) => {
        setSortType(type);
        setPosts([]);
        setAfter(null);
    };
    const handleSearch = (query) => {
        setSearchQuery(query);
        setSearchPageVisible(true);
    };
    const renderPost = (post) => {
        if (!post || !post.data) {
            return null;
        }
        const {
            title,
            url,
            author,
            score,
            num_comments,
            created_utc,
            permalink,
            id,
            post_hint,
            preview,
            selftext,
            is_video,
            secure_media
        } = post.data;
        const isSaved = savedPosts.some(savedPost => savedPost.id === id);
        const handleImageClick = (imageUrl) => {
            setEnlargedImage(imageUrl);
        };
        const handleCommentImageClick = (imageUrl) => {
            setEnlargedCommentImage(imageUrl);
        };
        let imageUrl = '';
        if (post_hint === 'image' && url) {
            imageUrl = url;
        } else if (preview && preview.images && preview.images[0].source) {
            imageUrl = preview.images[0].source.url.replace(/&amp;/g, '&');
        } else if (secure_media?.oembed?.thumbnail_url) {
            imageUrl = secure_media.oembed.thumbnail_url;
        }
        const videoUrl = secure_media?.reddit_video?.fallback_url;
        const timeAgo = new Date(created_utc * 1000).toLocaleDateString();
        const toggleSavePost = (post) => {
            const isPostSaved = savedPosts.some(savedPost => savedPost.id === post.data.id);
            if (isPostSaved) {
                const updatedSavedPosts = savedPosts.filter(savedPost => savedPost.id !== post.data.id);
                setSavedPosts(updatedSavedPosts);
                localStorage.setItem('savedPosts', JSON.stringify(updatedSavedPosts));
                setToastMessage('Post unsaved!');
            } else {
                const updatedSavedPosts = [...savedPosts, post];
                setSavedPosts(updatedSavedPosts);
                localStorage.setItem('savedPosts', JSON.stringify(updatedSavedPosts));
                setToastMessage('Post saved!');
            }
        };
        return (
            
                
                    
                    {imageUrl && (
                        
                    )}
                    
                        
                            {title}
                        
                        
                            /u/{author} - {score} points - {num_comments} comments - {timeAgo}
                        
                    
                
            
        );
    };
    const renderPostFeed = () => (
        
            
                {posts.map(post => (
                    renderPost(post)
                ))}
            
            
                {loadingPosts &&
                    
                        Loading more posts...
                    
                }
                
            
        
    );
    const renderEnlargedPostImages = () => (
        
            
                
            
        
    );
    const renderEnlargedCommentImages = () => (
        
            
                
            
        
    );
    const renderSavedPosts = () => (
        
            
                {savedPosts.map(post => (
                    
                        {renderPost(post)}
                        
                    
                ))}
            
        
    );
    const confirmDeleteSavedPost = (post) => {
        setSelectedPostToDelete(post);
        setShowDeletePopup(true);
    };
    const handleDeleteSavedPost = () => {
        if (selectedPostToDelete) {
            const updatedSavedPosts = savedPosts.filter(savedPost => savedPost.data.id !== selectedPostToDelete.data.id);
            setSavedPosts(updatedSavedPosts);
            localStorage.setItem('savedPosts', JSON.stringify(updatedSavedPosts));
            setShowDeletePopup(false);
            setSelectedPostToDelete(null);
            setToastMessage('Post deleted!');
        }
    };
    const handleCancelDelete = () => {
        setShowDeletePopup(false);
        setSelectedPostToDelete(null);
    };
    const renderDeleteSavedPostPopup = () => (
        
            
                Are you sure you want to delete this saved post?
                
                    
                        Confirm
                        Cancel
                    
                
            
        
    );
    const renderErrorPopup = () => (
        
            
                {errorMessage}
                
                    OK
                
            
        
    );
    const closeErrorPopup = () => {
        setShowErrorPopup(false);
        setErrorMessage('');
    };
    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        setToastMessage(`Theme changed to ${newTheme}!`);
    };

    useEffect(() => {
        document.body.className = theme;
    }, [theme]);

    const renderThemeOptions = () => (
        
            
                Theme
                
                    
                        Light
                        Dark
                        Amethyst
                        AMOLED
                    
                
            
        
    );
    const renderUserSettings = () => (
        
            
                
                    {renderThemeOptions()}
                
            
        
    );
    const toggleUserSettings = () => {
        setUserSettingsVisible(!userSettingsVisible);
    };
    return (
        
            
                
                    
                        
                            
                        
                        
                            
                                {subreddits.map(subreddit => (
                                    
                                        
                                            {subreddit.name}
                                        
                                        
                                            
                                        
                                    
                                ))}
                            
                            
                                
                                    
                                
                                
                                    Add
                                
                            
                        
                    
                
                
                    
                        
                            
                                
                                    
                                    
                                    
                                    
                                
                                
                                    
                                
                            
                            {userSettingsVisible && renderUserSettings()}
                        
                    
                    
                        
                            onClose={() => setSearchPageVisible(false)} 
                            />
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