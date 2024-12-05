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
    const [showErrorPopup, setShowErrorPopup] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [enlargedImage, setEnlargedImage] = useState(null);
    const [enlargedCommentImage, setEnlargedCommentImage] = useState(null);
    const [showDeletePopup, setShowDeletePopup] = useState(false);
    const [postToDelete, setPostToDelete] = useState(null);
    const [toastMessage, setToastMessage] = useState('');
    const [savedPosts, setSavedPosts] = useState(() => JSON.parse(localStorage.getItem('savedPosts') || '[]'));
    const [isPostSaved, setIsPostSaved] = useState(false);
    const [nsfwEnabled, setNsfwEnabled] = useState(localStorage.getItem('nsfwEnabled') === 'true' || false);
    const [sortType, setSortType] = useState(localStorage.getItem('sortType') || 'hot');
    const [searchPageVisible, setSearchPageVisible] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const subredditInputRef = useRef(null);

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
        localStorage.setItem('nsfwEnabled', nsfwEnabled);
    }, [nsfwEnabled]);

     useEffect(() => {
        localStorage.setItem('sortType', sortType);
    }, [sortType]);

    useEffect(() => {
        if (selectedPost) {
            fetchComments(selectedPost.data.permalink);
        }
    }, [selectedPost]);

    useEffect(() => {
        if(selectedSubreddit) {
             fetchPosts(selectedSubreddit);
        }
    }, [selectedSubreddit, sortType, nsfwEnabled]);
    
    useEffect(() => {
        if (posts && selectedPost) {
            setIsPostSaved(posts.some(post => post.data.id === selectedPost.data.id && savedPosts.some(savedPost => savedPost.data.id === post.data.id)));
        } else if (selectedPost) {
            setIsPostSaved(savedPosts.some(savedPost => savedPost.data.id === selectedPost.data.id));
        } else {
            setIsPostSaved(false);
        }
    }, [selectedPost, savedPosts, posts]);

    const handleSearchInputChange = (event) => {
        setSearchTerm(event.target.value);
    };

    const handleSearchSubmit = (event) => {
        event.preventDefault();
        setSearchPageVisible(true);
    };

    const toggleNsfw = () => {
        setNsfwEnabled(!nsfwEnabled);
    };

    const handleToast = (message) => {
        setToastMessage(message);
    }

    const openDeletePostPopup = (post) => {
        setPostToDelete(post);
        setShowDeletePopup(true);
    };

    const closeDeletePostPopup = () => {
        setPostToDelete(null);
        setShowDeletePopup(false);
    };

    const confirmDeletePost = () => {
        if (postToDelete) {
            removeSavedPost(postToDelete);
            closeDeletePostPopup();
            handleToast('Post removed');
        }
    };

    const savePost = (post) => {
        if (!savedPosts.some(savedPost => savedPost.data.id === post.data.id)) {
            setSavedPosts([...savedPosts, post]);
            localStorage.setItem('savedPosts', JSON.stringify([...savedPosts, post]));
            setIsPostSaved(true);
            handleToast('Post saved');
        } else {
            removeSavedPost(post);
            setIsPostSaved(false);
            handleToast('Post removed');
        }
    };

    const removeSavedPost = (post) => {
            const updatedSavedPosts = savedPosts.filter(savedPost => savedPost.data.id !== post.data.id);
            setSavedPosts(updatedSavedPosts);
            localStorage.setItem('savedPosts', JSON.stringify(updatedSavedPosts));
            setIsPostSaved(false);
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

    const handleSortChange = (type) => {
        setSortType(type);
    };

    const toggleSidebar = () => {
        setSidebarVisible(!sidebarVisible);
    };

    const fetchPosts = async (subreddit) => {
        setLoadingPosts(true);
        let url = `https://www.reddit.com/${subreddit}/${sortType}.json?limit=25`;
        if (after) {
            url += `&after=${after}`;
        }

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            if (data && data.data && data.data.children) {
                const filteredPosts = data.data.children.filter(post => nsfwEnabled || !post.data.over_18);
                setPosts(filteredPosts);
                setAfter(data.data.after);
            } else {
                console.error("Unexpected data structure:", data);
                setErrorMessage('Failed to load posts: Unexpected data structure.');
                setShowErrorPopup(true);
            }
        } catch (error) {
            console.error("Could not fetch posts:", error);
            setErrorMessage(`Failed to load posts: ${error.message}`);
            setShowErrorPopup(true);
        } finally {
            setLoadingPosts(false);
        }
    };

     const fetchComments = async (permalink) => {
        setLoadingComments(true);
        let url = `https://www.reddit.com${permalink}.json`;
        if (afterComment) {
            url += `?after=${afterComment}`;
        }
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
             if (Array.isArray(data) && data.length > 1 && data[1].data && data[1].data.children) {
                setComments(data[1].data.children);
                if (data[1].data.children.length > 0) {
                    setAfterComment(data[1].data.children[data[1].data.children.length - 1].data.name);
                } else {
                    setAfterComment(null);
                }
            } else {
                console.error("Unexpected comment data structure:", data);
                setErrorMessage('Failed to load comments: Unexpected data structure.');
                setShowErrorPopup(true);
            }
        } catch (error) {
            console.error("Could not fetch comments:", error);
            setErrorMessage(`Failed to load comments: ${error.message}`);
            setShowErrorPopup(true);
        } finally {
            setLoadingComments(false);
        }
    };

    const addSubreddit = () => {
        const newSubreddit = subredditInputRef.current.value;
        if (newSubreddit && !subreddits.find(sub => sub.name === newSubreddit)) {
            setSubreddits([...subreddits, { name: newSubreddit }]);
            subredditInputRef.current.value = '';
        }
    };

    const removeSubreddit = (subredditToRemove) => {
        setSubreddits(subreddits.filter(subreddit => subreddit.name !== subredditToRemove));
    };

    const selectSubreddit = (subreddit) => {
        setSelectedSubreddit(subreddit);
        setSidebarVisible(false);
        setAfter(null);
    };

    const selectPost = (post) => {
        setSelectedPost(post);
    };

    const closePost = () => {
        setSelectedPost(null);
        setComments([]);
        setAfterComment(null);
        setUserAfterComment(null);
    };

    const handleCloseErrorPopup = () => {
        setShowErrorPopup(false);
    };

    const renderPost = (post) => {
        const postData = post.data;
        let imageUrl = null;
        if (postData.url_overridden_by_dest) {
            imageUrl = postData.url_overridden_by_dest;
        }
        if (postData.media && postData.media.reddit_video) {
            imageUrl = postData.media.reddit_video.fallback_url;
        } else if (postData.preview && postData.preview.images && postData.preview.images.length > 0) {
            imageUrl = postData.preview.images[0].source.url.replace(/&amp;/g, '&');
        }

        return (
            
                
                    
                        
                            {postData.title}
                        
                        
                            {postData.author}
                            {postData.subreddit_name_prefixed}
                            {new Date(postData.created_utc * 1000).toLocaleString()}
                        
                    
                    
                        {imageUrl && (
                            
                                {imageUrl.match(/\.(jpeg|jpg|gif|png)$/) != null ? (
                                    <img src={imageUrl} alt={postData.title} className="max-w-full h-auto rounded-md" onClick={() => handleImageClick(imageUrl)} />
                                ) : (
                                    <video controls className="max-w-full h-auto rounded-md" onClick={() => handleImageClick(imageUrl)}>
                                        <source src={imageUrl} type="video/mp4" />
                                        Your browser does not support the video tag.
                                    </video>
                                )}
                            
                        )}
                    
                    
                        
                            
                                <i className="fas fa-arrow-up"></i> {postData.ups}
                            
                            
                                <i className="fas fa-arrow-down"></i> {postData.downs}
                            
                            
                                <i className="fas fa-comment"></i> {postData.num_comments}
                            
                            
                                <i className={`fa fa-bookmark ${isPostSaved ? 'saved' : ''}`} onClick={() => savePost(post)}></i>
                            
                        
                    
                
            
        );
    };

    const renderComment = (comment) => {
        const commentData = comment.data;
        let imageUrl = null;
         if (commentData.body) {
            const urlRegex = /(https?:\/\/[^\s]+)/g;
            const urls = commentData.body.match(urlRegex);

            if (urls) {
                for (const url of urls) {
                    if (url.match(/\.(jpeg|jpg|gif|png)$/) != null) {
                         imageUrl = url;
                    }
                }
            }
        }

        return (
            
                
                    {commentData.author}
                    {new Date(commentData.created_utc * 1000).toLocaleString()}
                
                
                    {imageUrl && (
                        
                            <img src={imageUrl} alt="Comment Image" className="max-w-full h-auto rounded-md" onClick={() => handleCommentImageClick(imageUrl)} />
                        
                    )}
                    
                        {commentData.body}
                    
                
            
        );
    };

    const renderPostFeed = () => {
        if (loadingPosts) {
            return <div className="text-center">Loading posts...</div>;
        }

        if (!posts || posts.length === 0) {
            return <div className="text-center">No posts to display.</div>;
        }

        return (
            
                {posts.map(post => (
                    
                        {renderPost(post)}
                    
                ))}
                {after && (
                    
                        Load More
                    
                )}
            
        );
    };

    const renderComments = () => {
        if (loadingComments) {
            return <div className="text-center">Loading comments...</div>;
        }

        if (!comments || comments.length === 0) {
            return <div className="text-center">No comments to display.</div>;
        }

        return (
            
                {comments.map(comment => (
                    
                        {renderComment(comment)}
                    
                ))}
                {afterComment && (
                    
                        Load More Comments
                    
                )}
            
        );
    };

    const renderEnlargedPostImages = () => {
        return (
            
                
                    <img src={enlargedImage} alt="Enlarged" className="max-w-full max-h-screen object-contain" />
                    
                
            
        );
    };

    const renderEnlargedCommentImages = () => {
        return (
            
                
                    <img src={enlargedCommentImage} alt="Enlarged Comment Image" className="max-w-full max-h-screen object-contain" />
                    
                
            
        );
    };

    const renderSidebar = () => {
        return (
            
                
                    
                        
                            
                            
                        
                    
                    
                        
                            <input
                                type="text"
                                ref={subredditInputRef}
                                placeholder="r/subreddit"
                                className="bg-gray-700 text-white rounded-md p-2 w-full mb-2"
                            />
                            
                                Add
                            
                        
                    
                    
                        {subreddits.map(subreddit => (
                            
                                {subreddit.name}
                            
                        ))}
                    
                    
                        
                            
                                Enable NSFW
                            
                        
                        
                            Sort by:
                            
                                Hot
                            
                            
                                New
                            
                            
                                Top
                            
                            
                                Rising
                            
                        
                        
                            Saved Posts
                        
                    
                
            
        );
    };

    const renderErrorPopup = () => {
        return (
            
                
                    
                        Error
                        
                            {errorMessage}
                        
                        
                            Close
                        
                    
                
            
        );
    };

    const renderDeleteSavedPostPopup = () => {
        return (
            
                
                    
                        Confirm Delete
                        
                            Are you sure you want to delete this post?
                        
                        
                            Cancel
                            Delete
                        
                    
                
            
        );
    };

    const renderSavedPosts = () => {
        return (
            
                {savedPosts.map(post => (
                    
                        
                            {renderPost(post)}
                            
                        
                    
                ))}
            
        );
    };

    const renderSearchPage = () => {
        const [searchResults, setSearchResults] = useState([]);
        const [loadingSearchResults, setLoadingSearchResults] = useState(false);

        useEffect(() => {
            const fetchSearchResults = async () => {
                setLoadingSearchResults(true);
                try {
                    const response = await fetch(`https://www.reddit.com/search.json?q=${searchTerm}&limit=25`);
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    const data = await response.json();
                    if (data && data.data && data.data.children) {
                        setSearchResults(data.data.children);
                    } else {
                        console.error("Unexpected search data structure:", data);
                        setErrorMessage('Failed to load search results: Unexpected data structure.');
                        setShowErrorPopup(true);
                    }
                } catch (error) {
                    console.error("Could not fetch search results:", error);
                    setErrorMessage(`Failed to load search results: ${error.message}`);
                    setShowErrorPopup(true);
                } finally {
                    setLoadingSearchResults(false);
                }
            };

            fetchSearchResults();
        }, [searchTerm]);

        return (
            
                
                    
                        Search Results for "{searchTerm}"
                    
                    
                        {loadingSearchResults ? (
                            
                                Loading search results...
                            
                        ) : searchResults.length > 0 ? (
                            searchResults.map(post => (
                                
                                    {renderPost(post)}
                                
                            ))
                        ) : (
                            
                                No results found.
                            
                        )}
                    
                
            
        );
    };

    return (
        
            
                
                    
                        
                        
                            
                        
                        
                            
                                <i className="fas fa-bars"></i>
                            
                            
                                
                                    
                                        <i className="fas fa-search"></i>
                                    
                                
                            
                        
                    
                
                
                    {selectedPost ? (
                        
                            
                                
                                    
                                        
                                            
                                        
                                    
                                
                                
                                    {renderComments()}
                                
                            
                        
                    ) : searchPageVisible ? (
                        
                            
                    
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