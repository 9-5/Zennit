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
    const [sortType, setSortType] = useState(localStorage.getItem('sortType') || 'hot');
    const [sidebarVisible, setSidebarVisible] = useState(false);
    const [selectedPost, setSelectedPost] = useState(null);
    const [showSearchPage, setSearchPageVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loadingSearchResults, setLoadingSearchResults] = useState(false);
    const [enlargedImage, setEnlargedImage] = useState(null);
    const [enlargedCommentImage, setEnlargedCommentImage] = useState(null);
    const [toastMessage, setToastMessage] = useState('');
	const [showErrorPopup, setShowErrorPopup] = useState(false);
	const [errorMessage, setErrorMessage] = useState('');
	const [showDeletePopup, setShowDeletePopup] = useState(false);
    const [postToDelete, setPostToDelete] = useState(null);
	const [savedPosts, setSavedPosts] = useState(() => JSON.parse(localStorage.getItem('savedPosts') || '[]'));

    const sidebarRef = useRef(null);

    useEffect(() => {
        localStorage.setItem('subreddits', JSON.stringify(subreddits));
    }, [subreddits]);

    useEffect(() => {
        localStorage.setItem('selectedSubreddit', selectedSubreddit);
    }, [selectedSubreddit]);

    useEffect(() => {
        localStorage.setItem('sortType', sortType);
    }, [sortType]);
	
	useEffect(() => {
        localStorage.setItem('savedPosts', JSON.stringify(savedPosts));
    }, [savedPosts]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
                setSidebarVisible(false);
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
        if (selectedPost) {
            fetchComments();
			fetchUserComments();
        }
    }, [selectedPost]);
	
	const savePost = (post) => {
        setSavedPosts(prevSavedPosts => {
			const isPostAlreadySaved = prevSavedPosts.some(savedPost => savedPost.id === post.id);
			
			if (isPostAlreadySaved) {
				setToastMessage('Post is already saved!');
				return prevSavedPosts;
			}
			
            const updatedSavedPosts = [...prevSavedPosts, post];
            localStorage.setItem('savedPosts', JSON.stringify(updatedSavedPosts));
            setToastMessage('Post saved!');
            return updatedSavedPosts;
        });
    };
	
	const deleteSavedPost = (postId) => {
		setPostToDelete(postId);
		setShowDeletePopup(true);
	};
	
	const confirmDeleteSavedPost = () => {
        setSavedPosts(prevSavedPosts => {
            const updatedSavedPosts = prevSavedPosts.filter(savedPost => savedPost.id !== postToDelete);
            localStorage.setItem('savedPosts', JSON.stringify(updatedSavedPosts));
            setToastMessage('Post deleted!');
            return updatedSavedPosts;
        });
        setShowDeletePopup(false);
        setPostToDelete(null);
    };
	
	const cancelDeleteSavedPost = () => {
        setShowDeletePopup(false);
        setPostToDelete(null);
    };
	
	const isPostSaved = (postId) => {
        return savedPosts.some(savedPost => savedPost.id === postId);
    };
	
	const renderDeleteSavedPostPopup = () => (
        <div className="popup">
            <p>Are you sure you want to delete this saved post?</p>
            <button onClick={confirmDeleteSavedPost}>Yes, Delete</button>
            <button onClick={cancelDeleteSavedPost}>Cancel</button>
        </div>
    );

    const fetchPosts = async () => {
        setLoadingPosts(true);
        try {
            const response = await fetch(`https://www.reddit.com/${selectedSubreddit}/${sortType}.json?limit=10${after ? `&after=${after}` : ''}`);
            const data = await response.json();
            setPosts(data.data.children.map(post => post.data));
            setAfter(data.data.after);
            setContentBlockerDetected(false);
        } catch (error) {
			setErrorMessage('Content blocker detected! Please disable your content blocker to continue using Zennit.');
            setShowErrorPopup(true);
            setContentBlockerDetected(true);
        } finally {
            setLoadingPosts(false);
        }
    };

    const fetchComments = async () => {
        setLoadingComments(true);
        try {
            const response = await fetch(`https://www.reddit.com/${selectedSubreddit}/comments/${selectedPost.id}.json?sort=confidence&depth=4${afterComment ? `&after=${afterComment}` : ''}`);
            const data = await response.json();
			const commentData = data[1].data.children
				.filter(comment => comment.kind === 't1')
				.map(comment => comment.data);
            setComments(commentData);
            setAfterComment(data[1].data.after);
        } catch (error) {
            console.error("Error fetching comments:", error);
			setErrorMessage('Content blocker detected! Please disable your content blocker to continue using Zennit.');
            setShowErrorPopup(true);
        } finally {
            setLoadingComments(false);
        }
    };
	
	const fetchUserComments = async () => {
        setLoadingComments(true);
        try {
            const response = await fetch(`https://www.reddit.com/user/${selectedPost.author}/comments.json?sort=new&limit=10${userAfterComment ? `&after=${userAfterComment}` : ''}`);
            const data = await response.json();
            setUserComments(data.data.children.map(comment => comment.data));
            setUserAfterComment(data.data.after);
        } catch (error) {
            console.error("Error fetching user comments:", error);
			setErrorMessage('Content blocker detected! Please disable your content blocker to continue using Zennit.');
            setShowErrorPopup(true);
        } finally {
            setLoadingComments(false);
        }
    };

    const handleSubredditSubmit = (event) => {
        event.preventDefault();
        const newSubreddit = event.target.subreddit.value;
        if (newSubreddit && !subreddits.find(sub => sub.name === newSubreddit)) {
            setSubreddits([...subreddits, { name: newSubreddit }]);
        }
        event.target.subreddit.value = '';
    };

    const handleSubredditSelect = (subredditName) => {
        setSelectedSubreddit(subredditName);
        setSidebarVisible(false);
        setPosts([]);
        setAfter(null);
    };

    const handleSortTypeChange = (newSortType) => {
        setSortType(newSortType);
        setPosts([]);
        setAfter(null);
    };

    const handlePostClick = (post) => {
        setSelectedPost(post);
    };

    const handleBackToPostFeed = () => {
        setSelectedPost(null);
		setComments([]);
    };

    const handleSearchClick = () => {
        setSearchPageVisible(true);
    };

    const handleSearch = async (query) => {
        setSearchQuery(query);
        setLoadingSearchResults(true);
        try {
            const response = await fetch(`https://www.reddit.com/search.json?q=${query}&limit=10`);
            const data = await response.json();
            setSearchResults(data.data.children.map(result => result.data));
        } catch (error) {
            console.error("Error fetching search results:", error);
			setErrorMessage('Content blocker detected! Please disable your content blocker to continue using Zennit.');
            setShowErrorPopup(true);
        } finally {
            setLoadingSearchResults(false);
        }
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
	
	const handleErrorPopupClose = () => {
        setShowErrorPopup(false);
    };
	
	const renderErrorPopup = () => (
        <div className="popup">
            <p>{errorMessage}</p>
            <button onClick={handleErrorPopupClose}>OK</button>
        </div>
    );

    const renderSubredditSidebar = () => (
        <div className="subreddit-sidebar bg-gray-800 text-white p-4 w-64 flex-shrink-0" ref={sidebarRef}>
            <h2 className="text-xl font-bold mb-4">Subreddits</h2>
            <form onSubmit={handleSubredditSubmit} className="mb-4">
                <input
                    type="text"
                    name="subreddit"
                    id="subreddit-input"
                    placeholder="r/subreddit"
                    className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button type="submit" className="w-full mt-2 p-2 rounded bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    Add
                </button>
            </form>
            <ul className="subreddit-list">
                {subreddits.map((subreddit, index) => (
                    <li
                        key={index}
                        onClick={() => handleSubredditSelect(subreddit.name)}
                        className="p-2 rounded hover:bg-gray-700 cursor-pointer"
						onContextMenu={(e) => {
							e.preventDefault();
							const updatedSubreddits = subreddits.filter((_, i) => i !== index);
							setSubreddits(updatedSubreddits);
						}}
						onTouchStart={(e) => {
							let touchTimeout;
							const handleTouchEnd = () => {
								clearTimeout(touchTimeout);
								document.removeEventListener('touchend', handleTouchEnd);
							};
							
							const handleLongPress = () => {
								const updatedSubreddits = subreddits.filter((_, i) => i !== index);
								setSubreddits(updatedSubreddits);
								document.removeEventListener('touchend', handleTouchEnd);
							};
							
							document.addEventListener('touchend', handleTouchEnd);
							touchTimeout = setTimeout(handleLongPress, 1000);
						}}
                    >
                        {subreddit.name}
                    </li>
                ))}
            </ul>
        </div>
    );

    const renderPost = (post) => {
        const isImagePost = post.url && (post.url.endsWith('.jpg') || post.url.endsWith('.jpeg') || post.url.endsWith('.png') || post.url.endsWith('.gif'));
		const isVideoPost = post.is_video;
		const hasGallery = post.hasOwnProperty('media_metadata');
		let galleryImages = [];
		if (hasGallery) {
			galleryImages = Object.keys(post.media_metadata).map(key => {
				const item = post.media_metadata[key];
				return item.s.u.replace(/&amp;/g, '&');
			});
		}
		
        return (
            <div key={post.id} className="post bg-gray-800 rounded-lg shadow-md p-4 mb-4">
                <h2 className="post-title text-lg font-semibold mb-2 title-container">{post.title}</h2>
                <p className="post-author text-gray-400 mb-1">
                    Posted by <a href={`https://www.reddit.com/user/${post.author}`} target="_blank" rel="noopener noreferrer">{post.author}</a> in <a href={`https://www.reddit.com/r/${post.subreddit}`} target="_blank" rel="noopener noreferrer">{post.subreddit}</a>
                </p>
				{post.link_flair_text && (
					<span className="flair bg-gray-600 text-white rounded-full px-2 py-1 mr-2">{post.link_flair_text}</span>
				)}
				{post.link_flair_richtext && post.link_flair_richtext.map((flair, index) => (
					flair.t && (
						<span key={index} className="flair bg-gray-600 text-white rounded-full px-2 py-1 mr-2">{flair.t}</span>
					)
				))}
                <p className="post-details text-sm text-gray-500">
                    Score: {post.score} | Comments: {post.num_comments}
                </p>
				{isImagePost && (
                    <div className="mt-3">
                        <img src={post.url} alt={post.title} className="rounded-md cursor-pointer" style={{ maxWidth: '100%', maxHeight: '400px' }} onClick={() => handleImageClick(post.url)}/>
                    </div>
                )}
				{isVideoPost && (
					<div className="mt-3">
						<video width="100%" height="auto" controls>
							<source src={post.media.reddit_video.fallback_url} type="video/mp4" />
							Your browser does not support the video tag.
						</video>
					</div>
				)}
				{hasGallery && (
					<div className="mt-3">
						<div className="flex overflow-x-auto space-x-2">
							{galleryImages.map((image, index) => (
								<img
									key={index}
									src={image}
									alt={`Gallery Image ${index + 1}`}
									className="rounded-md cursor-pointer w-32 h-32 object-cover"
									onClick={() => handleImageClick(image)}
								/>
							))}
						</div>
					</div>
				)}
                {post.selftext && (
                    <div className="post-content mt-3 body-text">
                        {post.selftext}
                    </div>
                )}
				<div className="flex justify-between items-center mt-4">
					<a href={`https://www.reddit.com${post.permalink}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
						View on Reddit
					</a>
					{!isPostSaved(post.id) ? (
						<button onClick={() => savePost(post)} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
							Save Post
						</button>
					) : (
						<button onClick={() => deleteSavedPost(post.id)} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
							Delete Saved Post
						</button>
					)}
				</div>
            </div>
        );
    };
	
	const renderEnlargedPostImages = () => (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-80 z-50 flex justify-center items-center" onClick={closeEnlargedImage}>
            <img src={enlargedImage} alt="Enlarged" className="max-w-screen-lg max-h-screen-lg" />
        </div>
    );
	
	const renderEnlargedCommentImages = () => (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-80 z-50 flex justify-center items-center" onClick={closeEnlargedCommentImage}>
            <img src={enlargedCommentImage} alt="Enlarged Comment Image" className="max-w-screen-lg max-h-screen-lg" />
        </div>
    );

    const renderPostFeed = () => (
        <div className="flex flex-col items-center w-full">
            <div className="sort-options flex justify-center space-x-4 mb-4">
                <button
                    className={`p-2 rounded ${sortType === 'hot' ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300'}`}
                    onClick={() => handleSortTypeChange('hot')}
                >
                    Hot
                </button>
                <button
                    className={`p-2 rounded ${sortType === 'new' ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300'}`}
                    onClick={() => handleSortTypeChange('new')}
                >
                    New
                </button>
                <button
                    className={`p-2 rounded ${sortType === 'top' ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300'}`}
                    onClick={() => handleSortTypeChange('top')}
                >
                    Top
                </button>
                <button
                    className={`p-2 rounded ${sortType === 'rising' ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300'}`}
                    onClick={() => handleSortTypeChange('rising')}
                >
                    Rising
                </button>
            </div>
            {loadingPosts ? (
                <div className="text-center text-gray-400">Loading posts...</div>
            ) : (
                posts.map(post => (
                    <div key={post.id} onClick={() => handlePostClick(post)} className="cursor-pointer w-full max-w-2xl">
                        {renderPost(post)}
                    </div>
                ))
            )}
            {after && !loadingPosts && (
                <button onClick={fetchPosts} className="mt-4 p-3 rounded bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    Load More
                </button>
            )}
        </div>
    );

    const renderComment = (comment, level = 0) => {
		const isImageComment = comment.body && (comment.body.includes('.jpg') || comment.body.includes('.jpeg') || comment.body.includes('.png') || comment.body.includes('.gif'));
		let imageUrl = null;
		if (isImageComment) {
			const urlRegex = /(https?:\/\/[^\s]+?(?:\.jpg|\.jpeg|\.png|\.gif))/i;
			const match = comment.body.match(urlRegex);
			if (match) {
				imageUrl = match[0];
			}
		}
		
        return (
            <div key={comment.id} className={`comment bg-gray-700 rounded-md p-3 mb-2 ml-${level * 4} shadow-sm`}>
                <div className="comment-header flex items-center mb-2">
                    <span className="comment-author font-semibold text-gray-300">{comment.author}</span>
                    <span className="comment-score text-sm text-gray-500 ml-2">Score: {comment.score}</span>
                </div>
				{imageUrl ? (
					<div className="mt-3">
						<img src={imageUrl} alt="Comment Image" className="rounded-md cursor-pointer" style={{ maxWidth: '100%', maxHeight: '400px' }} onClick={() => handleCommentImageClick(imageUrl)}/>
					</div>
				) : (
					<div className="comment-body text-gray-400 body-text">{comment.body}</div>
				)}
                {comment.replies && comment.replies.data && comment.replies.data.children.map(reply => {
					if (reply.kind === 't1') {
						return renderComment(reply.data, level + 1);
					} else {
						return null;
					}
				})}
            </div>
        );
    };

    const