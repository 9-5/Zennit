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
	const [savedPosts, setSavedPosts] = useState(() => JSON.parse(localStorage.getItem('savedPosts') || '[]'));
    const [selectedPost, setSelectedPost] = useState(null);
    const [comments, setComments] = useState([]);
	const [userComments, setUserComments] = useState([]);
    const [sortType, setSortType] = useState(localStorage.getItem('sortType') || 'hot');
    const [sidebarVisible, setSidebarVisible] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [showErrorPopup, setShowErrorPopup] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
	const [showDeletePopup, setShowDeletePopup] = useState(false);
    const [deletePostId, setDeletePostId] = useState(null);
    const [toastMessage, setToastMessage] = useState('');
    const [enlargedImage, setEnlargedImage] = useState(null);
    const [enlargedCommentImage, setEnlargedCommentImage] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searchPageVisible, setSearchPageVisible] = useState(false);
    const [currentTheme, setCurrentTheme] = useState(localStorage.getItem('theme') || 'dark');

    useEffect(() => {
        document.body.className = currentTheme === 'light' ? 'light-theme' : (currentTheme === 'amethyst' ? 'amethyst' : '');
        localStorage.setItem('theme', currentTheme);
    }, [currentTheme]);

    const toggleTheme = () => {
        const newTheme = currentTheme === 'dark' ? 'light' : (currentTheme === 'light' ? 'amethyst' : 'dark');
        setCurrentTheme(newTheme);
    };

    useEffect(() => {
        localStorage.setItem('subreddits', JSON.stringify(subreddits));
    }, [subreddits]);

	useEffect(() => {
        localStorage.setItem('savedPosts', JSON.stringify(savedPosts));
    }, [savedPosts]);

    useEffect(() => {
        localStorage.setItem('selectedSubreddit', selectedSubreddit);
    }, [selectedSubreddit]);

    useEffect(() => {
        localStorage.setItem('sortType', sortType);
    }, [sortType]);

    useEffect(() => {
        fetchPosts();
		const saved = JSON.parse(localStorage.getItem('savedPosts') || '[]');
		setSavedPosts(saved);
    }, [selectedSubreddit, sortType]);

    const fetchPosts = async () => {
        setLoadingPosts(true);
        try {
            const response = await fetch(`https://www.reddit.com/${selectedSubreddit}/${sortType}.json?limit=10&after=${after}`);
            const data = await response.json();
            if (data.data.children) {
                setPosts(data.data.children.filter(post => post.kind === 't3'));
                setAfter(data.data.after);
                setContentBlockerDetected(false);
            } else {
                setContentBlockerDetected(true);
            }
        } catch (error) {
            console.error("Error fetching posts:", error);
            setErrorMessage('Failed to load posts. Please check your connection and try again.');
            setShowErrorPopup(true);
        } finally {
            setLoadingPosts(false);
        }
    };
	const fetchSavedPosts = async () => {
        setLoadingPosts(true);
        try {
			const saved = JSON.parse(localStorage.getItem('savedPosts') || '[]');
            setPosts(saved.filter(post => post.kind === 't3'));
            setContentBlockerDetected(false);
        } catch (error) {
            console.error("Error fetching posts:", error);
            setErrorMessage('Failed to load posts. Please check your connection and try again.');
            setShowErrorPopup(true);
        } finally {
            setLoadingPosts(false);
        }
    };

    const fetchMorePosts = async () => {
        if (!after || loadingPosts) return;
        setLoadingPosts(true);
        try {
            const response = await fetch(`https://www.reddit.com/${selectedSubreddit}/${sortType}.json?limit=10&after=${after}`);
            const data = await response.json();
            if (data.data.children) {
                setPosts(prevPosts => [...prevPosts, ...data.data.children.filter(post => post.kind === 't3')]);
                setAfter(data.data.after);
            }
        } catch (error) {
            console.error("Error fetching more posts:", error);
            setErrorMessage('Failed to load more posts. Please check your connection and try again.');
            setShowErrorPopup(true);
        } finally {
            setLoadingPosts(false);
        }
    };

    const handleScroll = () => {
        if (window.innerHeight + document.documentElement.scrollTop < document.documentElement.offsetHeight - 100) return;
        fetchMorePosts();
    };
    useEffect(() => {
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [after, loadingPosts]);

    const addSubreddit = (newSubreddit) => {
        if (!newSubreddit.startsWith('r/')) {
            newSubreddit = 'r/' + newSubreddit;
        }
        if (subreddits.find(sub => sub.name === newSubreddit)) {
            setErrorMessage('Subreddit already exists.');
            setShowErrorPopup(true);
            return;
        }
        setSubreddits([...subreddits, { name: newSubreddit }]);
    };
	const savePost = (post) => {
		const alreadySaved = savedPosts.some(savedPost => savedPost.data.id === post.data.id);
		if (alreadySaved) {
			setErrorMessage('Post already saved.');
            setShowErrorPopup(true);
			return;
		}
		setSavedPosts(prevSavedPosts => {
            const updatedSavedPosts = [...prevSavedPosts, post];
            localStorage.setItem('savedPosts', JSON.stringify(updatedSavedPosts));
            return updatedSavedPosts;
        });
		setToastMessage('Post saved successfully!');
	};
	const deleteSavedPost = (postId) => {
        setDeletePostId(postId);
        setShowDeletePopup(true);
    };
    const confirmDeleteSavedPost = () => {
        const updatedSavedPosts = savedPosts.filter(post => post.data.id !== deletePostId);
        setSavedPosts(updatedSavedPosts);
        localStorage.setItem('savedPosts', JSON.stringify(updatedSavedPosts));
        setShowDeletePopup(false);
        setDeletePostId(null);
        setToastMessage('Post deleted successfully!');
    };

    const cancelDeleteSavedPost = () => {
        setShowDeletePopup(false);
        setDeletePostId(null);
    };

    const removeSubreddit = (subredditName) => {
        setSubreddits(subreddits.filter(sub => sub.name !== subredditName));
    };

    const selectSubreddit = (subredditName) => {
        setSelectedSubreddit(subredditName);
        setSidebarVisible(false);
		setAfter(null);
    };

    const selectPost = async (post) => {
        setSelectedPost(post);
		document.body.style.overflow = 'hidden';
        setLoadingComments(true);
		try {
			const response = await fetch(`https://www.reddit.com/${post.data.permalink}.json?limit=10&after=${afterComment}`);
			const data = await response.json();
			if (data[1].data.children) {
                setComments(data[1].data.children.filter(comment => comment.kind === 't1'));
                setAfterComment(data[1].data.after);
            }
		} catch (error) {
            console.error("Error fetching comments:", error);
            setErrorMessage('Failed to load comments. Please check your connection and try again.');
            setShowErrorPopup(true);
        } finally {
            setLoadingComments(false);
        }
    };
	const fetchMoreComments = async () => {
        if (!afterComment || loadingComments) return;
        setLoadingComments(true);
        try {
            const response = await fetch(`https://www.reddit.com/${selectedPost.data.permalink}.json?limit=10&after=${afterComment}`);
            const data = await response.json();
			if (data[1].data.children) {
                setComments(prevComments => [...prevComments, ...data[1].data.children.filter(comment => comment.kind === 't1')]);
                setAfterComment(data[1].data.after);
            }
        } catch (error) {
            console.error("Error fetching more comments:", error);
            setErrorMessage('Failed to load more comments. Please check your connection and try again.');
            setShowErrorPopup(true);
        } finally {
            setLoadingComments(false);
        }
    };
	const fetchUserComments = async (username) => {
        setLoadingComments(true);
        try {
            const response = await fetch(`https://www.reddit.com/user/${username}/comments.json?limit=10&after=${userAfterComment}`);
            const data = await response.json();
            if (data.data.children) {
                setUserComments(data.data.children.filter(comment => comment.kind === 't1'));
                setUserAfterComment(data.data.after);
            }
        } catch (error) {
            console.error("Error fetching user comments:", error);
            setErrorMessage('Failed to load user comments. Please check your connection and try again.');
            setShowErrorPopup(true);
        } finally {
            setLoadingComments(false);
        }
    };
	const fetchMoreUserComments = async () => {
        if (!userAfterComment || loadingComments) return;
        setLoadingComments(true);
        try {
            const response = await fetch(`https://www.reddit.com/user/${selectedPost.data.author}/comments.json?limit=10&after=${userAfterComment}`);
            const data = await response.json();
            if (data.data.children) {
                setUserComments(prevComments => [...prevComments, ...data.data.children.filter(comment => comment.kind === 't1')]);
                setUserAfterComment(data.data.after);
            }
        } catch (error) {
            console.error("Error fetching more user comments:", error);
            setErrorMessage('Failed to load more user comments. Please check your connection and try again.');
            setShowErrorPopup(true);
        } finally {
            setLoadingComments(false);
        }
    };

    const closePost = () => {
        setSelectedPost(null);
		document.body.style.overflow = 'auto';
    };
	const handleCommentScroll = () => {
        if (window.innerHeight + document.documentElement.scrollTop < document.documentElement.offsetHeight - 100) return;
        fetchMoreComments();
    };
	const handleUserCommentScroll = () => {
        if (window.innerHeight + document.documentElement.scrollTop < document.documentElement.offsetHeight - 100) return;
        fetchMoreUserComments();
    };
	useEffect(() => {
        if (selectedPost) {
            window.addEventListener('scroll', handleCommentScroll);
        } else {
            window.removeEventListener('scroll', handleCommentScroll);
        }
        return () => window.removeEventListener('scroll', handleCommentScroll);
    }, [afterComment, loadingComments, selectedPost]);
	useEffect(() => {
        if (selectedPost) {
            window.addEventListener('scroll', handleUserCommentScroll);
        } else {
            window.removeEventListener('scroll', handleUserCommentScroll);
        }
        return () => window.removeEventListener('scroll', handleUserCommentScroll);
    }, [userAfterComment, loadingComments, selectedPost]);

    const toggleSidebar = () => {
        setSidebarVisible(!sidebarVisible);
    };
    const handleSortChange = (e) => {
        setSortType(e.target.value);
		setAfter(null);
    };
    const closeErrorPopup = () => {
        setShowErrorPopup(false);
    };
    const openEnlargedImage = (imageUrl) => {
        setEnlargedImage(imageUrl);
    };

    const closeEnlargedImage = () => {
        setEnlargedImage(null);
    };
    const openEnlargedCommentImage = (imageUrl) => {
        setEnlargedCommentImage(imageUrl);
    };

    const closeEnlargedCommentImage = () => {
        setEnlargedCommentImage(null);
    };
    const handleSearch = async () => {
        if (!searchTerm) return;
        setSearchPageVisible(true);
        try {
            const response = await fetch(`https://www.reddit.com/search.json?q=${searchTerm}&limit=10`);
            const data = await response.json();
            setSearchResults(data.data.children);
        } catch (error) {
            console.error("Error fetching search results:", error);
            setErrorMessage('Failed to load search results. Please check your connection and try again.');
            setShowErrorPopup(true);
        }
    };

    const renderPost = (post) => {
        let imageUrl = post.data.url_overridden_by_dest;
		let isVideo = post.data.is_video;
        if (!imageUrl && post.data.preview && post.data.preview.images) {
            imageUrl = post.data.preview.images[0].source.url.replace(/&amp;/g, '&');
        }

        return (
            <div key={post.data.id} className="bg-gray-900 border border-gray-700 rounded-lg shadow-md p-4 mb-4">
                <div className="flex items-center mb-2">
                    <img src={post.data.thumbnail || 'assets/zennit-logo.png'} alt={post.data.subreddit} className="w-8 h-8 rounded-full mr-2" />
                    <div className="title-container">
                        <h3 className="text-white font-bold"><a href="#" onClick={() => selectPost(post)}>{post.data.title}</a></h3>
                    </div>
                </div>
                {imageUrl && !isVideo && (
                    <div className="mb-2">
                        <img src={imageUrl} alt="Post Image" className="rounded cursor-pointer" onClick={() => openEnlargedImage(imageUrl)} />
                    </div>
                )}
				{isVideo && post.data.media && post.data.media.reddit_video && (
                    <div className="mb-2">
                        <video controls width="100%" height="auto">
                            <source src={post.data.media.reddit_video.fallback_url} type="video/mp4" />
                            Your browser does not support the video tag.
                        </video>
                    </div>
                )}
                <p className="text-gray-400">
                    Score: {post.data.score} | Comments: {post.data.num_comments} | Author: {post.data.author}
                </p>
				<button onClick={() => savePost(post)} className="mt-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
					Save Post
				</button>
            </div>
        );
    };
	const renderSavedPost = (post) => {
        let imageUrl = post.data.url_overridden_by_dest;
		let isVideo = post.data.is_video;
        if (!imageUrl && post.data.preview && post.data.preview.images) {
            imageUrl = post.data.preview.images[0].source.url.replace(/&amp;/g, '&');
        }
        return (
            <div key={post.data.id} className="bg-gray-900 border border-gray-700 rounded-lg shadow-md p-4 mb-4">
                <div className="flex items-center mb-2">
                    <img src={post.data.thumbnail || 'assets/zennit-logo.png'} alt={post.data.subreddit} className="w-8 h-8 rounded-full mr-2" />
                    <div className="title-container">
                        <h3 className="text-white font-bold"><a href="#" onClick={() => selectPost(post)}>{post.data.title}</a></h3>
                    </div>
                </div>
                {imageUrl && !isVideo && (
                    <div className="mb-2">
                        <img src={imageUrl} alt="Post Image" className="rounded cursor-pointer" onClick={() => openEnlargedImage(imageUrl)} />
                    </div>
                )}
				{isVideo && post.data.media && post.data.media.reddit_video && (
                    <div className="mb-2">
                        <video controls width="100%" height="auto">
                            <source src={post.data.media.reddit_video.fallback_url} type="video/mp4" />
                            Your browser does not support the video tag.
                        </video>
                    </div>
                )}
                <p className="text-gray-400">
                    Score: {post.data.score} | Comments: {post.data.num_comments} | Author: {post.data.author}
                </p>
				<button onClick={() => deleteSavedPost(post.data.id)} className="mt-2 bg-red-600 hover:bg-red-800 text-white font-bold py-2 px-4 rounded">
					Delete Post
				</button>
            </div>
        );
    };
    const renderComment = (comment) => {
        let commentImageUrl;
        if (comment.data.body.includes('img')) {
            commentImageUrl = comment.data.body.match(/src="(.*?)"/)?.[1];
        }
		return (
            <div key={comment.data.id} className="bg-gray-900 border border-gray-700 rounded-lg shadow-md p-4 mb-4">
                <div className="flex items-center mb-2">
                    <div className="title-container">
                        <h3 className="text-white font-bold">Author: {comment.data.author}</h3>
                    </div>
                </div>
                <p className="text-gray-400 body-text">{comment.data.body}</p>
				{commentImageUrl && (
                    <div className="mb-2">
                        <img src={commentImageUrl} alt="Comment Image" className="rounded cursor-pointer" onClick={() => openEnlargedCommentImage(commentImageUrl)} />
                    </div>