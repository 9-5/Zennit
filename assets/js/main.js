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
    const [enlargedImage, setEnlargedImage] = useState(null);
    const [enlargedCommentImage, setEnlargedCommentImage] = useState(null);
    const [sortType, setSortType] = useState('hot');
    const [sidebarVisible, setSidebarVisible] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [showSearch, setShowSearch] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [errorPopupMessage, setErrorPopupMessage] = useState('');
    const [showErrorPopup, setShowErrorPopup] = useState(false);
    const [searchPageVisible, setSearchPageVisible] = useState(false);
    const [selectedPostToDelete, setSelectedPostToDelete] = useState(null);
    const [showDeletePopup, setShowDeletePopup] = useState(false);
    const [savedPosts, setSavedPosts] = useState(() => JSON.parse(localStorage.getItem('savedPosts') || '[]'));
    const postsContainerRef = useRef(null);
    const [visiblePosts, setVisiblePosts] = useState([]);
    const [visibleCommentSections, setVisibleCommentSections] = useState([]);

    useEffect(() => {
        localStorage.setItem('savedPosts', JSON.stringify(savedPosts));
    }, [savedPosts]);

    const savePost = (post) => {
        setSavedPosts(prevSavedPosts => {
            const isPostAlreadySaved = prevSavedPosts.some(savedPost => savedPost.id === post.id);
            if (isPostAlreadySaved) {
                setToastMessage('Post already saved!');
                return prevSavedPosts;
            }
            const updatedSavedPosts = [...prevSavedPosts, post];
            localStorage.setItem('savedPosts', JSON.stringify(updatedSavedPosts));
            setToastMessage('Post saved!');
            return updatedSavedPosts;
        });
    };

    const deleteSavedPost = (post) => {
        setSelectedPostToDelete(post);
        setShowDeletePopup(true);
    };

    const confirmDeleteSavedPost = () => {
        setSavedPosts(prevSavedPosts => {
            const updatedSavedPosts = prevSavedPosts.filter(savedPost => savedPost.id !== selectedPostToDelete.id);
            localStorage.setItem('savedPosts', JSON.stringify(updatedSavedPosts));
            setToastMessage('Post deleted!');
            return updatedSavedPosts;
        });
        setShowDeletePopup(false);
        setSelectedPostToDelete(null);
    };

    const cancelDeleteSavedPost = () => {
        setShowDeletePopup(false);
        setSelectedPostToDelete(null);
    };

    const renderDeleteSavedPostPopup = () => (
        <div className="popup">
            <div className="popup-inner">
                <h2>Delete Confirmation</h2>
                <p>Are you sure you want to delete this saved post?</p>
                <div className="flex justify-around">
                    <button onClick={confirmDeleteSavedPost} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
                        Delete
                    </button>
                    <button onClick={cancelDeleteSavedPost} className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
    const toggleCommentSection = (index) => {
        setVisibleCommentSections(prev => {
            const newVisibleCommentSections = [...prev];
            newVisibleCommentSections[index] = !newVisibleCommentSections[index];
            return newVisibleCommentSections;
        });
    };

    const handleImageClick = (imageUrl) => {
        setEnlargedImage(imageUrl);
    };

    const handleCommentImageClick = (imageUrl) => {
        setEnlargedCommentImage(imageUrl);
    };

    const renderEnlargedPostImages = () => (
        <div className="fixed top-0 left-0 w-full h-full bg-gray-900 bg-opacity-50 z-50 flex justify-center items-center" onClick={() => setEnlargedImage(null)}>
            <img src={enlargedImage} alt="Enlarged" className="max-w-4/5 max-h-4/5" />
        </div>
    );

    const renderEnlargedCommentImages = () => (
        <div className="fixed top-0 left-0 w-full h-full bg-gray-900 bg-opacity-50 z-50 flex justify-center items-center" onClick={() => setEnlargedCommentImage(null)}>
            <img src={enlargedCommentImage} alt="Enlarged Comment" className="max-w-4/5 max-h-4/5" />
        </div>
    );

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        setVisiblePosts(prevVisiblePosts => {
                            const postId = entry.target.dataset.postId;
                            if (!prevVisiblePosts.includes(postId)) {
                                return [...prevVisiblePosts, postId];
                            }
                            return prevVisiblePosts;
                        });
                    }
                });
            },
            {
                root: postsContainerRef.current,
                rootMargin: '0px',
                threshold: 0.1
            }
        );

        const postElements = document.querySelectorAll('.post');
        postElements.forEach(post => {
            observer.observe(post);
        });

        return () => {
            postElements.forEach(post => observer.unobserve(post));
        };
    }, [posts]);

    const isPostVisible = (postId) => {
        return visiblePosts.includes(postId);
    };

    useEffect(() => {
        const hammer = new Hammer(document.body);
        hammer.on('swipeleft', () => {
            setSidebarVisible(false);
        });
        hammer.on('swiperight', () => {
            setSidebarVisible(true);
        });

        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        window.addEventListener('resize', handleResize);
        handleResize();

        return () => {
            window.removeEventListener('resize', handleResize);
            hammer.destroy();
        };
    }, []);

    useEffect(() => {
        localStorage.setItem('subreddits', JSON.stringify(subreddits));
    }, [subreddits]);

    useEffect(() => {
        localStorage.setItem('selectedSubreddit', selectedSubreddit);
    }, [selectedSubreddit]);

    useEffect(() => {
        setLoadingPosts(true);
        fetchPosts();
        window.scrollTo(0, 0);
    }, [selectedSubreddit, sortType]);

    const fetchPosts = async () => {
        setLoadingPosts(true);
        try {
            let url = `https://www.reddit.com/${selectedSubreddit}/${sortType}.json?limit=10`;
            if (after) {
                url += `&after=${after}`;
            }
            const response = await fetch(url);
            const data = await response.json();
            if (data.data.children.length === 0 && after !== null) {
                setAfter(null)
                setPosts([])
                return;
            }
            setPosts(prevPosts => [...prevPosts, ...data.data.children.map(child => child.data)]);
            setAfter(data.data.after);
            setContentBlockerDetected(false);
        } catch (error) {
            console.error("Error fetching posts:", error);
            setContentBlockerDetected(true);
            setErrorPopupMessage("Content blocker detected. Please disable your content blocker to use this application.");
            setShowErrorPopup(true);
        } finally {
            setLoadingPosts(false);
        }
    };

    const fetchComments = async (permalink, index) => {
        setLoadingComments(true);
        try {
            let url = `https://www.reddit.com${permalink}.json?limit=5`;
            const response = await fetch(url);
            const data = await response[1].data.children.map(child => child.data);
            setComments(prevComments => {
                const newComments = [...prevComments];
                newComments[index] = data;
                return newComments;
            });
        } catch (error) {
            console.error("Error fetching comments:", error);
            setErrorPopupMessage(`Failed to load comments. ${error}`);
            setShowErrorPopup(true);
        } finally {
            setLoadingComments(false);
        }
    };

    const addSubreddit = (e) => {
        e.preventDefault();
        if (newSubreddit.trim() !== '') {
            setSubreddits(prevSubreddits => {
                const newSubredditObj = { name: newSubreddit };
                const updatedSubreddits = [...prevSubreddits, newSubredditObj];
                localStorage.setItem('subreddits', JSON.stringify(updatedSubreddits));
                return updatedSubreddits;
            });
            setNewSubreddit('');
        }
    };

    const [newSubreddit, setNewSubreddit] = useState('');

    const selectSubreddit = (subredditName) => {
        setSelectedSubreddit(subredditName);
        setSidebarVisible(false);
        setPosts([]);
        setAfter(null);
    };

    const removeSubreddit = (subredditName) => {
        setSubreddits(prevSubreddits => {
            const updatedSubreddits = prevSubreddits.filter(subreddit => subreddit.name !== subredditName);
            localStorage.setItem('subreddits', JSON.stringify(updatedSubreddits));
            return updatedSubreddits;
        });
    };

    const handleScroll = () => {
        if (postsContainerRef.current) {
            const { scrollTop, clientHeight, scrollHeight } = postsContainerRef.current;
            if (scrollTop + clientHeight >= scrollHeight - 20 && !loadingPosts && after) {
                fetchPosts();
            }
        }
    };

    const renderPost = (post, index) => {
        const commentSectionVisible = visibleCommentSections[index] || false;
        return (
            <div className="post" key={post.id} data-post-id={post.id}>
                <div className="title-container">
                    <a href={post.url} target="_blank" rel="noopener noreferrer" className="post-title">
                        {post.title}
                    </a>
                    {post.domain && <span className="domain">({post.domain})</span>}
                </div>
                {post.post_hint === 'image' && (
                    <img src={post.url} alt={post.title} className="post-image" onClick={() => handleImageClick(post.url)} />
                )}
                {post.thumbnail && post.thumbnail.startsWith('http') && post.post_hint !== 'image' && (
                    <img src={post.thumbnail} alt={post.title} className="post-image" onClick={() => handleImageClick(post.thumbnail)} />
                )}
                {post.selftext && (
                    <div className="body-text">
                        {post.selftext}
                    </div>
                )}
                <div className="post-details">
                    <p>
                        <a href={`https://www.reddit.com${post.permalink}`} target="_blank" rel="noopener noreferrer">
                            {post.num_comments} comments
                        </a>
                        <button onClick={() => toggleCommentSection(index)}>
                            {commentSectionVisible ? 'Hide Comments' : 'Show Comments'}
                        </button>
                        <button onClick={() => savePost(post)}>Save Post</button>
                    </p>
                </div>
                {commentSectionVisible && (
                    <div className="comment-container">
                        {comments[index] ? (
                            comments[index].map((comment, commentIndex) => (
                                <div className="comment" key={comment.id}>
                                    <p>{comment.body}</p>
                                    {comment.body &&
                                        (comment.body.match(/\.(jpeg|jpg|gif|png)$/) || comment.body.includes('imgur')) &&
                                        (<img src={comment.body.match(/\.(jpeg|jpg|gif|png)$/) || comment.body.includes('imgur') ? comment.body : null} alt="Comment Image" className="comment-image" onClick={() => handleCommentImageClick(comment.body.match(/\.(jpeg|jpg|gif|png)$/) || comment.body.includes('imgur') ? comment.body : null)} />)
                                    }
                                </div>
                            ))
                        ) : (
                            <button onClick={() => fetchComments(post.permalink, index)}>Load Comments</button>
                        )}
                        {loadingComments && <p>Loading comments...</p>}
                    </div>
                )}
            </div>
        );
    };

    const renderPostFeed = () => (
        <div className="post-container" ref={postsContainerRef} onScroll={handleScroll}>
            <div className="sort-options">
                <button onClick={() => setSortType('hot')} className={sortType === 'hot' ? 'active' : ''}>Hot</button>
                <button onClick={() => setSortType('new')} className={sortType === 'new' ? 'active' : ''}>New</button>
                <button onClick={() => setSortType('top')} className={sortType === 'top' ? 'active' : ''}>Top</button>
                <button onClick={() => setSortType('rising')} className={sortType === 'rising' ? 'active' : ''}>Rising</button>
            </div>
            {posts.map((post, index) => (
                isPostVisible(post.id) ? renderPost(post, index) : null
            ))}
            {loadingPosts && <div className="loading-indicator">Loading posts...</div>}
        </div>
    );

    const renderSidebar = () => (
        <div className={`sidebar ${sidebarVisible ? 'open' : ''}`}>
            <h2>Subreddits</h2>
            <ul>
                {subreddits.map(subreddit => (
                    <li
                        key={subreddit.name}
                        className={`subreddit-item ${selectedSubreddit === subreddit.name ? 'selected-subreddit' : ''}`}
                        onClick={() => selectSubreddit(subreddit.name)}
                        onContextMenu={(e) => {
                            e.preventDefault();
                            removeSubreddit(subreddit.name);
                        }}
                        onTouchStart={(e) => {
                            const touchStartTime = Date.now();
                            const touchDuration = 500;

                            e.target.addEventListener('touchend', () => {
                                if (Date.now() - touchStartTime > touchDuration) {
                                    removeSubreddit(subreddit.name);
                                }
                            });
                        }}
                    >
                        {subreddit.name}
                    </li>
                ))}
            </ul>
            <SubredditForm addSubreddit={addSubreddit} newSubreddit={newSubreddit} setNewSubreddit={setNewSubreddit} />
            <button onClick={() => {
                setSidebarVisible(false);
                setSearchPageVisible(true);
            }} className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mt-2 w-full">Search</button>
            <button onClick={() => {
                setSidebarVisible(false);
                setSelectedSubreddit('r/saved');
            }} className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mt-2 w-full">Saved Posts</button>
        </div>
    );
    const renderSavedPosts = () => (
        <div className="post-container">
            <h2>Saved Posts</h2>
            {savedPosts.length > 0 ? (
                savedPosts.map((post, index) => (
                    <div className="post" key={post.id}>
                        <div className="title-container">
                            <a href={post.url} target="_blank" rel="noopener noreferrer" className="post-title">
                                {post.title}
                            </a>
                            {post.domain && <span className="domain">({post.domain})</span>}
                        </div>
                        {post.post_hint === 'image' && (
                            <img src={post.url} alt={post.title} className="post-image" onClick={() => handleImageClick(post.url)} />
                        )}
                        {post.thumbnail && post.thumbnail.startsWith('http') && post.post_hint !== 'image' && (
                            <img src={post.thumbnail} alt={post.title} className="post-image" onClick={() => handleImageClick(post.thumbnail)} />
                        )}
                        {post.selftext && (
                            <div className="body-text">
                                {post.selftext}
                            </div>
                        )}
                        <div className="post-details">
                            <button onClick={() => deleteSavedPost(post)}>Delete Post</button>
                        </div>
                    </div>
                ))
            ) : (
                <p>No saved posts yet!</p>
            )}
        </div>
    );
    const renderErrorPopup = () => (
        <div className="popup">
            <div className="popup-inner">
                <h2>Error</h2>
                <p>{errorPopupMessage}</p>
                <button onClick={() => setShowErrorPopup(false)} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mt-2 w-full">
                    Close
                </button>
            </div>
        </div>
    );

    return (
        <div>
            <div className="header">
                <img
                    src="assets/zennit-logo.png"
                    alt="Zennit Logo"
                    style={{ cursor: 'pointer', height: '50px' }}
                    onClick={() => setSidebarVisible(!sidebarVisible)}
                />
            </div>
            <div className="container">
                {isMobile && sidebarVisible && (renderSidebar())}
                {!isMobile && (renderSidebar())}
                <div className="content">
                    {selectedSubreddit === 'r/saved' ? (
                        renderSavedPosts()
                    ) : (
                        searchPageVisible ? (
                            <SearchPage
                    onClose={() => setSearchPageVisible(false)} 
                            />
                        ) : (
                            renderPostFeed()
                        )
                    )}
                </div>
                {enlargedImage && (renderEnlargedPostImages())}
                {enlargedCommentImage && (renderEnlargedCommentImages())}
            </div>
            {showErrorPopup && renderErrorPopup()}
            {showDeletePopup && (renderDeleteSavedPostPopup())}
            {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage('')} />}
        </div>
    )
}

const Toast = ({ message, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 3000);

        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className="toast">
            {message}
            <span className="toast-close" onClick={onClose}>&times;</span>
        </div>
    );
};
const SubredditForm = ({ addSubreddit, newSubreddit, setNewSubreddit }) => {
    return (
        <form onSubmit={addSubreddit}>
            <input
                type="text"
                className="shadow appearance-none border rounded w-full py-2 px-3 text