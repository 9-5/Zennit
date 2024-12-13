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
    const [showSidebar, setShowSidebar] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortType, setSortType] = useState('hot');
    const [selectedPost, setSelectedPost] = useState(null);
    const [enlargedImage, setEnlargedImage] = useState(null);
    const [enlargedCommentImage, setEnlargedCommentImage] = useState(null);
    const [showSearchPage, setSearchPageVisible] = useState(false);
    const [showErrorPopup, setShowErrorPopup] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [currentTheme, setCurrentTheme] = useState(localStorage.getItem('theme') || 'dark');
    const [showDeletePopup, setShowDeletePopup] = useState(false);
    const [postToDelete, setPostToDelete] = useState(null);
    const [toastMessage, setToastMessage] = useState('');
    const [savedPosts, setSavedPosts] = useState(() => JSON.parse(localStorage.getItem('savedPosts') || '[]'));
    const [showSavedPosts, setShowSavedPosts] = useState(false);
    const observer = useRef(null);
    const commentObserver = useRef(null);
    const userCommentObserver = useRef(null);

    useEffect(() => {
        localStorage.setItem('theme', currentTheme);
        document.body.className = currentTheme;
    }, [currentTheme]);

    const toggleTheme = () => {
        setCurrentTheme(prevTheme => {
            const newTheme = prevTheme === 'dark' ? 'lofi' : prevTheme === 'lofi' ? 'amethyst' : 'dark';
            localStorage.setItem('theme', newTheme);
            document.body.className = newTheme;
            return newTheme;
        });
    };

    const toggleSidebar = () => {
        setShowSidebar(!showSidebar);
    };

    const addSubreddit = (newSubreddit) => {
        const subredditExists = subreddits.some(sub => sub.name === newSubreddit);
        if (!subredditExists) {
            setSubreddits([...subreddits, { name: newSubreddit }]);
            localStorage.setItem('subreddits', JSON.stringify([...subreddits, { name: newSubreddit }]));
        }
    };

    const removeSubreddit = (subredditToRemove) => {
        const updatedSubreddits = subreddits.filter(sub => sub.name !== subredditToRemove);
        setSubreddits(updatedSubreddits);
        localStorage.setItem('subreddits', JSON.stringify(updatedSubreddits));
        if (selectedSubreddit === subredditToRemove) {
            setSelectedSubreddit(updatedSubreddits.length > 0 ? updatedSubreddits[0].name : 'r/0KB');
        }
    };

    const selectSubreddit = (subreddit) => {
        setSelectedSubreddit(subreddit);
        localStorage.setItem('selectedSubreddit', subreddit);
        setPosts([]);
        setAfter(null);
        setShowSidebar(false);
    };

    const handlePostClick = (post) => {
        setSelectedPost(post);
        setComments([]);
        setAfterComment(null);
        setUserComments([]);
        setUserAfterComment(null);
    };

    const closePost = () => {
        setSelectedPost(null);
    };

    const handleImageClick = (imageUrl) => {
        setEnlargedImage(imageUrl);
    };

    const handleCommentImageClick = (imageUrl) => {
        setEnlargedCommentImage(imageUrl);
    };

    const closeEnlargedImage = () => {
        setEnlargedImage(null);
    };

     const closeEnlargedCommentImage = () => {
        setEnlargedCommentImage(null);
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setSearchPageVisible(true);
    };

    const closeSearchPage = () => {
        setSearchPageVisible(false);
    };

    const handleSortChange = (type) => {
        setSortType(type);
        setPosts([]);
        setAfter(null);
    };
     const handleSavePost = (post) => {
        const isPostSaved = savedPosts.some(savedPost => savedPost.id === post.id);
        let updatedSavedPosts;

        if (isPostSaved) {
            updatedSavedPosts = savedPosts.filter(savedPost => savedPost.id !== post.id);
            setToastMessage('Post unsaved!');
        } else {
            updatedSavedPosts = [...savedPosts, post];
            setToastMessage('Post saved!');
        }

        setSavedPosts(updatedSavedPosts);
        localStorage.setItem('savedPosts', JSON.stringify(updatedSavedPosts));
        setTimeout(() => setToastMessage(''), 3000);
    };

    const handleDeleteSavedPost = (post) => {
        setPostToDelete(post);
        setShowDeletePopup(true);
    };

    const confirmDeleteSavedPost = () => {
        if (postToDelete) {
            const updatedSavedPosts = savedPosts.filter(savedPost => savedPost.id !== postToDelete.id);
            setSavedPosts(updatedSavedPosts);
            localStorage.setItem('savedPosts', JSON.stringify(updatedSavedPosts));
            setToastMessage('Post deleted!');
            setTimeout(() => setToastMessage(''), 3000);
            setShowDeletePopup(false);
            setPostToDelete(null);
        }
    };
    
    const cancelDeleteSavedPost = () => {
        setShowDeletePopup(false);
        setPostToDelete(null);
    };

    const isPostSaved = (postId) => {
        return savedPosts.some(savedPost => savedPost.id === postId);
    };

    const toggleSavedPostsView = () => {
        setShowSavedPosts(!showSavedPosts);
    };

    const renderPost = (post) => {
        const { id, title, author, subreddit_name_prefixed, ups, downs, url, post_hint, selftext, preview, permalink, is_video, media, domain, url_overridden_by_dest, flair, saved, likes, gilded } = post.data;
        const commentsUrl = `https://www.reddit.com${permalink}`;
        const isSaved = isPostSaved(id);
        let imageUrl = '';

        if (post_hint === 'image') {
            imageUrl = url;
        } else if (preview && preview.images && preview.images.length > 0) {
            imageUrl = preview.images[0].source.url.replace(/&amp;/g, '&');
        }
    
        return (
            
                
                    <div className="flex items-center mb-2">
                        <div className="font-bold mr-1 text-white">{author}</div>
                        <div className="text-gray-400">{subreddit_name_prefixed}</div>
                        {flair && (
                            
                                {flair}
                            
                        )}
                    </div>
                    
                        
                            {title}
                        
                    
                    {imageUrl && (
                        
                            
                                <img src={imageUrl} alt={title} className="w-full rounded-md cursor-pointer" onClick={() => handleImageClick(imageUrl)} />
                            
                        
                    )}
                    {selftext && (
                        
                            {selftext}
                        
                    )}
                     {is_video && media && media.reddit_video && (
                        
                            <source src={media.reddit_video.fallback_url} type="video/mp4" />
                            Your browser does not support the video tag.
                        
                    )}
                    
                        
                            <i className={`far fa-thumbs-up mr-1 ${likes === true ? 'text-blue-500' : ''}`}></i> {ups}
                            <i className={`far fa-thumbs-down mr-1 ${likes === false ? 'text-red-500' : ''}`}></i> {downs}
                        
                        
                            <i className={`far fa-bookmark mr-1 ${isSaved ? 'fas text-yellow-500' : ''}`} onClick={() => handleSavePost(post.data)}></i> {isSaved ? 'Unsave' : 'Save'}
                        
                        
                            <a href={commentsUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                                <i className="far fa-comment-dots mr-1"></i> Comments
                            </a>
                        
                        {gilded > 0 && (
                            
                                <i className="fas fa-award text-yellow-500 mr-1"></i> {gilded}
                            
                        )}
                    
                
            
        );
    };

    const renderComment = (comment) => {
        const { author, body, id, permalink, ups, downs, replies, gilded } = comment.data;
        return (
            
                
                    <div className="font-bold mr-1 text-white">{author}</div>
                
                
                    {body}
                
                 
                    <a href={`https://www.reddit.com${permalink}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                         <i className="far fa-comment-dots mr-1"></i> Permalink
                    </a>
                    <i className="far fa-thumbs-up mr-1"></i> {ups}
                    <i className="far fa-thumbs-down mr-1"></i> {downs}
                    {gilded > 0 && (
                         <i className="fas fa-award text-yellow-500 mr-1"></i> {gilded}
                    )}
                   
                {replies && replies.data && replies.data.children.filter(reply => reply.kind === 't1').map(renderComment)}
            
        );
    };
    const renderUserComment = (comment) => {
        const { author, body, id, permalink, ups, downs, replies } = comment.data;
        return (
            
                
                    <div className="font-bold mr-1 text-white">{author}</div>
                
                
                    {body}
                
                 
                    <a href={`https://www.reddit.com${permalink}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                         <i className="far fa-comment-dots mr-1"></i> Permalink
                    </a>
                    <i className="far fa-thumbs-up mr-1"></i> {ups}
                    <i className="far fa-thumbs-down mr-1"></i> {downs}
                   
                {replies && replies.data && replies.data.children.filter(reply => reply.kind === 't1').map(renderComment)}
            
        );
    };

    useEffect(() => {
        let currentObserver;
    
        const fetchData = async () => {
            if (loadingPosts) return;
            setLoadingPosts(true);
            try {
                let url = `https://www.reddit.com/${selectedSubreddit}/${sortType}.json?limit=10`;
                if (after) {
                    url += `&after=${after}`;
                }
                const response = await fetch(url);
                const data = await response.json();

                 if (data.error === 403) {
                    setContentBlockerDetected(true);
                    setLoadingPosts(false);
                    return;
                }
    
                if (data.data.children.length === 0 && after !== null) {
                    setAfter(null);
                    setLoadingPosts(false);
                    return;
                }
                setPosts(prevPosts => [...prevPosts, ...data.data.children]);
                setAfter(data.data.after);
                
            } catch (error) {
                setShowErrorPopup(true);
                setErrorMessage('Failed to fetch posts. Please check your internet connection and try again.');
                console.error("Error fetching posts:", error);
            } finally {
                setLoadingPosts(false);
            }
        };
    
        fetchData();
    
        return () => {
            if (currentObserver) {
                currentObserver.disconnect();
            }
        };
    }, [selectedSubreddit, sortType, after, loadingPosts]);

    useEffect(() => {
        const fetchComments = async () => {
             if (!selectedPost || loadingComments) return;
            setLoadingComments(true);
            try {
                let url = `https://www.reddit.com${selectedPost.data.permalink}.json?limit=10`;
                if (afterComment) {
                    url += `&after=${afterComment}`;
                }
                const response = await fetch(url);
                const data = await response.json();
                setComments(prevComments => [...prevComments, ...data[1].data.children]);
                setAfterComment(data[1].data.after);
            } catch (error) {
                setShowErrorPopup(true);
                setErrorMessage('Failed to fetch comments. Please check your internet connection and try again.');
                console.error("Error fetching comments:", error);
            } finally {
                setLoadingComments(false);
            }
        };
        
        if (selectedPost) {
            fetchComments();
        }
    }, [selectedPost, afterComment, loadingComments]);
    useEffect(() => {
        const fetchUserComments = async () => {
            if (!selectedPost) return;
            try {
                let url = `https://www.reddit.com/user/${selectedPost.data.author}/comments.json?limit=10`;
                if (userAfterComment) {
                    url += `&after=${userAfterComment}`;
                }
                const response = await fetch(url);
                const data = await response.json();
                setUserComments(prevComments => [...prevComments, ...data.data.children]);
                setUserAfterComment(data.data.after);
            } catch (error) {
                console.error("Error fetching user comments:", error);
            }
        };
        
        if (selectedPost) {
            fetchUserComments();
        }
    }, [selectedPost, userAfterComment]);

    useEffect(() => {
        const currentElement = observer?.current
        if (currentElement) {
             currentElement.disconnect()
        }

        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && !loadingPosts && !showSearchPage) {
                if(!showSavedPosts){
                   setAfter(after => after);
                }
               
            }
        })
        if (posts.length > 0 && !showSearchPage) {
            observer.current.observe(document.querySelector("#bottom-post"));
        }
        return () => currentElement?.disconnect()
    }, [posts, loadingPosts, showSearchPage,showSavedPosts]);

    useEffect(() => {
        const currentElement = commentObserver?.current
        if (currentElement) {
             currentElement.disconnect()
        }

        commentObserver.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && !loadingComments) {
                setAfterComment(afterComment => afterComment);
            }
        })
        if (comments.length > 0) {
            commentObserver.current.observe(document.querySelector("#bottom-comment"));
        }
        return () => currentElement?.disconnect()
    }, [comments, loadingComments]);

    useEffect(() => {
        const currentElement = userCommentObserver?.current
        if (currentElement) {
             currentElement.disconnect()
        }

        userCommentObserver.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting) {
                setUserAfterComment(userAfterComment => userAfterComment);
            }
        })
        if (userComments.length > 0) {
            userCommentObserver.current.observe(document.querySelector("#bottom-user-comment"));
        }
        return () => currentElement?.disconnect()
    }, [userComments]);
    
    const renderPosts = () => {
        if (contentBlockerDetected) {
            return (
                
                    <h2>Content Blocker Detected</h2>
                    <p>Please disable your content blocker to view posts.</p>
                
            );
        }
        if (posts.length === 0 && !loadingPosts) {
            return (
                
                    <h2>No posts to display</h2>
                
            );
        }

        return posts.map((post, index) => (
            
                {renderPost(post)}
                {index === posts.length - 1 ?  : null}
            
        ));
    };

    const renderComments = () => {
         if (comments.length === 0) {
            return (
                
                    <h2>No comments to display</h2>
                
            );
        }
        return comments.map((comment, index) => (
            
                {renderComment(comment)}
                {index === comments.length - 1 ?  : null}
            
        ));
    };
     const renderUserComments = () => {
         if (userComments.length === 0) {
            return (
                
                    <h2>No user comments to display</h2>
                
            );
        }
        return userComments.map((comment, index) => (
            
                {renderUserComment(comment)}
                {index === userComments.length - 1 ?  : null}
            
        ));
    };

    const renderSidebar = () => (
        
            
                
                    
                        <img src="assets/zennit-logo.png" alt="Zennit Logo" className="w-24 h-24 cursor-pointer" onClick={toggleSidebar} />
                        <button onClick={toggleTheme} className="absolute top-4 right-4 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded">
                            <i className="fas fa-adjust"></i>
                        </button>
                    
                    
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            addSubreddit(searchTerm);
                            setSearchTerm('');
                        }} className="mb-4">
                            <input
                                type="text"
                                placeholder="r/subreddit"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-gray-700 text-white placeholder-gray-400 rounded-md py-2 px-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            
                        
                    
                    
                        {subreddits.map((subreddit) => (
                            
                                <span onClick={() => selectSubreddit(subreddit.name)} className={`block py-2 px-4 rounded-md cursor-pointer hover:bg-gray-600 ${selectedSubreddit === subreddit.name ? 'bg-gray-800' : ''}`}>
                                    {subreddit.name}
                                
                            
                        ))}
                    
                
            
        
    );
    const renderEnlargedPostImages = () => (
        
            
                <img src={enlargedImage} alt="Enlarged" className="max-w-full max-h-screen" />
                <button onClick={closeEnlargedImage} className="absolute top-4 right-4 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded">
                    <i className="fas fa-times"></i>
                </button>
            
        
    );
    const renderEnlargedCommentImages = () => (
        
            
                <img src={enlargedCommentImage} alt="Enlarged Comment Image" className="max-w-full max-h-screen" />
                <button onClick={closeEnlargedCommentImage} className="absolute top-4 right-4 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded">
                    <i className="fas fa-times"></i>
                </button>
            
        
    );

    const renderSearchPage = () => (
        
            
                
                    <input
                        type="text"
                        placeholder="Search Reddit"
                        className="bg-gray-700 text-white placeholder-gray-400 rounded-md py-2 px-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    
                
                
                    
                        <button onClick={() => handleSortChange('hot')} className={`py-2 px-4 rounded-md ${sortType === 'hot' ? 'bg-gray-800' : 'hover: