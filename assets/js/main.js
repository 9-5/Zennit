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
    const [error, setError] = useState(null);
	const [showErrorPopup, setShowErrorPopup] = useState(false);
    const [sidebarVisible, setSidebarVisible] = useState(false);
    const [isSettingsVisible, setIsSettingsVisible] = useState(false);
    const [currentTheme, setCurrentTheme] = useState(localStorage.getItem('theme') || 'default');
    const [searchPageVisible, setSearchPageVisible] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [enlargedImage, setEnlargedImage] = useState(null);
    const [enlargedCommentImage, setEnlargedCommentImage] = useState(null);
    const [isDeletePopupVisible, setIsDeletePopupVisible] = useState(false);
    const [postToDelete, setPostToDelete] = useState(null);
    const [savedPosts, setSavedPosts] = useState(() => JSON.parse(localStorage.getItem('savedPosts') || '[]'));
    const [toastMessage, setToastMessage] = useState('');
    const postsContainerRef = useRef(null);
    const commentsContainerRef = useRef(null);
    const [sortType, setSortType] = useState('hot');

    const toggleTheme = () => {
        const newTheme = currentTheme === 'default' ? 'amethyst' : 'default';
        setCurrentTheme(newTheme);
        localStorage.setItem('theme', newTheme);
    };

    useEffect(() => {
        document.body.className = currentTheme;
    }, [currentTheme]);

    const getPosts = async (subreddit, after = null, sort = 'hot') => {
        setLoadingPosts(true);
        setError(null);
        try {
            let url = `https://www.reddit.com/${subreddit}/${sort}.json?limit=10`;
            if (after) {
                url += `&after=${after}`;
            }
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setAfter(data.data.after);
            setPosts(prevPosts => [...prevPosts, ...data.data.children.map(post => post.data)]);
        } catch (e) {
            setError(e.message);
			setShowErrorPopup(true);
        } finally {
            setLoadingPosts(false);
        }
    };
	
	const getRandomHash = () => {
		return '#' + Math.random().toString(36).substring(2, 15);
	}

    const getComments = async (permalink, afterComment = null) => {
        setLoadingComments(true);
        setError(null);
        try {
            let url = `https://www.reddit.com${permalink}.json?sort=confidence`;
            if (afterComment) {
                url += `&after=${afterComment}`;
            }
			
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            // Assuming the first element is the post data and the second is the comments
            const commentData = data[1].data.children.map(comment => {
				return {
					...comment.data,
					hash: getRandomHash()
				};
			});
			
            setAfterComment(data[1].data.after);
            setComments(prevComments => [...prevComments, ...commentData]);
        } catch (e) {
            setError(e.message);
			setShowErrorPopup(true);
        } finally {
            setLoadingComments(false);
        }
    };
	
    const getUserComments = async (username, userAfterComment = null) => {
        setLoadingComments(true);
        setError(null);
        try {
            let url = `https://www.reddit.com/user/${username}/comments.json?sort=new&limit=10`;
            if (userAfterComment) {
                url += `&after=${userAfterComment}`;
            }
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            const commentData = data.data.children.map(comment => {
				return {
					...comment.data,
					hash: getRandomHash()
				};
			});
            setUserAfterComment(data.data.after);
            setComments(prevComments => [...prevComments, ...commentData]);
        } catch (e) {
            setError(e.message);
			setShowErrorPopup(true);
        } finally {
            setLoadingComments(false);
        }
    };

    useEffect(() => {
        setPosts([]);
        setAfter(null);
        getPosts(selectedSubreddit, null, sortType);
    }, [selectedSubreddit, sortType]);

    const addSubreddit = (subredditName) => {
        const newSubreddit = { name: subredditName };
        setSubreddits(prevSubreddits => {
            const updatedSubreddits = [...prevSubreddits, newSubreddit];
            localStorage.setItem('subreddits', JSON.stringify(updatedSubreddits));
            return updatedSubreddits;
        });
    };

    const removeSubreddit = (subredditName) => {
        setSubreddits(prevSubreddits => {
            const updatedSubreddits = prevSubreddits.filter(subreddit => subreddit.name !== subredditName);
            localStorage.setItem('subreddits', JSON.stringify(updatedSubreddits));
            return updatedSubreddits;
        });
        if (selectedSubreddit === subredditName) {
            setSelectedSubreddit(subreddits[0].name);
            localStorage.setItem('selectedSubreddit', subreddits[0].name);
        }
    };

    const handleSubredditSelect = (subredditName) => {
        setSelectedSubreddit(subredditName);
        localStorage.setItem('selectedSubreddit', subredditName);
        setSidebarVisible(false);
        setPosts([]);
        setAfter(null);
    };
    const handlePostClick = (permalink) => {
        setComments([]);
        setAfterComment(null);
        getComments(permalink);
    };

    const handleUserCommentClick = (username) => {
        setComments([]);
        setUserAfterComment(null);
        getUserComments(username);
    };

    const handleLoadMorePosts = () => {
        getPosts(selectedSubreddit, after, sortType);
    };

    const handleLoadMoreComments = () => {
       if(comments.length > 0) {
			if(comments[0].kind == "t1") {
				getComments(posts.find(post => post.permalink.includes(comments[0].link_id.substring(3))).permalink, afterComment);
			} else if (comments[0].kind == "t10") {
				getUserComments(comments[0].data.author, userAfterComment);
			}
	   }
    };

    const handleSortChange = (type) => {
        setSortType(type);
        setPosts([]);
        setAfter(null);
    };

    const openSidebar = () => {
        setSidebarVisible(true);
    };

    const closeSidebar = () => {
        setSidebarVisible(false);
    };

    const toggleSettingsVisibility = () => {
        setIsSettingsVisible(!isSettingsVisible);
    };

    const handleSearch = async (searchTerm) => {
        setLoadingPosts(true);
        setError(null);
        try {
            const response = await fetch(`https://www.reddit.com/search.json?q=${searchTerm}&limit=10`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setSearchResults(data.data.children.map(result => result.data));
            setSearchPageVisible(true);
        } catch (e) {
            setError(e.message);
			setShowErrorPopup(true);
        } finally {
            setLoadingPosts(false);
        }
    };

    const closeSearchPage = () => {
        setSearchPageVisible(false);
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
        setSavedPosts(prevSavedPosts => {
            const isAlreadySaved = prevSavedPosts.some(savedPost => savedPost.id === post.id);
            if (isAlreadySaved) {
                // Optionally, show a message or do nothing
                setToastMessage('Post already saved!');
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
        setIsDeletePopupVisible(true);
    };

    const confirmDeleteSavedPost = () => {
        setSavedPosts(prevSavedPosts => {
            const updatedSavedPosts = prevSavedPosts.filter(post => post.id !== postToDelete);
            localStorage.setItem('savedPosts', JSON.stringify(updatedSavedPosts));
            setToastMessage('Post deleted!');
            return updatedSavedPosts;
        });
        setIsDeletePopupVisible(false);
        setPostToDelete(null);
    };

    const cancelDeleteSavedPost = () => {
        setIsDeletePopupVisible(false);
        setPostToDelete(null);
    };
	
	const closeErrorPopup = () => {
		setShowErrorPopup(false);
		setError(null);
	}
	
	const checkIfContentBlockerIsActive = async () => {
		const testImageUrl = 'https://www.redditstatic.com/desktop2x/img/favicon/favicon-96x96.png';
		try {
		  const response = await fetch(testImageUrl);
		  if (response.ok) {
			setContentBlockerDetected(false);
		  } else {
			setContentBlockerDetected(true);
		  }
		} catch (error) {
		  setContentBlockerDetected(true);
		}
	  };
	  
	useEffect(() => {
		checkIfContentBlockerIsActive();
	}, []);

    const renderPost = (post) => (
        <div key={post.id} className="post-container bg-gray-800 rounded-lg shadow-md p-4 mb-4">
            <h2 className="post-title text-xl font-semibold mb-2">{post.title}</h2>
            <div className="post-info text-gray-500 mb-2">
                Posted by <a href="#" onClick={() => handleUserCommentClick(post.author)} className="text-blue-500 hover:underline">{post.author}</a> on {post.subreddit_name_prefixed}
            </div>
            {post.thumbnail && (post.thumbnail.startsWith('http') || post.thumbnail.startsWith('https')) && (
                <img src={post.thumbnail} alt="Thumbnail" className="post-thumbnail rounded-md mb-3" onClick={() => handleImageClick(post.url_overridden_by_dest)} />
            )}
            {post.url_overridden_by_dest && !post.url_overridden_by_dest.match(/\.(jpeg|jpg|gif|png)$/) && (
                <a href={post.url_overridden_by_dest} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline mb-3 block">{post.url_overridden_by_dest}</a>
            )}
            <div className="post-actions flex justify-between">
                <button onClick={() => handlePostClick(post.permalink)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                    View Comments
                </button>
                <button onClick={() => savePost(post)} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
                    Save Post
                </button>
            </div>
        </div>
    );

    const renderComment = (comment) => (
		<div key={comment.id} className="comment bg-gray-700 rounded-lg p-3 mb-2">
			<div className="comment-header flex items-center mb-2">
				<span className="text-sm text-gray-400">
					<a href="#" onClick={() => handleUserCommentClick(comment.author)} className="text-blue-500 hover:underline">{comment.author}</a>
					<span className="hash ml-2">{comment.hash}</span>
				</span>
			</div>
			<div className="comment-body text-gray-300 body-text">
				{comment.body && comment.body.length > 0 ? comment.body.split('\n').map((line, index) => (
					<React.Fragment key={index}>
						{line}
						<br />
					</React.Fragment>
				)) : 'No comment content available.'}
				{comment.body && comment.body.length > 0 && comment.body.match(/\.(jpeg|jpg|gif|png)$/) && (
					<img src={comment.body} alt="Comment Image" className="post-thumbnail rounded-md mb-3" onClick={() => handleCommentImageClick(comment.body)} />
				)}
			</div>
		</div>
    );

    const renderSidebar = () => (
        <div className={`sidebar ${sidebarVisible ? 'open' : ''}`}>
            <a href="javascript:void(0)" className="closebtn" onClick={closeSidebar}>&times;</a>
            <h2 className="text-lg font-semibold text-gray-400 ml-8 mb-4">Subreddits</h2>
            <div className="subreddit-input">
                <SubredditInput addSubreddit={addSubreddit} />
            </div>
            <ul className="subreddit-list">
                {subreddits.map(subreddit => (
                    <li key={subreddit.name} onClick={() => handleSubredditSelect(subreddit.name)} onContextMenu={(e) => {
                        e.preventDefault();
                        removeSubreddit(subreddit.name);
                    }}>
                        {subreddit.name}
                    </li>
                ))}
            </ul>
        </div>
    );

    const renderSettings = () => (
        isSettingsVisible && (
            <div className="popup">
                <div className="popup-inner">
                    <h2>Settings</h2>
                    <button onClick={toggleTheme}>Toggle Theme</button>
                    <button onClick={toggleSettingsVisibility}>Close</button>
                </div>
            </div>
        )
    );

    const renderPostFeed = () => (
        <>
            <div className="sort-options flex justify-around mb-4">
                <button onClick={() => handleSortChange('hot')} className={`bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded ${sortType === 'hot' ? 'bg-opacity-50' : ''}`}>Hot</button>
                <button onClick={() => handleSortChange('new')} className={`bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded ${sortType === 'new' ? 'bg-opacity-50' : ''}`}>New</button>
                <button onClick={() => handleSortChange('top')} className={`bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded ${sortType === 'top' ? 'bg-opacity-50' : ''}`}>Top</button>
                <button onClick={() => handleSortChange('rising')} className={`bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded ${sortType === 'rising' ? 'bg-opacity-50' : ''}`}>Rising</button>
            </div>
            {posts.map(post => renderPost(post))}
            {loadingPosts && <p className="text-center text-gray-500">Loading posts...</p>}
            {after && !loadingPosts && (
                <div className="flex justify-center">
                    <button onClick={handleLoadMorePosts} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Load More</button>
                </div>
            )}
			{contentBlockerDetected && (
				<div className="text-center text-red-500">
					Content blocker detected! Please disable your content blocker to ensure proper functionality.
				</div>
			)}
        </>
    );

    const renderCommentSection = () => (
        <>
            <h2 className="text-lg font-semibold text-gray-400 ml-8 mb-4">Comments</h2>
            <div id="scrollableDiv" className="comments-container">
                {comments.map(comment => renderComment(comment))}
                {loadingComments && <p className="text-center text-gray-500">Loading comments...</p>}
                {afterComment && !loadingComments && (
                    <div className="flex justify-center">
                        <button onClick={handleLoadMoreComments} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Load More Comments</button>
                    </div>
                )}
            </div>
        </>
    );

    const renderSearchPage = () => (
        <div className="search-page">
            <input
                type="text"
                placeholder="Search Reddit"
                className="search-input"
            />
            <ul className="search-results">
                {searchResults.map(result => (
                    <li key={result.id}>{result.title}</li>
                ))}
            </ul>
        </div>
    );

    const renderEnlargedPostImages = () => (
        <div className="enlarged-image-overlay" onClick={closeEnlargedImage}>
            <div className="enlarged-image-container">
                <img src={enlargedImage} alt="Enlarged" className="enlarged-image" />
            </div>
        </div>
    );

    const renderEnlargedCommentImages = () => (
        <div className="enlarged-image-overlay" onClick={closeEnlargedImage}>
            <div className="enlarged-image-container">
                <img src={enlargedCommentImage} alt="Enlarged Comment Image" className="enlarged-image" />
            </div>
        </div>
    );

    const renderErrorPopup = () => (
        <div className="popup">
            <div className="popup-inner">
                <h2>Error</h2>
                <p>{error}</p>
                <button onClick={closeErrorPopup}>Close</button>
            </div>
        </div>
    );
	
    const renderDeleteSavedPostPopup = () => (
        <div className="popup">
            <div className="popup-inner">
                <h2>Delete Saved Post</h2>
                <p>Are you sure you want to delete this saved post?</p>
                <button onClick={confirmDeleteSavedPost}>Yes, Delete</button>
                <button onClick={cancelDeleteSavedPost}>Cancel</button>
            </div>
        </div>
    );

    return (
        <div className="container mx-auto px-4 h-screen flex flex-col">
            <header className="flex items-center justify-between py-4">
                <div className="text-2xl font-bold">
                    <a href="#" onClick={openSidebar} className="text-white hover:text-gray-300">
                        <img src="assets/zennit-logo.png" alt="Zennit Logo" className="h-8 w-auto" />
                    </a>
                </div>
                <div className