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
    const [showSettings, setShowSettings] = useState(false);
    const [showAddSubreddit, setShowAddSubreddit] = useState(false);
    const [selectedPost, setSelectedPost] = useState(null);
    const [sortType, setSortType] = useState(localStorage.getItem('sortType') || 'hot');
    const [showErrorPopup, setShowErrorPopup] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
	const [showDeletePopup, setShowDeletePopup] = useState(false);
    const [postToDelete, setPostToDelete] = useState(null);
    const [toastMessage, setToastMessage] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [searchPageVisible, setSearchPageVisible] = useState(false);
    const [enlargedImage, setEnlargedImage] = useState(null);
    const [enlargedCommentImage, setEnlargedCommentImage] = useState(null);

    const subredditInputRef = useRef(null);
    const bottomBoundaryRef = useRef(null);
    const commentBottomBoundaryRef = useRef(null);

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
        localStorage.setItem('sortType', sortType);
    }, [sortType]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !loadingPosts) {
                    loadPosts();
                }
            },
            { threshold: 1 }
        );

        if (bottomBoundaryRef.current) {
            observer.observe(bottomBoundaryRef.current);
        }

        return () => {
            if (bottomBoundaryRef.current) {
                observer.unobserve(bottomBoundaryRef.current);
            }
        };
    }, [selectedSubreddit, loadingPosts, after, sortType]);

    useEffect(() => {
        const commentObserver = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !loadingComments) {
                    loadComments();
                }
            },
            { threshold: 1 }
        );

        if (commentBottomBoundaryRef.current) {
            commentObserver.observe(commentBottomBoundaryRef.current);
        }

        return () => {
            if (commentBottomBoundaryRef.current) {
                commentObserver.unobserve(commentBottomBoundaryRef.current);
            }
        };
    }, [selectedPost, loadingComments, afterComment]);

	useEffect(() => {
		const checkContentBlocker = async () => {
			try {
				const testAd = await fetch('https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js', {
					mode: 'no-cors'
				});
				if (testAd.status === 200) {
					setContentBlockerDetected(false);
				} else {
					setContentBlockerDetected(true);
				}
			} catch (error) {
				setContentBlockerDetected(true);
			}
		};

		checkContentBlocker();
	}, []);

    const loadPosts = async () => {
        if (loadingPosts) return;
        setLoadingPosts(true);
        try {
            const response = await fetch(`https://www.reddit.com/${selectedSubreddit}/${sortType}.json?limit=10&after=${after}`);
            const data = await response.json();
            const newPosts = data.data.children.map(post => post.data);

            setPosts(prevPosts => [...prevPosts, ...newPosts]);
            setAfter(data.data.after);
        } catch (error) {
            console.error("Error loading posts:", error);
			setErrorMessage('Failed to load posts. Please check your connection and subreddit name.');
            setShowErrorPopup(true);
        } finally {
            setLoadingPosts(false);
        }
    };

    const loadComments = async () => {
        if (!selectedPost || loadingComments) return;

        setLoadingComments(true);
        try {
            const response = await fetch(`https://www.reddit.com/${selectedPost.permalink}.json?limit=10&after=${afterComment}`);
            const data = await response.json();
            const newComments = data[1].data.children.map(comment => comment.data);

            setComments(prevComments => [...prevComments, ...newComments]);
            setAfterComment(data[1].data.after);
        } catch (error) {
            console.error("Error loading comments:", error);
			setErrorMessage('Failed to load comments. Please check your connection.');
            setShowErrorPopup(true);
        } finally {
            setLoadingComments(false);
        }
    };
	
	const handleImageClick = (imageUrl) => {
        setEnlargedImage(imageUrl);
    };
	
	const handleCommentImageClick = (imageUrl) => {
        setEnlargedCommentImage(imageUrl);
    };

    const addSubreddit = () => {
        const newSubredditName = subredditInputRef.current.value;
        if (newSubredditName && !subreddits.find(sub => sub.name === newSubredditName)) {
            setSubreddits(prevSubs => [...prevSubs, { name: newSubredditName }]);
            subredditInputRef.current.value = '';
        }
		setShowAddSubreddit(false);
    };

    const selectSubreddit = (subredditName) => {
        setPosts([]);
        setAfter(null);
        setSelectedSubreddit(subredditName);
		setSearchPageVisible(false);
    };

    const removeSubreddit = (subredditName) => {
        setSubreddits(prevSubs => prevSubs.filter(sub => sub.name !== subredditName));
		if (selectedSubreddit === subredditName) {
			setPosts([]);
			setAfter(null);
			setSelectedSubreddit('r/0KB');
		}
    };

    const selectPost = (post) => {
        setComments([]);
        setAfterComment(null);
        setSelectedPost(post);
    };

    const closePost = () => {
        setSelectedPost(null);
    };
	
	const savePost = (post) => {
        setSavedPosts(prevSavedPosts => {
            const isPostAlreadySaved = prevSavedPosts.some(savedPost => savedPost.id === post.id);
            if (isPostAlreadySaved) {
                return prevSavedPosts;
            } else {
                const updatedSavedPosts = [...prevSavedPosts, post];
                localStorage.setItem('savedPosts', JSON.stringify(updatedSavedPosts));
                return updatedSavedPosts;
            }
        });
		setToastMessage('Post saved!');
    };
	
	const deleteSavedPost = (post) => {
		setPostToDelete(post);
        setShowDeletePopup(true);
    };

    const confirmDeletePost = () => {
        if (postToDelete) {
            const updatedSavedPosts = savedPosts.filter(savedPost => savedPost.id !== postToDelete.id);
            setSavedPosts(updatedSavedPosts);
            localStorage.setItem('savedPosts', JSON.stringify(updatedSavedPosts));
            setToastMessage('Post deleted!');
        }
        setShowDeletePopup(false);
        setPostToDelete(null);
    };

    const cancelDeletePost = () => {
        setShowDeletePopup(false);
        setPostToDelete(null);
    };
	
	const isPostSaved = (postId) => {
        return savedPosts.some(savedPost => savedPost.id === postId);
    };

    const clearSubreddits = () => {
        setSubreddits([]);
    };

    const handleSortChange = (event) => {
        const newSortType = event.target.value;
        setPosts([]);
        setAfter(null);
        setSortType(newSortType);
    };
	
	const closeErrorPopup = () => {
        setShowErrorPopup(false);
    };
	
	const openSavedPosts = () => {
		setSearchPageVisible(false);
		setPosts(savedPosts);
        setAfter(null);
		setSelectedSubreddit('Saved Posts');
    };
	
	const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
    };

    const handleSearchSubmit = (event) => {
        event.preventDefault();
        if (searchTerm) {
            setSearchPageVisible(true);
        }
    };

	const closeSearch = () => {
		setSearchPageVisible(false);
	}

    const renderSidebar = () => (
        <div className={`sidebar ${showSidebar ? 'open' : ''} bg-gray-900 text-white w-64 p-4 space-y-2 fixed top-0 left-0 h-full z-50 transform transition-transform duration-300 ease-in-out ${showSidebar ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="flex items-center justify-between mb-4">
                <div className="font-bold text-xl">Subreddits</div>
                <button onClick={() => setShowSidebar(false)} className="focus:outline-none">
                    <i className="fas fa-times text-2xl"></i>
                </button>
            </div>
            <div className="flex flex-col space-y-2">
                <button onClick={() => setShowAddSubreddit(true)} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none">
                    Add Subreddit
                </button>
				 <button onClick={() => openSavedPosts()} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none">
                    Saved Posts
                </button>
				{subreddits.length > 0 && (
					<button onClick={() => clearSubreddits()} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none">
						Clear Subreddits
					</button>
				)}
            </div>
            {showAddSubreddit && (
                <div className="add-subreddit-popup fixed top-0 left-0 w-full h-full bg-gray-900 bg-opacity-50 z-50 flex justify-center items-center">
                    <div className="bg-gray-800 p-4 rounded">
                        <input type="text" ref={subredditInputRef} placeholder="r/subreddit" className="text-black"/>
                        <button onClick={addSubreddit} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none">Add</button>
                    </div>
                </div>
            )}
            <div className="subreddit-list space-y-1">
                {subreddits.map(subreddit => (
                    <div key={subreddit.name} className="subreddit-item flex items-center justify-between p-2 hover:bg-gray-700 rounded cursor-pointer" onClick={() => selectSubreddit(subreddit.name)}
					onContextMenu={(e) => {
						e.preventDefault();
						removeSubreddit(subreddit.name);
					}}>
                        {subreddit.name}
                        <button onClick={(e) => {
                            e.stopPropagation();
                            removeSubreddit(subreddit.name);
                        }} className="focus:outline-none">
                            <i className="fas fa-trash"></i>
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderSettings = () => (
        <div className={`settings ${showSettings ? 'open' : ''} bg-gray-900 text-white w-64 p-4 space-y-2 fixed top-0 right-0 h-full z-50 transform transition-transform duration-300 ease-in-out ${showSettings ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="flex items-center justify-between mb-4">
                <div className="font-bold text-xl">Settings</div>
                <button onClick={() => setShowSettings(false)} className="focus:outline-none">
                    <i className="fas fa-times text-2xl"></i>
                </button>
            </div>
            <div className="flex flex-col space-y-2">
                <label htmlFor="sortType">Sort by:</label>
                <select id="sortType" className="text-black" value={sortType} onChange={handleSortChange}>
                    <option value="hot">Hot</option>
                    <option value="new">New</option>
                    <option value="top">Top</option>
                    <option value="rising">Rising</option>
                </select>
            </div>
        </div>
    );
	
	const renderPostImages = (post) => {
        if (post.url_overridden_by_dest && (post.url_overridden_by_dest.endsWith('.jpg') || post.url_overridden_by_dest.endsWith('.jpeg') || post.url_overridden_by_dest.endsWith('.png') || post.url_overridden_by_dest.endsWith('.gif'))) {
            return (
                <div className="image-container">
                    <img src={post.url_overridden_by_dest} alt="Post Image" className="max-w-full h-auto cursor-pointer" onClick={() => handleImageClick(post.url_overridden_by_dest)}/>
                </div>
            );
        }
        return null;
    };
	
	const renderEnlargedPostImages = () => (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-80 z-50 flex justify-center items-center">
            <img src={enlargedImage} alt="Enlarged Post Image" className="max-w-full max-h-full" onClick={() => setEnlargedImage(null)} />
            <button onClick={() => setEnlargedImage(null)} className="absolute top-4 right-4 bg-gray-800 text-white p-2 rounded-full focus:outline-none">
                <i className="fas fa-times text-2xl"></i>
            </button>
        </div>
    );
	
	const renderCommentImages = (comment) => {
		const urlRegex = /(https?:\/\/[^\s]+?(?:jpe?g|png|gif))/gi;
		const imageUrls = [];
		let match;

		while ((match = urlRegex.exec(comment.body)) !== null) {
			imageUrls.push(match[1]);
		}
		
		if (imageUrls.length > 0) {
			return (
				<div className="image-container">
					{imageUrls.map((imageUrl, index) => (
						<img key={index} src={imageUrl} alt={`Comment Image ${index + 1}`} className="max-w-full h-auto cursor-pointer" onClick={() => handleCommentImageClick(imageUrl)} />
					))}
				</div>
			);
		}

		return null;
	};
	
	const renderEnlargedCommentImages = () => (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-80 z-50 flex justify-center items-center">
            <img src={enlargedCommentImage} alt="Enlarged Comment Image" className="max-w-full max-h-full" onClick={() => setEnlargedCommentImage(null)} />
            <button onClick={() => setEnlargedCommentImage(null)} className="absolute top-4 right-4 bg-gray-800 text-white p-2 rounded-full focus:outline-none">
                <i className="fas fa-times text-2xl"></i>
            </button>
        </div>
    );

    const renderPostFeed = () => (
        <div className