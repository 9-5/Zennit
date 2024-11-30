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
    const [savedPosts, setSavedPosts] = useState(() => JSON.parse(localStorage.getItem('savedPosts') || '[]'));
    const [showSidebar, setShowSidebar] = useState(false);
    const [selectedPost, setSelectedPost] = useState(null);
    const [sortType, setSortType] = useState('hot');
    const [toastMessage, setToastMessage] = useState('');
    const [showErrorPopup, setShowErrorPopup] = useState(false);
	const [errorMessage, setErrorMessage] = useState('');
    const [enlargedImage, setEnlargedImage] = useState(null);
    const [enlargedCommentImage, setEnlargedCommentImage] = useState(null);
    const [showDeletePopup, setShowDeletePopup] = useState(false);
    const [postToDelete, setPostToDelete] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searchPageVisible, setSearchPageVisible] = useState(false);

    const sidebarRef = useRef(null);
    const observer = useRef(null);
    const commentsObserver = useRef(null);

    const API_URL = 'https://www.reddit.com/';

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
        const savedTheme = localStorage.getItem('theme') || 'default';
        document.body.className = savedTheme;
    }, []);

    useEffect(() => {
        setPosts([]);
        setAfter(null);
        loadPosts(selectedSubreddit, sortType);
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

    useEffect(() => {
        if (posts.length > 0) {
            observer.current = new IntersectionObserver(
                entries => {
                    if (entries[0].isIntersecting && !loadingPosts && after) {
                        loadPosts(selectedSubreddit, sortType, after);
                    }
                },
                { threshold: 0.1 }
            );

            const lastPost = document.querySelector('.post:last-child');
            if (lastPost) {
                observer.current.observe(lastPost);
            }

            return () => {
                if (observer.current) {
                    observer.current.disconnect();
                }
            };
        }
    }, [posts, loadingPosts, selectedSubreddit, sortType, after]);

	useEffect(() => {
        if (selectedPost) {
            setComments([]);
            setAfterComment(null);
            loadComments(selectedPost.data.permalink);
        }
    }, [selectedPost]);

    useEffect(() => {
        if (comments.length > 0) {
            commentsObserver.current = new IntersectionObserver(
                entries => {
                    if (entries[0].isIntersecting && !loadingComments && afterComment) {
                        loadComments(selectedPost.data.permalink, afterComment);
                    }
                },
                { threshold: 0.1 }
            );

            const lastComment = document.querySelector('.comment:last-child');
            if (lastComment) {
                commentsObserver.current.observe(lastComment);
            }

            return () => {
                if (commentsObserver.current) {
                    commentsObserver.current.disconnect();
                }
            };
        }
    }, [comments, loadingComments, selectedPost, afterComment]);

    const toggleSidebar = () => {
        setShowSidebar(!showSidebar);
    };

    const addSubreddit = (event) => {
        if (event.key === 'Enter') {
            const newSubreddit = event.target.value.trim();
            if (newSubreddit && !subreddits.find(sub => sub.name === `r/${newSubreddit}`)) {
                setSubreddits([...subreddits, { name: `r/${newSubreddit}` }]);
                event.target.value = '';
            }
        }
    };
    const removeSubreddit = (subredditName) => {
        setSubreddits(subreddits.filter(sub => sub.name !== subredditName));
    };

    const loadPosts = async (subreddit, sort = 'hot', after = null) => {
        setLoadingPosts(true);
        try {
            let url = `${API_URL}${subreddit}/${sort}.json?limit=10`;
            if (after) {
                url += `&after=${after}`;
            }
            const response = await fetch(url);
            const data = await response.json();

			if (data.error) {
				setErrorMessage(data.message || 'Failed to load posts.');
				setShowErrorPopup(true);
				setLoadingPosts(false);
				return;
			}

            const newPosts = data.data.children.filter(post => !posts.find(p => p.data.id === post.data.id));
            setPosts(prevPosts => [...prevPosts, ...newPosts]);
            setAfter(data.data.after);
        } catch (error) {
			setContentBlockerDetected(true);
            console.error("Content Blocker Detected:", error);
        } finally {
            setLoadingPosts(false);
        }
    };
	const loadComments = async (permalink, after = null) => {
        setLoadingComments(true);
        try {
            let url = `${API_URL}${permalink}.json?limit=10`;
            if (after) {
                url += `&after=${after}`;
            }
            const response = await fetch(url);
            const data = await response.json();
			if (Array.isArray(data) && data.length > 1 && data[1].data && data[1].data.children) {
				const newComments = data[1].data.children
					.filter(comment => comment.kind === 't1')
					.filter(comment => !comments.find(c => c.data.id === comment.data.id));
				setComments(prevComments => [...prevComments, ...newComments]);
                setAfterComment(data[1].data.after);
			}
        } catch (error) {
            console.error("Error loading comments:", error);
        } finally {
            setLoadingComments(false);
        }
    };
    const handlePostClick = (post) => {
        setSelectedPost(post);
		window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    const closePostPreview = () => {
        setSelectedPost(null);
		setComments([]);
    };
    const handleSortChange = (type) => {
        setSortType(type);
        setPosts([]);
        setAfter(null);
        loadPosts(selectedSubreddit, type);
    };
    const isPostSaved = (postId) => {
        return savedPosts.some(post => post.data.id === postId);
    };
    const savePost = (post) => {
        setSavedPosts([...savedPosts, post]);
        setToastMessage('Post saved!');
    };
    const unsavePost = (postId) => {
        setSavedPosts(savedPosts.filter(post => post.data.id !== postId));
        setToastMessage('Post unsaved!');
    };
    const toggleSavePost = (post) => {
        if (isPostSaved(post.data.id)) {
            unsavePost(post.data.id);
        } else {
            savePost(post);
        }
    };
	const renderToast = () => {
        if (toastMessage) {
            return (
                
                    {toastMessage}
                    ❌
                
            );
        }
        return null;
    };
    const closeErrorPopup = () => {
        setShowErrorPopup(false);
		setErrorMessage('');
    };
    const enlargeImage = (url) => {
        setEnlargedImage(url);
    };
    const enlargeCommentImage = (url) => {
        setEnlargedCommentImage(url);
    };
    const closeEnlargedImage = () => {
        setEnlargedImage(null);
        setEnlargedCommentImage(null);
    };
    const confirmDeleteSavedPost = (post) => {
        setShowDeletePopup(true);
        setPostToDelete(post);
    };
    const cancelDeleteSavedPost = () => {
        setShowDeletePopup(false);
        setPostToDelete(null);
    };
    const deleteSavedPost = () => {
        if (postToDelete) {
            unsavePost(postToDelete.data.id);
            setShowDeletePopup(false);
            setPostToDelete(null);
        }
    };
    const handleSearchInputChange = async (event) => {
        const query = event.target.value;
        setSearchQuery(query);

        if (query) {
            try {
                const response = await fetch(`https://www.reddit.com/search.json?q=${query}&limit=5`);
                const data = await response.json();
                setSearchResults(data.data.children);
            } catch (error) {
                console.error("Error fetching search results:", error);
            }
        } else {
            setSearchResults([]);
        }
    };
    const handleSearchResultClick = (post) => {
        setSelectedSubreddit(`r/${post.data.subreddit}`);
        setSearchPageVisible(false);
        setSearchQuery('');
        setSearchResults([]);
    };
    const renderPost = (post) => (
        
            
                
                    {post.data.title}
                
                
                    {post.data.author} | {new Date(post.data.created_utc * 1000).toLocaleString()}
                    {post.data.link_flair_text && (
                         {post.data.link_flair_text}
                    )}
                
            
            
                {post.data.thumbnail && (
                     enlargeImage(post.data.thumbnail)}
                        alt="Thumbnail"
                    />
                )}
                {post.data.url_overridden_by_dest && (
                    post.data.url_overridden_by_dest.match(/\.(jpeg|jpg|gif|png)$/) != null && (
                         enlargeImage(post.data.url_overridden_by_dest)}
                            alt="Thumbnail"
                        />
                    )
                )}
                
                    {post.data.selftext && (
                        
                            {post.data.selftext}
                        
                    )}
                    {post.data.media && post.data.media.reddit_video && (
                        
                            <source src={post.data.media.reddit_video.fallback_url} type="video/mp4" />
                            Your browser does not support the video tag.
                        
                    )}
					{post.data.url_overridden_by_dest && (
						post.data.url_overridden_by_dest.includes("youtu.be") && (
							
								<iframe width="560" height="315" src={`https://www.youtube.com/embed/${post.data.url_overridden_by_dest.split('/').pop()}`} 
										title="YouTube video player" frameborder="0" 
										allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
										allowFullScreen>
								</iframe>
							
						)
					)}
					{post.data.url_overridden_by_dest && (
						post.data.url_overridden_by_dest.includes("v.redd.it") && (
							<video controls width="100%">
								<source src={post.data.url_overridden_by_dest + "/HLSPlaylist.m3u8"} type="application/x-mpegURL" />
								Your browser does not support HLS video.
							</video>
						)
					)}
                
            
            
                
                    View Comments
                    {isPostSaved(post.data.id) ? 'Unsave' : 'Save'}
                
            
        
    );
    const renderPostFeed = () => (
        
            {posts.map(post => (
                renderPost(post)
            ))}
            {loadingPosts && Loading...}
        
    );
	const renderComment = (comment) => (
		
			
				
					{comment.data.author}
				
				
					{new Date(comment.data.created_utc * 1000).toLocaleString()}
				
			
			
				{comment.data.body && (
					
						{comment.data.body}
					
				)}
				{comment.data.url && (
					comment.data.url.match(/\.(jpeg|jpg|gif|png)$/) != null && (
						 enlargeCommentImage(comment.data.url)} alt="Comment Image" />
					)
				)}
			
		
	);
    const renderPostPreview = () => (
        
            
                
                    {selectedPost.data.title}
                
                
                    {selectedPost.data.author} | {new Date(selectedPost.data.created_utc * 1000).toLocaleString()}
                
            
            
                {selectedPost.data.thumbnail && (
                     enlargeImage(selectedPost.data.thumbnail)}
                        alt="Thumbnail"
                    />
                )}
                {selectedPost.data.url_overridden_by_dest && (
                    selectedPost.data.url_overridden_by_dest.match(/\.(jpeg|jpg|gif|png)$/) != null && (
                         enlargeImage(selectedPost.data.url_overridden_by_dest)}
                            alt="Thumbnail"
                        />
                    )
                )}
                
                    {selectedPost.data.selftext && (
                        
                            {selectedPost.data.selftext}
                        
                    )}
                    {selectedPost.data.media && selectedPost.data.media.reddit_video && (
                        
                            <source src={selectedPost.data.media.reddit_video.fallback_url} type="video/mp4" />
                            Your browser does not support the video tag.
                        
                    )}
					{selectedPost.data.url_overridden_by_dest && (
						selectedPost.data.url_overridden_by_dest.includes("youtu.be") && (
							
								<iframe width="560" height="315" src={`https://www.youtube.com/embed/${selectedPost.data.url_overridden_by_dest.split('/').pop()}`} 
										title="YouTube video player" frameborder="0" 
										allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
										allowFullScreen>
								</iframe>
							
						)
					)}
					{selectedPost.data.url_overridden_by_dest && (
						selectedPost.data.url_overridden_by_dest.includes("v.redd.it") && (
							<video controls width="100%">
								<source src={selectedPost.data.url_overridden_by_dest + "/HLSPlaylist.m3u8"} type="application/x-mpegURL" />
								Your browser does not support HLS video.
							</video>
						)
					)}
                
            
            
				
					{comments.map(comment => (
						renderComment(comment)
					))}
					{loadingComments && Loading...}
				
                
                    Close
                
            
        
    );
    const renderEnlargedPostImages = () => (
         closeEnlargedImage()} />
    );
    const renderEnlargedCommentImages = () => (
         closeEnlargedImage()} />
    );
    const renderErrorPopup = () => (
        
            
                Error!
                {errorMessage}
            
            
                OK
            
        
    );
    const renderDeleteSavedPostPopup = () => (
        
            
                Delete Saved Post?
            
            
                Are you sure you want to delete this saved post?
            
            
                Cancel
                Delete
            
        
    );
    const renderSidebar = () => (
        
            
                
                    
                        
                            
                                 removeSubreddit(subreddit.name)}>{subreddit.name}
                            
                        ))
                    }
                
                
                    
                        <input
                            type="text"
                            className="subreddit-input"
                            placeholder="Enter subreddit (e.g., funny)"
                            onKeyDown={addSubreddit}
                        />
                    
                
            
        
    );
    const renderSearchPage = () => (
        
            
                
                    <input
                        type="text