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
    const [savedPosts, setSavedPosts] = useState(() => JSON.parse(localStorage.getItem('savedPosts') || '[]'));
    const [showSidebar, setShowSidebar] = useState(false);
    const [showSearchPage, setSearchPageVisible] = useState(false);
    const [enlargedImage, setEnlargedImage] = useState(null);
    const [enlargedCommentImage, setEnlargedCommentImage] = useState(null);
    const [showErrorPopup, setShowErrorPopup] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [showDeletePopup, setShowDeletePopup] = useState(false);
    const [postToDelete, setPostToDelete] = useState(null);
    const [toastMessage, setToastMessage] = useState('');
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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
        if (toastMessage) {
            const timer = setTimeout(() => {
                setToastMessage('');
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [toastMessage]);

    useEffect(() => {
        loadPosts();
        loadSavedPosts();
    }, [selectedSubreddit]);

    useEffect(() => {
        if (posts.length === 0 && loadingPosts) {
            setErrorMessage("Content Blocker Detected. Please disable your content blocker to use Zennit.");
            setShowErrorPopup(true);
            setContentBlockerDetected(true);
        } else if (posts.length > 0 && contentBlockerDetected) {
            setShowErrorPopup(false);
            setErrorMessage("");
            setContentBlockerDetected(false);
        }
    }, [posts, loadingPosts, contentBlockerDetected]);

    useEffect(() => {
        const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
        link.type = 'image/x-icon';
        link.rel = 'shortcut icon';
        link.href = 'assets/favicon/favicon.ico';
        document.getElementsByTagName('head')[0].appendChild(link);
    }, []);

    const handleImageClick = (imageUrl) => {
        setEnlargedImage(imageUrl);
    };

    const handleCommentImageClick = (imageUrl) => {
        setEnlargedCommentImage(imageUrl);
    };

    const renderEnlargedPostImages = () => {
        return (
            <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-80 z-50 flex justify-center items-center" onClick={() => setEnlargedImage(null)}>
                <img src={enlargedImage} alt="Enlarged Post Image" className="max-w-4/5 max-h-4/5 object-contain" />
            </div>
        );
    };

    const renderEnlargedCommentImages = () => {
        return (
            <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-80 z-50 flex justify-center items-center" onClick={() => setEnlargedCommentImage(null)}>
                <img src={enlargedCommentImage} alt="Enlarged Comment Image" className="max-w-4/5 max-h-4/5 object-contain" />
            </div>
        );
    };

    const addSubreddit = (subredditName) => {
        if (!subredditName.startsWith('r/')) {
            setErrorMessage('Subreddit names must start with "r/"');
            setShowErrorPopup(true);
            return;
        }
        if (subreddits.find(sub => sub.name === subredditName)) {
             setErrorMessage('Subreddit already exists.');
             setShowErrorPopup(true);
             return;
        }

        setSubreddits([...subreddits, { name: subredditName }]);
        setSelectedSubreddit(subredditName);
    };

    const removeSubreddit = (subredditName) => {
        const updatedSubreddits = subreddits.filter(sub => sub.name !== subredditName);
        setSubreddits(updatedSubreddits);
        if (selectedSubreddit === subredditName && updatedSubreddits.length > 0) {
            setSelectedSubreddit(updatedSubreddits[0].name);
        } else if (updatedSubreddits.length === 0) {
            setSelectedSubreddit('r/0KB');
            setSubreddits([{ name: 'r/0KB' }]);
        }
    };

    const loadPosts = async (loadMore = false) => {
        if (!loadMore) {
            setPosts([]);
            setAfter(null);
        }
        setLoadingPosts(true);
        try {
            let url = `https://www.reddit.com/${selectedSubreddit}/hot.json?limit=10`;
            if (after && loadMore) {
                url += `&after=${after}`;
            }
            const response = await fetch(url);
            const data = await response.json();
            if (data.data && data.data.children) {
                const newPosts = data.data.children.map(post => ({
                    id: post.data.id,
                    title: post.data.title,
                    author: post.data.author,
                    score: post.data.score,
                    num_comments: post.data.num_comments,
                    thumbnail: post.data.thumbnail,
                    url: post.data.url,
                    permalink: post.data.permalink,
                    created_utc: post.data.created_utc,
                    selftext: post.data.selftext,
                    post_hint: post.data.post_hint,
                    preview: post.data.preview,
                    is_gallery: post.data.is_gallery,
                    media_metadata: post.data.media_metadata,
                    gallery_data: post.data.gallery_data,
                    flair: post.data.link_flair_text
                }));
                setPosts(prevPosts => [...prevPosts, ...newPosts]);
                setAfter(data.data.after);
            } else {
                console.error("Error loading posts:", data);
            }
        } catch (error) {
            console.error("Error fetching posts:", error);
        } finally {
            setLoadingPosts(false);
        }
    };

    const loadComments = async (postId) => {
        setLoadingComments(true);
        try {
            const response = await fetch(`https://www.reddit.com/r/0KB/comments/${postId}.json`);
            const data = await response.json();
            if (data && data[1] && data[1].data && data[1].data.children) {
                setComments(data[1].data.children.map(comment => ({
                    id: comment.data.id,
                    author: comment.data.author,
                    body: comment.data.body,
                    replies: comment.data.replies,
                    created_utc: comment.data.created_utc,
                    permalink: comment.data.permalink,
                    body_html: comment.data.body_html
                })));
            }
        } catch (error) {
            console.error("Error fetching comments:", error);
        } finally {
            setLoadingComments(false);
        }
    };

     const loadUserComments = async (username, loadMore = false) => {
        if (!loadMore) {
            setUserComments([]);
            setUserAfterComment(null);
        }
        setLoadingComments(true);
        try {
            let url = `https://www.reddit.com/user/${username}/comments.json?limit=10`;
            if (userAfterComment && loadMore) {
                url += `&after=${userAfterComment}`;
            }
            const response = await fetch(url);
            const data = await response.json();
             if (data && data.data && data.data.children) {
                const newUserComments = data.data.children.map(comment => ({
                    id: comment.data.id,
                    author: comment.data.author,
                    body: comment.data.body,
                    replies: comment.data.replies,
                    created_utc: comment.data.created_utc,
                    permalink: comment.data.permalink,
                    body_html: comment.data.body_html,
                    subreddit_name_prefixed: comment.data.subreddit_name_prefixed,
                    link_title: comment.data.link_title
                }));
                setUserComments(prevComments => [...prevComments, ...newUserComments]);
                setUserAfterComment(data.data.after);
            } else {
                console.error("Error loading user comments:", data);
            }
        } catch (error) {
            console.error("Error fetching comments:", error);
        } finally {
            setLoadingComments(false);
        }
    };

    const savePost = (post) => {
        setSavedPosts(prevSavedPosts => {
            const isPostSaved = prevSavedPosts.some(savedPost => savedPost.id === post.id);
            if (isPostSaved) {
                return prevSavedPosts;
            } else {
                return [...prevSavedPosts, post];
            }
        });
        setToastMessage('Post saved!');
    };

    const loadSavedPosts = () => {
        try {
            const savedPostsData = localStorage.getItem('savedPosts');
            if (savedPostsData) {
                setSavedPosts(JSON.parse(savedPostsData));
            }
        } catch (error) {
            console.error("Error loading saved posts from localStorage:", error);
        }
    };

    const deleteSavedPost = (postId) => {
        setPostToDelete(postId);
        setShowDeletePopup(true);
    };

    const confirmDeletePost = () => {
        setSavedPosts(prevSavedPosts => prevSavedPosts.filter(post => post.id !== postToDelete));
        setShowDeletePopup(false);
        setToastMessage('Post deleted!');
    };

    const cancelDeletePost = () => {
        setShowDeletePopup(false);
        setPostToDelete(null);
    };

    const toggleSidebar = () => {
        setShowSidebar(!showSidebar);
    };

    const renderPost = (post) => {
        const isSaved = savedPosts.some(savedPost => savedPost.id === post.id);
        return (
            <div key={post.id} className="mb-4 p-4 rounded-md shadow-md bg-gray-800 relative">
                {post.flair && (
                    <div className="flair absolute top-2 right-2 px-2 py-1 text-xs font-semibold rounded-full" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
                        {post.flair}
                    </div>
                )}
                <div className="title-container">
                    <a href={post.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                        <h2 className="text-xl font-semibold mb-2">{post.title}</h2>
                    </a>
                </div>
                <p className="text-gray-400 mb-2">
                    Posted by <a href={`https://www.reddit.com/user/${post.author}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{post.author}</a>
                </p>
                {post.post_hint === 'image' && (
                    <div className="mb-2">
                        <img src={post.url} alt={post.title} className="max-w-full h-auto rounded-md cursor-pointer" onClick={() => handleImageClick(post.url)} />
                    </div>
                )}
                {post.is_gallery && post.media_metadata && (
                    <div className="flex overflow-x-auto mb-2">
                        {Object.values(post.media_metadata).map((item) => (
                            <img
                                key={item.id}
                                src={`https://i.redd.it/${item.id}.${item.m.split('/')[1]}`}
                                alt={post.title}
                                className="max-w-full h-auto rounded-md mr-2 cursor-pointer"
                                onClick={() => handleImageClick(`https://i.redd.it/${item.id}.${item.m.split('/')[1]}`)}
                            />
                        ))}
                    </div>
                )}
                {post.selftext && (
                    <div className="body-text">
                        {post.selftext}
                    </div>
                )}
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <span className="mr-2">Score: {post.score}</span>
                        <span className="mr-2">Comments: {post.num_comments}</span>
                    </div>
                     <div>
                        <button onClick={() => loadComments(post.id)} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-2">
                            View Comments
                        </button>
                        {!isSaved ? (
                            <button onClick={() => savePost(post)} className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
                                Save Post
                            </button>
                        ) : (
                            <button onClick={() => deleteSavedPost(post.id)} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
                                Delete Post
                            </button>
                        )}
                    </div>
                </div>
                <PostComments comments={comments} loadingComments={loadingComments} handleCommentImageClick={handleCommentImageClick} />
            </div>
        );
    };

    const renderSavedPost = (post) => {
        return (
            <div key={post.id} className="mb-4 p-4 rounded-md shadow-md bg-gray-800 relative">
                {post.flair && (
                    <div className="flair absolute top-2 right-2 px-2 py-1 text-xs font-semibold rounded-full" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
                        {post.flair}
                    </div>
                )}
                <div className="title-container">
                    <a href={post.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                        <h2 className="text-xl font-semibold mb-2">{post.title}</h2>
                    </a>
                </div>
                <p className="text-gray-400 mb-2">
                    Posted by <a href={`https://www.reddit.com/user/${post.author}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{post.author}</a>
                </p>
                {post.post_hint === 'image' && (
                    <div className="mb-2">
                        <img src={post.url} alt={post.title} className="max-w-full h-auto rounded-md cursor-pointer" onClick={() => handleImageClick(post.url)} />
                    </div>
                )}
                {post.is_gallery && post.media_metadata && (
                    <div className="flex overflow-x-auto mb-2">
                        {Object.values(post.media_metadata).map((item) => (
                            <img
                                key={item.id}
                                src={`https://i.redd.it/${item.id}.${item.m.split('/')[1]}`}
                                alt={post.title}
                                className="max-w-full h-auto rounded-md mr-2 cursor-pointer"
                                onClick={() => handleImageClick(`https://i.redd.it/${item.id}.${item.m.split('/')[1]}`)}
                            />
                        ))}
                    </div>
                )}
                {post.selftext && (
                    <div className="body-text">
                        {post.selftext}
                    </div>
                )}
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <span className="mr-2">Score: {post.score}</span>
                        <span className="mr-2">Comments: {post.num_comments}</span>
                    </div>
                     <div>
                        <button onClick={() => loadComments(post.id)} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-2">
                            View Comments
                        </button>
                        <button onClick={() => deleteSavedPost(post.id)} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
                            Delete Post
                        </button>
                    </div>
                </div>
                <PostComments comments={comments} loadingComments={loadingComments} handleCommentImageClick={handleCommentImageClick} />
            </div>
        );
    };

    const renderComment = (comment) => {
        if (!comment || !comment.data) {
            return null;
        }

        const commentData = comment.data;

        return (
            <div key={commentData.id} className="mb-4 p-4 rounded-md shadow-md bg-gray-700">
                <p className="text-gray-400">
                    <a href={`https://www.reddit.com/user/${commentData.author}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                        {commentData.author}
                    </a>
                </p>
                <div className="body-text">
                   {commentData.body}
                </div>
            </div>
        );
    };

    const renderUserComment = (comment) => {
        return (
            <div key={comment.id} className="mb-4 p-4 rounded-md shadow-md bg-gray-700">
                <p className="text-gray-400">
                    <a href={`https://www.reddit.com/${comment.subreddit_name_prefixed}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                        {comment.subreddit_name_prefixed}
                    </a> - <a href={`https://www.reddit.com/r/0KB/comments/${comment.id}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                        {comment.link_title}
                    </a>
                </p>
                <div className="body-text">
                   {comment.body}
                </div>
            </div>
        );
    };

    const renderPostFeed = () => {
        return (
            <div>
                {posts.map(post => renderPost(post))}
                {loadingPosts && <p className="text-center">Loading more posts...</p>}
                {!loadingPosts && after && (
                    <button onClick={() => loadPosts(true)} className="block mx-auto bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                        Load More
                    </button>
                )}
            </div>
        );
    };

    const renderSavedPostFeed = () => {
         return (
            <div>
                {savedPosts.map(post => renderSavedPost(post))}
                {savedPosts.length === 0 && <p className="text-center">No saved posts yet.</p>}
            </div>
        );
    };

    const renderCommentFeed = () => {
        return (
            <div>
                {comments.map(comment => renderComment({ data: comment }))}
                {loadingComments && <p className="text-center">Loading comments...</p>}
            </div>
        );
    };

    const renderUserCommentFeed = (username) => {
        return (
            <div>
                {userComments.map(comment => renderUserComment(comment))}
                {loadingComments && <p className="text-center">Loading comments...</p>}
                {!loadingComments && userAfterComment && (
                    <button onClick={() => loadUserComments(username, true)} className="block mx-auto bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                        Load More
                    </button>
                )}
            </div>
        );
    };

    const renderErrorPopup = () => {
        return (
            <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 z-50 flex justify-center items-center">
                <div className="bg-gray-900 p-8 rounded-md shadow-md">
                    <h2 className="text-xl font-semibold mb-4">Error</h2>
                    <p>{errorMessage}</p>
                    <button onClick={() => setShowErrorPopup(false)} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4">
                        Close
                    </button>
                </div>
            </div>
        );
    };

    const renderDeleteSavedPostPopup = () => {
        return (
            <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 z-50 flex justify-center items-center">
                <div className="bg-gray-900 p-8 rounded-md shadow-md">
                    <h2 className="text-xl font-semibold mb-4">Delete Post</h2>
                    <p>Are you sure you want to delete this post?</p>
                    <div className="flex justify-around">
                        <button onClick={confirmDeletePost} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded mt-4">
                            Yes, Delete
                        </button>
                        <button onClick={cancelDeletePost} className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded mt-4">
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const Sidebar = ({ isOpen, toggleSidebar, addSubreddit, subreddits, selectedSubreddit, setSelectedSubreddit, removeSubreddit }) => {
    const [newSubreddit, setNewSubreddit] = useState('');
    const [isContextMenuVisible, setContextMenuVisible] = useState(false);
    const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
    const [selectedSubredditForMenu, setSelectedSubredditForMenu] = useState(null);
    const sidebarRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
                setContextMenuVisible(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [sidebarRef]);

    const handleInputChange = (e) => {
        setNewSubreddit(e.target.value);
    };

    const handleAddSubreddit = () => {
        if (newSubreddit.trim() !== '') {
            addSubreddit(newSubreddit);
            setNewSubreddit('');
        }
    };

    const handleSubredditClick = (subredditName) => {
        setSelectedSubreddit(subredditName);
        toggleSidebar();
    };

    const handleContextMenu = (event, subredditName) => {
        event.preventDefault();
        setSelectedSubredditForMenu(subredditName);
        setContextMenuPosition({ x: event.clientX, y: event.clientY });
        setContextMenuVisible(true);
    };

    const handleRemoveSubreddit = () => {
        removeSubreddit(selectedSubredditForMenu);
        setContextMenuVisible(false);
    };

    return (
        <div ref={sidebarRef} className={`sidebar fixed top-0 left-0 h-full w-64 bg-gray-900 text-white shadow-md transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} z-50`}>
            <div className="p-4">
                <h2 className="text-2xl font-semibold mb-4">Subreddits</h2>
                <div className="mb-4">
                    <input
                        type="text"
                        className="w-full p-2 rounded-md bg-gray-800 text-white"
                        placeholder="r/subreddit"
                        value={newSubreddit}
                        onChange={handleInputChange}
                    />
                    <button onClick={handleAddSubreddit} className="w-full mt-2 p-2 bg-blue-500 hover:bg-blue-700 text-white rounded-md">
                        Add
                    </button>
                </div>
                <ul>
                    {subreddits.map(subreddit => (
                        <li key={subreddit.name} className={`p-2 rounded-md hover:bg-gray-800 cursor-pointer ${selectedSubreddit === subreddit.name ? 'bg-gray-700' : ''}`}
                            onClick={() => handleSubredditClick(subreddit.name)}
                            onContextMenu={(event) => handleContextMenu(event, subreddit.name)}>
                            {subreddit.name}
                        </li>
                    ))}
                </ul>
            </div>
            {isContextMenuVisible && (
                <div className="fixed z-50" style={{ top: contextMenuPosition.y, left: contextMenuPosition.x }}>
                    <div className="bg-gray-800 shadow-md rounded-md py-2">
                        <button className="block px-4 py-2 text-