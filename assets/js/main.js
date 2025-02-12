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
    const [showNsfw, setShowNsfw] = useState(localStorage.getItem('showNsfw') === 'true');
    const [sidebarVisible, setSidebarVisible] = useState(false);
    const [showErrorPopup, setShowErrorPopup] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
	const [showSavedPosts, setShowSavedPosts] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loadingSearchResults, setLoadingSearchResults] = useState(false);
    const [searchPageVisible, setSearchPageVisible] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [enlargedImage, setEnlargedImage] = useState(null);
    const [enlargedCommentImage, setEnlargedCommentImage] = useState(null);
    const [showDeletePopup, setShowDeletePopup] = useState(false);
    const [postToDelete, setPostToDelete] = useState(null);
    const observer = useRef(null);

    const handleToast = (message) => {
        setToastMessage(message);
    };

    useEffect(() => {
        localStorage.setItem('showNsfw', showNsfw);
    }, [showNsfw]);

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
        const detectContentBlocker = () => {
            const testElement = document.createElement('div');
            testElement.style.display = 'none';
            document.body.appendChild(testElement);
            
            // Attempt to load an ad-like URL.  Many content blockers will block this.
            fetch('https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js', {
                mode: 'no-cors' //  We don't really care about the response, only if it fails.
            })
            .then(() => {
                // If the fetch succeeds, assume no content blocker.
                document.body.removeChild(testElement);
                setContentBlockerDetected(false);
            })
            .catch(() => {
                // If the fetch fails, assume a content blocker is present.
                document.body.removeChild(testElement);
                setContentBlockerDetected(true);
            });
        };

        detectContentBlocker();
    }, []);
    
    useEffect(() => {
        setPosts([]);
        setAfter(null); // Reset after when subreddit changes
        loadPosts();
    }, [selectedSubreddit, showNsfw]);

    useEffect(() => {
        if (!loadingPosts) return;

        const currentElement = observer.current;

        const handleIntersect = (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    loadPosts();
                }
            });
        };

        const newObserver = new IntersectionObserver(handleIntersect, {
            root: null,
            rootMargin: '20px',
            threshold: 0.1,
        });

        if (currentElement) {
            newObserver.observe(currentElement);
        }

        return () => {
            if (currentElement) {
                newObserver.unobserve(currentElement);
            }
        };
    }, [loadingPosts, selectedSubreddit, showNsfw]);

    useEffect(() => {
        if (!loadingComments) return;

        const currentElement = observer.current;

        const handleIntersect = (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    loadComments();
                }
            });
        };

        const newObserver = new IntersectionObserver(handleIntersect, {
            root: null,
            rootMargin: '20px',
            threshold: 0.1,
        });

        if (currentElement) {
            newObserver.observe(currentElement);
        }

        return () => {
            if (currentElement) {
                newObserver.unobserve(currentElement);
            }
        };
    }, [loadingComments, selectedSubreddit]);
    useEffect(() => {
        if (!searchQuery) {
            setSearchResults([]);
            return;
        }

        const debouncedSearch = setTimeout(() => {
            handleSearch();
        }, 300);

        return () => clearTimeout(debouncedSearch);
    }, [searchQuery]);

    const loadPosts = async () => {
        if (loadingPosts) return;
        setLoadingPosts(true);

        try {
            const subredditName = selectedSubreddit.replace('r/', '');
            let url = `https://api.reddit.com/r/${subredditName}/hot.json?limit=10`;
            if (after) {
                url += `&after=${after}`;
            }

            const response = await fetch(url);
            const data = await response.json();

            if (data.data && Array.isArray(data.data.children)) {
                const newPosts = data.data.children
                    .map(post => post.data)
                    .filter(post => showNsfw || !post.over_18)
                    .map(post => ({
                        ...post,
                        subreddit_name_prefixed: selectedSubreddit // Add subreddit info
                    }));
                setPosts(prevPosts => [...prevPosts, ...newPosts]);
                setAfter(data.data.after);
            } else {
                setErrorMessage('Failed to load more posts.');
                setShowErrorPopup(true);
            }
        } catch (error) {
            setErrorMessage('Failed to load posts.');
            setShowErrorPopup(true);
        } finally {
            setLoadingPosts(false);
        }
    };

    const loadComments = async (postId) => {
        if (loadingComments) return;
        setLoadingComments(true);
		const subredditName = selectedSubreddit.replace('r/', '');


        try {
            let url = `https://api.reddit.com/r/${subredditName}/comments/${postId}.json`;

            const response = await fetch(url);
            const data = await response.json();
			if (data && Array.isArray(data[1].data.children)) {
				setComments(data[1].data.children.map(comment => comment.data));

			} else {
                setErrorMessage('Failed to load more Comments.');
                setShowErrorPopup(true);
            }
        } catch (error) {
            setErrorMessage('Failed to load Comments.');
            setShowErrorPopup(true);
        } finally {
            setLoadingComments(false);
        }
    };
    const addSubreddit = (subredditName) => {
        if (!subredditName.startsWith('r/')) {
            setErrorMessage('Subreddit names must start with "r/".');
            setShowErrorPopup(true);
            return;
        }
        if (subreddits.find(sub => sub.name === subredditName)) {
            setErrorMessage('Subreddit already exists.');
            setShowErrorPopup(true);
            return;
        }
        setSubreddits(prevSubreddits => [...prevSubreddits, { name: subredditName }]);
    };

    const removeSubreddit = (subredditName) => {
        setSubreddits(prevSubreddits => prevSubreddits.filter(sub => sub.name !== subredditName));
    };

    const handleSubredditSelect = (subredditName) => {
        setSelectedSubreddit(subredditName);
        setSidebarVisible(false);
    };

    const handleNsfwToggle = () => {
        setShowNsfw(!showNsfw);
    };
    const isPostSaved = (post) => {
        return savedPosts.some(savedPost => savedPost.id === post.id);
    };

   const savePost = (post) => {
        if (isPostSaved(post)) {
            // If the post is already saved, remove it
            setSavedPosts(prevSavedPosts => prevSavedPosts.filter(savedPost => savedPost.id !== post.id));
            handleToast('Post unsaved!');
        } else {
            // If the post is not saved, add it
            setSavedPosts(prevSavedPosts => [...prevSavedPosts, post]);
            handleToast('Post saved!');
        }
    };
    const deleteSavedPost = (post) => {
        setPostToDelete(post);
        setShowDeletePopup(true);
    };

    const confirmDeleteSavedPost = () => {
        if (postToDelete) {
            setSavedPosts(prevSavedPosts => prevSavedPosts.filter(savedPost => savedPost.id !== postToDelete.id));
            setPostToDelete(null);
            setShowDeletePopup(false);
            handleToast('Post deleted!');
        }
    };

    const cancelDeleteSavedPost = () => {
        setPostToDelete(null);
        setShowDeletePopup(false);
    };

    const renderPost = (post) => {
        const isSaved = isPostSaved(post);
        const votePercentage = post.upvote_ratio * 100;
        const postFlairStyle = {
            backgroundColor: post.link_flair_background_color || '#555',
            color: post.link_flair_text_color || '#fff',
        };
        const handleImageClick = (imageUrl) => {
            setEnlargedImage(imageUrl);
        };

        const handleCommentImageClick = (imageUrl) => {
            setEnlargedCommentImage(imageUrl);
        };
        const hasImage = post.url_overridden_by_dest && (
            post.url_overridden_by_dest.endsWith('.jpg') ||
            post.url_overridden_by_dest.endsWith('.jpeg') ||
            post.url_overridden_by_dest.endsWith('.png') ||
            post.url_overridden_by_dest.endsWith('.gif')
        );

        const isVideo = post.is_video;
        return (
            <div key={post.id} className="post-container">
                <div className="vote-buttons">
                    <button className="vote-button" onClick={() => {
                    }}><i className="fas fa-arrow-up"></i></button>
                    <span className="vote-count">{post.score}</span>
                    <button className="vote-button" onClick={() => {
                    }}><i className="fas fa-arrow-down"></i></button>
                </div>
                <div className="title-container">
                    <a href={post.url} target="_blank" rel="noopener noreferrer" className="post-title">{post.title}</a>
                    {post.domain && (
                        <a href={`https://www.reddit.com/domain/${post.domain}`} className="domain-link" target="_blank">
                            ({post.domain})
                        </a>
                    )}
                </div>
                <p className="post-author">
                    Posted by <a href={`https://www.reddit.com/user/${post.author}`} target="_blank" rel="noopener noreferrer">{post.author}</a> in <a href={`https://www.reddit.com/${post.subreddit_name_prefixed}`} target="_blank" rel="noopener noreferrer">{post.subreddit_name_prefixed}</a>
                </p>
                {post.link_flair_text && (
                    <span className="post-flair" style={postFlairStyle}>{post.link_flair_text}</span>
                )}
                {post.over_18 && !showNsfw && (
                    <div className="nsfw-overlay" onClick={handleNsfwToggle}>
                        <p>NSFW - Click to show</p>
                        <button onClick={handleNsfwToggle}>Show NSFW Content</button>
                    </div>
                )}
                <div className="post-content body-text">
                    {post.selftext && <div className="body-text">{post.selftext}</div>}
                    {hasImage && (
                        <img
                            src={post.url_overridden_by_