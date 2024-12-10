const { useState, useEffect, useRef } = React;
const { createRoot } = ReactDOM;

const App = () => {
    const [contentBlockerDetected, setContentBlockerDetected] = useState(false);
    const [loadingPosts, setLoadingPosts] = useState(false);
    const [loadingComments, setLoadingComments] = useState(false);
    const [subreddits, setSubreddits] = useState(() => JSON.parse(localStorage.getItem('subreddits') || '[{"name": "r/Zennit"}]'));
    const [selectedSubreddit, setSelectedSubreddit] = useState(localStorage.getItem('selectedSubreddit') || 'r/Zennit');
    const [posts, setPosts] = useState([]);
    const [selectedPost, setSelectedPost] = useState(null);
    const [comments, setComments] = useState([]);
    const [sort, setSort] = useState('hot');
    const [commentSort, setCommentSort] = useState('best');
    const [activeUserTab, setActiveUserTab] = useState('posts');
    const [newSubreddit, setNewSubreddit] = useState('');
    const [toastMessage, setToastMessage] = useState('');
    const [showPopup, setShowPopup] = useState(false);
    const [subredditToDelete, setSubredditToDelete] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const sidebarRef = useRef(null);
    const [commentVisibility, setCommentVisibility] = useState([]);
    const [currentPage] = useState(1);
    const [savedPosts, setSavedPosts] = useState(JSON.parse(localStorage.getItem('savedPosts') || '[]'));
    const [viewingSaved, setViewingSaved] = useState(false);
    const [postToDelete, setPostToDelete] = useState(null);
    const [showDeletePopup, setShowDeletePopup] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [enlargedImage, setEnlargedImage] = useState(null);
    const [enlargedCommentImage, setEnlargedCommentImage] = useState(null);
    const [showSettings, setShowSettings] = useState(false);
    const settingsRef = useRef(null);
    const [showConfig, setShowConfig] = useState(false);
    const themes = [{ name: 'Ocean', className: '' }, { name: 'Sky', className: 'sky' }, { name: 'Forest', className: 'forest' }, { name: 'Bamboo', className: 'bamboo' }, { name: 'Crimson', className: 'crimson' }, { name: 'Blush', className: 'blush' }, { name: 'Petal', className: 'petal' }, { name: 'Lotus', className: 'lotus' }, { name: 'Amethyst', className: 'amethyst' }];
    const [currentTheme, setCurrentTheme] = useState(() => {return localStorage.getItem('theme') || 'Ocean';});
    const [showNSFWPosts, setShowNSFWPosts] = useState(() => JSON.parse(localStorage.getItem('showNSFWPosts')) || false);
    const [disableComments, setDisableComments] = useState(() => JSON.parse(localStorage.getItem('disableComments')) || false);
    const [disableCommentReplies, setDisableCommentReplies] = useState(() => JSON.parse(localStorage.getItem('disableCommentReplies')) || false);
    const [viewingAbout, setViewingAbout] = useState(false);
    const [commitInfo, setCommitInfo] = useState(null);
    const [showClearCachePopup, setShowClearCachePopup] = useState(false);
    const [showErrorPopup, setShowErrorPopup] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const hammerRef = useRef(null);

    

    // Main functions.
    const fetchPosts = (page) => {
        setLoadingPosts(true);
        let fetchUrl;
        if (selectedSubreddit.startsWith('u/')) {
          const username = selectedSubreddit.substring(2);
          fetchUrl = `https://www.reddit.com/user/${username}/submitted/${sort}.json?count=${(page - 1) * 25}`;
        } else {
          fetchUrl = `https://www.reddit.com/${selectedSubreddit}/${sort}.json?count=${(page - 1) * 25}`;
        }
      
        fetch(fetchUrl)
          .then(response => response.json())
          .then(data => {
            const fetchedPosts = data.data.children.map(child => ({
              id: child.data.id,
              title: child.data.title,
              author: child.data.author,
              content: child.data.selftext,
              url: child.data.url,
              subreddit: child.data.subreddit_name_prefixed,
              created_utc: child.data.created_utc,
              gallery_data: child.data.gallery_data,
              media_metadata: child.data.media_metadata,
              pinned: child.data.stickied,
              ups: child.data.ups - child.data.downs,
              media: child.data.media,
              flair: child.data.link_flair_text || '',
              nsfw: child.data.over_18,
              isEdited: child.data.edited
            }));
      
            setPosts(prevPosts => [...prevPosts, ...fetchedPosts]);
            setContentBlockerDetected(false);
          })
          .catch(error => {
            console.error('Post fetch error:', error);
            setContentBlockerDetected(true);
          })
          .finally(() => {
            setLoadingPosts(false);
          });
      }
    const fetchComments = (postId) => {
        setLoadingComments(true);
        const post = posts.find(p => p.id === postId) || savedPosts.find(p => p.id === postId);
        const subredditToUse = post.subreddit;
        fetch(`https://www.reddit.com/${subredditToUse}/comments/${postId}.json?sort=${commentSort}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                const postTitle = data[0].data.children[0].data.title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
                const fetchedComments = data[1].data.children.map(child => {
                    const isOP = child.data.author === post.author;
                    const isEdited = child.data.edited;
                    const commentData = {
                        author: child.data.author,
                        body: child.data.body,
                        media_metadata: child.data.media_metadata,
                        pinned: child.data.stickied,
                        ups: child.data.ups - child.data.downs,
                        replies: child.data.replies ? child.data.replies.data.children.map(reply => ({
                            author: reply.data.author,
                            body: reply.data.body,
                            media_metadata: reply.data.media_metadata,
                            pinned: reply.data.stickied,
                            ups: reply.data.ups - reply.data.downs,
                        })) : []
                    };
                    if (commentData.media_metadata && commentData.media_metadata.length > 0) {
                        commentData.media_metadata.forEach(media => {
                            media.s.u = media.s.u.replace(/redd\.it\/(.*?)(\.jpeg|\.jpg|\.png)/, `redd.it/${postTitle}$1$2`);
                        });
                    }
    
                    return { ...commentData, isVisible: true, isOP, isEdited };
                });
    
                setComments(fetchedComments);
                setCommentVisibility(new Array(fetchedComments.length).fill(true));
            })
            .catch(error => {
                console.error('Comment fetch error:', error);
            })
            .finally(() => {
                setLoadingComments(false);
            });
    };

    const fetchUserComments = () => {
        setLoadingComments(true);
        fetch(`https://www.reddit.com/user/${selectedSubreddit.substring(2)}/comments/.json`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                const fetchedComments = data.data.children.map(child => ({
                    id: child.data.id,
                    body: child.data.body,
                    author: child.data.author,
                    ups: child.data.ups - child.data.downs,
                    post_id: child.data.link_id,
                    created_utc: child.data.created_utc,
                    permalink: child.data.permalink,
                    link_title: child.data.link_title,
                    subreddit: child.data.subreddit
                }));
                setComments(fetchedComments);
            })
            .catch(error => {
                console.error('Comment fetch error:', error);
            })
            .finally(() => {
                setLoadingComments(false);
            });
    };

    const formatDate = (timestamp) => {
        const date = new Date(timestamp * 1000);
        const userLocale = navigator.language || 'en-US';
        const formattedDate = date.toLocaleDateString(userLocale, { 
            year: '2-digit', 
            month: '2-digit', 
            day: '2-digit' 
        });
        const formattedTime = date.toLocaleTimeString(userLocale, { 
            hour: '2-digit', 
            minute: '2-digit', 
            hour12: false
        });
        return `${formattedDate} ${formattedTime}`;
    };
    const formatUpvotes = (upvotes) => {
        if (upvotes >= 100000) {
            return `${Math.floor(upvotes / 1000)}K`;
        } else if (upvotes >= 1000) {
            return `${(upvotes / 1000).toFixed(1)}K`;
        }
        return upvotes.toString();
    };

    const renderContentBlocked = () => {
        return (
            <div className="bg-red-600 text-white p-4 rounded mb-4">
                <p>It seems that a content blocker is preventing posts from being fetched. Please disable your content blocker and refresh the page.</p>
                <button 
                    className="mt-2 p-2 bg-gray-700 text-white rounded" 
                    onClick={() => window.location.reload()}
                >
                    Refresh Page
                </button>
            </div>
        )
    };

    const renderPageHeader = () => {
        return (
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center cursor-pointer" onClick={() => { setSelectedPost(null); setViewingSaved(false); setViewingAbout(false); setShowConfig(false); }}>
                    <button className="text-white mr-4" onClick={() =>  { setSelectedPost(null); setViewingSaved(false); setViewingAbout(false); setShowConfig(false); setSidebarOpen(true) }}>
                        <img src="https://0kb.org/app/zennit/assets/favicon/favicon-96x96.png" alt="Zennit Icon" className="w-8 h-8" />
                    </button>
                    <div className="ml-2">
                        <div className="text-white text-xl sm:text-2xl">
                            {selectedSubreddit.startsWith('user/') && selectedSubreddit.includes('/m/') 
                                ? `m/${selectedSubreddit.split('/m/')[1]}`
                                : selectedSubreddit}
                        </div>
                    </div>
                </div>
                <div className="flex items-center">
                    <select className="p-2 bg-gray-700 text-white rounded" value={sort} onChange={(e) => setSort(e.target.value)}>
                        <option value="hot">Hot</option>
                        <option value="new">New</option>
                        <option value="top">Top</option>
                        <option value="rising">Rising</option>
                    </select>
                    <button className="text-white ml-4" onClick={fetchPosts}>
                        <i className="fas fa-sync-alt active"></i>
                    </button>
                    <button className="text-white ml-4" onClick={() => setShowSettings(!showSettings)}>
                        <i className="fas fa-cog active" id="settingsIcon"></i>
                    </button>
                </div>
            </div>
        )
    };

    const renderLoadingSpinner = () => {
        return (
            <div className="text-white text-center">
                <i className="fas fa-yin-yang fa-spin fa-10x"></i>
            </div>
        )
    };

    const renderPostFeed = () => {
        return (
            posts
                .filter(post => showNSFWPosts || !post.nsfw)
                .map((post, index) => (
                    <div className="bg-gray-700 p-2 rounded mt-2" key={index}>
                        {selectedSubreddit.startsWith('user/') || selectedSubreddit.startsWith('u/') ? (
                            <span className="text-gray-400 text-sm">{post.subreddit}</span>
                        ) : null}
                        <div className="flex justify-between items-center">
                            <div className="flex-1 overflow-hidden">
                                <span className="text-white whitespace-normal">{post.pinned && <i className="fas fa-thumbtack text-yellow-500 mr-2" title="Pinned"></i>}{post.nsfw && <i className="fas fa-exclamation-triangle text-red-500 mr-2" title="NSFW"></i>}{post.title.replace(/&amp;/g, '&')}</span>
                            </div>
                            <div className="text-gray-400 ml-4 flex-shrink-0">
                            {post.flair && <span className="flair">{post.flair}</span>}
                                <span className="flex items-center">
                                    <i className="fas fa-arrow-up mr-1"></i>
                                    {formatUpvotes(post.ups)}
                                </span>
                            </div>
                            <button className="ml-4 p-2 bg-gray-600 text-white rounded" onClick={() => viewPost(post.id)}>
                                View Post
                            </button>
                        </div>
                        <div className="text-gray-400 text-sm mt-1 flex justify-between">
                            <span>by {post.author}</span>
                            <span>{formatDate(post.created_utc)}</span>
                        </div>
                    </div>
                )
            )
        );
    };

    const renderTabSlider = () => {
        return (
            <div className="relative mb-4">
                <div className="flex justify-around">
                    <button 
                        className={`p-2 ${activeUserTab === 'posts' ? 'text-white' : 'text-gray-300'}`} 
                        onClick={() => {
                            setActiveUserTab('posts');
                            setSelectedPost(null);
                        }}
                    >
                        Posts
                    </button>
                    <button 
                        className={`p-2 ${activeUserTab === 'comments' ? 'text-white' : 'text-gray-300'}`} 
                        onClick={() => {
                            setActiveUserTab('comments');
                            fetchUserComments(selectedSubreddit);
                        }}
                    >
                        Comments
                    </button>
                </div>
                <div className={`absolute bottom-0 left-0 h-1 bg-gray-700 transition-all duration-300 ${activeUserTab === 'posts' ? 'w-1/2' : 'w-1/2 left-1/2'}`}></div>
            </div>
        );
    };

    useEffect(() => {
        localStorage.setItem('selectedSubreddit', selectedSubreddit);
    }, [selectedSubreddit]);

    useEffect(() => {
        setPosts([]);
        fetchPosts(currentPage);
    }, [selectedSubreddit, sort]);

    const viewPost = (postId) => {
        const post = posts.find(p => p.id === postId) || savedPosts.find(p => p.id === postId);
        setSelectedPost(post);
        fetchComments(postId);
        setViewingSaved(false);
    };



    // Sidebar, sidebar subreddits rendering and support functions
    const renderSidebar = () => {
        return (
            <div ref={sidebarRef} className={`fixed inset-y-0 left-0 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out w-64 bg-gray-900 p-4 z-50`}>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                        <img src="https://0kb.org/app/zennit/assets/favicon/favicon-96x96.png" alt="Reddit Icon" className="w-8 h-8" />
                        <span className="ml-2 text-white text-xl">Zennit</span>
                    </div>
                    <button className="text-white" onClick={() => setSidebarOpen(false)}>
                        <i className="fas fa-arrow-left"></i>
                    </button>
                </div>
                <div className="mb-4">
                    <h2 className="text-gray-400">Subreddits</h2>
                    {renderSubreddits()}
                </div>
                <div className="mt-4">
                    <button className="mt-2 w-full p-2 bg-gray-700 text-white rounded" onClick={() => setEditMode(!editMode)}>
                        {editMode ? 'Done Editing' : 'Edit Subreddits'}
                    </button>
                </div>
                <div className="mt-4">
                    <input
                        type="text"
                        placeholder="Add subreddit"
                        className="w-full p-2 bg-gray-800 text-white rounded"
                        value={newSubreddit}
                        onChange={(e) => setNewSubreddit(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                addSubreddit();
                            }
                        }}
                    />
                    <button className="mt-2 w-full p-2 bg-gray-700 text-white rounded" onClick={addSubreddit}>Add Subreddit</button>
                </div>
            </div>
        )
    };

    const renderSubreddits = () => {
        return subreddits.map((subreddit, index) => (
            <div className="flex items-center mt-2 cursor-pointer" key={index}>
                <div 
                    className="ml-2 text-white" 
                    onClick={() => {
                        const subredditToFetch = subreddit.original ? subreddit.original : subreddit.name;
                        setSelectedSubreddit(subredditToFetch);
                        setSidebarOpen(false);}}
                    onContextMenu={(e) => handleRightClick(e, subreddit.name)}
                >
                    {subreddit.original ? `m/${subreddit.name}` : subreddit.name}
                </div>
                {editMode && (
                    <button 
                        className="text-red-500 ml-2" 
                        onClick={() => {
                            setSubredditToDelete(subreddit.name);
                            setShowPopup(true);
                        }}
                    >
                        <i className="fas fa-times"></i>
                    </button>
                )}
            </div>
        ));
    };

    const addSubreddit = () => {
        if (newSubreddit) {
            let formattedSubreddit = newSubreddit.trim();
            const lowerCaseSubreddit = formattedSubreddit.toLowerCase();
            if ((lowerCaseSubreddit.startsWith('user/') || lowerCaseSubreddit.startsWith('u/')) && formattedSubreddit.includes('/m/')) {
                fetch(`https://www.reddit.com/${formattedSubreddit}.json`)
                    .then(response => {
                        if (response.ok) {
                            const multiRedditName = formattedSubreddit.split('/m/')[1];
                            setSubreddits([...subreddits, { name: multiRedditName, original: formattedSubreddit }]);
                        } else {
                            return response.json().then(data => {
                                if (data.error === 404) {
                                    setErrorMessage('This multi-reddit is either private or not exist.');
                                }
                                setShowErrorPopup(true);
                            });
                        }
                    })
                    .catch(error => {
                        setErrorMessage('An error occurred while fetching the multi-reddit.');
                        setShowErrorPopup(true);
                    }
                );
            } else if ((lowerCaseSubreddit.startsWith('user/') || lowerCaseSubreddit.startsWith('u/')) && !formattedSubreddit.includes('/m/')) {
                fetch(`https://www.reddit.com/user/${formattedSubreddit.substring(2)}.json`)
                    .then(response => {
                        if (response.ok) {
                            setSubreddits([...subreddits, { name: formattedSubreddit }]);
                            setNewSubreddit('');
                        } else {
                            return response.json().then(data => {
                                if (data.error === 404) {
                                    setErrorMessage('User  does not exist.');
                                } else if (data.error === 403) {
                                    setErrorMessage('User  is suspended.');
                                }
                                setShowErrorPopup(true);
                            });
                        }
                    })
            } else if (formattedSubreddit.startsWith('m/')) {
                setErrorMessage('Please specify the user that owns the multi-reddit.\nExample: user/00403/m/Feed');
                setShowErrorPopup(true);
            } else {
                if (!formattedSubreddit.startsWith('r/')) {
                    formattedSubreddit = 'r/' + formattedSubreddit;
                }
                fetch(`https://www.reddit.com/${formattedSubreddit}.json`)
                    .then(response => {
                        if (response.ok) {
                            setSubreddits([...subreddits, { name: formattedSubreddit }]);
                            setNewSubreddit('');
                        } else {
                            return response.json().then(data => {
                                if (data.error === 403 && data.reason === "private") {
                                    setErrorMessage('This subreddit is private.');
                                } else if (data.error === 404 && data.reason === "banned") {
                                    setErrorMessage('This subreddit is banned.');
                                } else if (data.error === 404) {
                                    fetch(`https://www.reddit.com/subreddits/search.json?q=${formattedSubreddit}`)
                                        .then(searchResponse => searchResponse.json())
                                        .then(searchData => {
                                            if (searchData.data.children.length === 0) {
                                                setErrorMessage('This subreddit does not exist.');
                                            } else {
                                                setErrorMessage('This subreddit is not accessible.');
                                            }
                                            setShowErrorPopup(true);
                                        });
                                } else {
                                    setSubreddits([...subreddits, { name: formattedSubreddit }]);
                                }
                                setShowErrorPopup(true);
                            });
                        }
                    })
                    .catch(error => {
                        setErrorMessage(`Unable to find ${formattedSubreddit}.`);
                        setShowErrorPopup(true);
                    }
                );
            }
            setNewSubreddit('');
        }
    };

    const handleRightClick = (e, subreddit) => {
        e.preventDefault();
        setSubredditToDelete(subreddit);
        setShowPopup(true);
    };

    const confirmDelete = () => {
        setSubreddits(subreddits.filter(sub => sub.name !== subredditToDelete));
        setShowPopup(false);
        setSubredditToDelete(null);
        setToastMessage('Subreddit removed!');
    };

    const cancelDelete = () => {
        setShowPopup(false);
        setSubredditToDelete(null);
    };

    const renderSubredditDeletePopup = () => {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                <div className="bg-gray-800 p-4 rounded">
                    <div className="text-white mb-4">Do you want to delete {subredditToDelete}?</div>
                    <div className="flex justify-end">
                        <button className="p-2 bg-gray-700 text-white rounded mr-2" onClick={confirmDelete}>Yes</button>
                        <button className="p-2 bg-gray-700 text-white rounded" onClick={cancelDelete}>No</button>
                    </div>
                </div>
            </div>
        )
    };

    const handleClickOutside = (event) => {
        if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
            setSidebarOpen(false);
        }
    };

    useEffect(() => {
        if (sidebarOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [sidebarOpen]);

    useEffect(() => {
        localStorage.setItem('subreddits', JSON.stringify(subreddits));
    }, [subreddits]);



    // Function to render posts and support functions
    const renderSelectedPost = () => {
        return (
            <div>
                <div className="text-white bg-gray-700 p-2 rounded mt-1 flex flex-col">
                    <div className="flex justify-between items-start">
                        <div className="flex-1 title-container overflow-hidden">
                            <span className="whitespace-normal">{selectedPost.pinned && <i className="fas fa-thumbtack text-yellow-500 mr-2" title="Pinned"></i>}{selectedPost.nsfw && <i className="fas fa-exclamation-triangle text-red-500 mr-2" title="NSFW"></i>}{selectedPost.title.replace(/&amp;/g, '&')}</span>
                        </div>
                        <div className="text-gray-400 ml-4 flex-shrink-0">
                            <span className="flex items-center">
                                {console.log(selectedPost.isEdited)}
                                <i className="fas fa-arrow-up mr-1"></i>
                                {formatUpvotes(selectedPost.ups)}
                            </span>
                        </div>
                    </div>
                    <div className="text-gray-400 text-sm mt-1 flex justify-between">
                        <span>by {selectedPost.author}</span>
                        <span>{formatDate(selectedPost.created_utc)}</span>
                    </div>
                </div>
                <div className="text-white bg-gray-700 p-2 rounded mt-1">
                        {renderFormattedText(selectedPost.content)}
                        {renderPostContent(selectedPost)}
                
                    <button className="p-2 bg-gray-700 text-white rounded" onClick={() => sharePost(selectedPost.url)}>
                        <i className="fas fa-share-alt"></i>  Share Post
                    </button>
                    <button className="ml-4 p-2 bg-gray-700 text-white rounded" onClick={() => savePost(selectedPost)}>
                        <i class="fas fa-bookmark" id="bookmarkIcon"></i>  Save Post
                    </button>
                </div>
                <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center">
                        <select className="p-2 bg-gray-700 text-white rounded" value={commentSort} onChange={(e) => { setCommentSort(e.target.value); fetchComments(selectedPost.id); }}>
                            <option value="best">Best</option>
                            <option value="top">Top</option>
                            <option value="new">New</option>
                            <option value="controversial">Controversial</option>
                        </select>
                        <button className="text-white ml-4" onClick={() => fetchComments(selectedPost.id)}>
                            <i className="fas fa-sync-alt"></i>
                        </button>
                    </div>
                </div>
        <div className="text-gray-400 text-sm mt-1">Comments</div>
            {loadingComments && (
                <div className="text-white text-center">
                    <i className="fas fa-yin-yang fa-spin fa-10x"></i>
                </div>
            )}
            {disableComments ? (
                <div className="text-gray-400 mt-2">Comments have been disabled in the config settings.</div>
            ) : (
                comments.map((comment, index) => (
                    <Comment key={index} comment={comment} />
                ))
            )}
            <button className="mt-4 p-2 bg-gray-700 text-white rounded" onClick={() => setSelectedPost(null)}>Back to Posts</button>
        </div>
        )
    };

    const renderPostContent = (post) => {
        if (post.media && post.media.reddit_video) {
            return (
                <video controls width="400" height="400">
                    <source src={post.media.reddit_video.fallback_url} type="video/mp4" />
                    Your browser does not support the video tag.
                </video>
            );
        } else if (post.url && post.url.includes("https://www.reddit.com/gallery/")) {
            return renderGallery(post);
        } else if (post.url && post.url.includes("youtube.com") || post.url.includes("youtu.be")) {
            const videoId = post.url.includes("youtu.be") 
                ? post.url.split('/').pop() 
                : new URLSearchParams(new URL(post.url).search).get('v');
            return (
                <iframe
                    width="400"
                    height="400"
                    src={`https://www.youtube.com/embed/${videoId}`}
                    frameBorder="0"
                    allowFullScreen
                    title="YouTube Video"
                ></iframe>
            );
        } else if (post.url && !post.url.includes("/comments/")) {
            const isRedditUrl = post.url.includes("reddit.com") || post.url.includes("redd.it");
            if (isRedditUrl) {
                return (
                    <img 
                        src={post.url} 
                        alt="Post content" 
                        className="mt-2 rounded max-w-full cursor-pointer" 
                        height="30%" 
                        width="30%" 
                        onClick={() => handleImageClick(post.url)}
                    />
                );
            } else {
                return <EmbedCard url={post.url} fallbackTitle={post.title} />;
            }
        }
        return null;
    };

    const renderGallery = (post) => {
        if (!post.gallery_data || !post.media_metadata) return null;
        const items = post.gallery_data.items.map(item => {
            const media = post.media_metadata[item.media_id];
            const src = media.s.u.replace(/&amp;/g, '&');
            return (
                <img
                    key={item.media_id}
                    src={src}
                    alt="Gallery item"
                    className="w-1/4 h-auto rounded mt-2 cursor-pointer"
                    onClick={() => handleImageClick(src)}
                />
            );
        });

        return (
            <div className="overflow-x-auto whitespace-nowrap flex">
                {items}
            </div>
        );
    };

    const renderEnlargedPostImages = () => {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75" onClick={handleCloseImage}>
                <img src={enlargedImage} alt="Enlarged" className="max-w-full max-h-full" />
            </div>
        )
    };

    const handleImageClick = (src) => {
        setEnlargedImage(src);
    };

    const handleCloseImage = () => {
        setEnlargedImage(null);
    };

    const EmbedCard = ({ url, fallbackTitle }) => {
        const [postTitle, setPostTitle] = useState(fallbackTitle);
        const [baseUrl, setBaseUrl] = useState('');

        useEffect(() => {
            const extractBaseUrl = (url) => {
                try {
                    const parsedUrl = new URL(url);
                    return parsedUrl.hostname;
                } catch (error) {
                    console.error('Invalid URL:', error);
                    return '';
                }
            };

            setBaseUrl(extractBaseUrl(url));

            const fetchPageTitle = async () => {
                try {
                    const response = await fetch(url, { method: 'GET' });
                    const doc = await response.text();
                    const titleMatch = doc.match(/<title>(.*?)<\/title>/);
                    if (titleMatch) {
                        setPostTitle(titleMatch[1]);
                    }
                } catch (error) {
                    console.error(':(')
                }
            };

            fetchPageTitle();
        }, [url]);

        return (
            <div className="max-w-xl mx-auto p-4">
                <div className="bg-gray-800 p-4 rounded-lg">
                    <h1 className="text-2xl font-bold">{postTitle || 'Loading...'}</h1>
                    <div className="flex justify-between items-center mt-4 border-t border-gray-700 pt-2">
                        <span className="text-blue-400">{baseUrl}</span>
                        <button 
                            className="border border-gray-500 text-gray-300 px-4 py-1 rounded-full hover:bg-gray-700" 
                            onClick={() => window.open(url, '_blank')}
                        >
                            Open
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    
    const renderFormattedText = (text) => {
        if (!text || typeof text !== 'string') {
            return null;
        }
        
        let formattedText = text;
        formattedText = formattedText.replace(/\\/g, '');
        formattedText = formattedText.replace(/\n\n+/g, '\n');
    
        const imageUrls = [];
        const previewRedditRegex = /(https?:\/\/preview\.redd\.it\/[^\s]+)/g;
        formattedText = formattedText.replace(previewRedditRegex, (match) => {
            const decodedUrl = match.replace(/&amp;/g, '&');
            imageUrls.push(decodedUrl);
            return '';
        });

        const spoilerRegex = /(&gt;!)?(.*?)!(&lt;)/g;
        formattedText = formattedText.replace(spoilerRegex, (match, start, content, end) => {
            return `<span class="spoiler" onclick="this.classList.toggle('revealed');">${content}</span>`;
        });

        formattedText = formattedText.replace(/^\s*&gt;\s*(.+)$/gm, (match, content) => {
            return `<blockquote style="border-left: 4px solid #ccc; padding-left: 10px; color: #999;">${content.trim()}</blockquote>`;
        });
        
        formattedText = formattedText.replace(/^(#{1,6})\s*(.+)$/gm, (match, hashes, content) => {
            const level = hashes.length;
            const fontSize = `${(6 - level) * 0.25 + 1}em`;
            return `<h${level} className="ww-anchor" style="font-size: ${fontSize}; font-weight: bold;">${content}</h${level}>`;
        });
        
        const inlineRegex = [
            { regex: /~~(.*?)~~/g, tag: 'del' },
            { regex: /\^(\S+)/g, tag: 'sup' },
            { regex: /`(.*?)`/g, tag: 'code' }
        ];
    
        inlineRegex.forEach(({ regex, tag }) => {
            formattedText = formattedText.replace(regex, (match, p1) => {
                return `<${tag}>${p1}</${tag}>`;
            });
        });
    
        const markdownRegex = [
            { regex: /(\*\*\*|___)(.*?)\1/g, tag: 'strong', className: 'italic' },
            { regex: /(\*\*|__)(.*?)\1/g, tag: 'strong' },
            { regex: /(\*|_)(.*?)\1/g, tag: 'em' }
        ];

        formattedText = formattedText.replace(/(^|\n)(- .+)/g, (match, p1, p2) => {
            return `${p1}<div style="margin-left: 20px;">• ${p2.slice(2)}</div>`;
        });

        formattedText = formattedText.replace(/(^|\n)(\d+\.\s.+)/g, (match, p1, p2) => {
            return `${p1}<div style="margin-left: 20px;">${p2}</div>`;
        });

        markdownRegex.forEach(({ regex, tag, className }) => {
            formattedText = formattedText.replace(regex, (match, p1, p2) => {
                return `<${tag} class="${className || ''}">${p2}</${tag}>`;
            });
        });
        
        const plaintextUrlRegex = /(?<![\[\(])(https?:\/\/[^\s\(\)]+)(?<![\]\)])/g;
        formattedText = formattedText.replace(plaintextUrlRegex, (match) => {
            const cleanMatch = match.replace(/<\/?[^>]*>/g, '');
            return `<a href="${cleanMatch}" class="text-blue-500 underline ww-anchor">${cleanMatch}</a>`;
        });

        const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g;
        formattedText = formattedText.replace(linkRegex, (match, p1, p2) => {
            return `<a href="${p2}" class="text-blue-500 underline ww-anchor">${p1}</a>`;
        });
        
        const codeBlockRegex = /((?:^|\n)(?: {4}.*\n)+)/g;
        formattedText = formattedText.replace(codeBlockRegex, (match, p1) => {
            const codeContent = p1.replace(/^ {4}/gm, '');
            return `<pre>${codeContent}</pre>`;
        });
    
        formattedText = formattedText.replace(/\n/g, '<br/>');
        return (
            <div className="post-body">
                <span dangerouslySetInnerHTML={{ __html: formattedText }} />
                {imageUrls.map((url, index) => (
                    <img
                        key={index}
                        src={url}
                        alt="Comment embedded content"
                        className="mt-2 rounded cursor-pointer"
                        height="30%"
                        width="30%"
                        onClick={() => setEnlargedCommentImage(url)}
                    />
                ))}
            </div>
        );
    };

    const sharePost = (url) => {
        if (!url.startsWith('https://')) {
            url = `https://www.reddit.com${url}`;
        }
        if (navigator.share) {
            navigator.share({
                title: 'Check out this post on Reddit',
                url: url
            }).then(() => {
                console.log('Post shared successfully');
            }).catch((error) => {
                console.error('Error sharing the post:', error);
            });
        } else {
            navigator.clipboard.writeText(url).then(() => {
                setToastMessage('Post link copied to clipboard!');
            }).catch((error) => {
                console.error('Could not copy text: ', error);
            });
        }
    };
    
    const savePost = (post) => {
        if (!savedPosts.some(savedPost => savedPost.id === post.id)) {
            const updatedSavedPosts = [...savedPosts, post];
            setSavedPosts(updatedSavedPosts);
            localStorage.setItem('savedPosts', JSON.stringify(updatedSavedPosts));
            setToastMessage('Post saved!');
        }
    };


    // Comment components and support functions
    const Comment = ({ comment }) => {
        const [isVisible, setIsVisible] = useState(true);
        
        const toggleVisibility = () => {
            setIsVisible(!isVisible);
        };

        const isUpsValid = !isNaN(comment.ups);

        if (!isUpsValid) {
            return null;
        }

        return (
            <div className="text-white bg-gray-700 p-2 rounded mt-1">
                <div className="flex items-center text-gray-400 text-sm cursor-pointer" onClick={toggleVisibility}>
                    <button className="ml-2 text-blue-500">
                        {isVisible ? '[ - ]' : '[ + ]'}
                    </button>
                    <span className="ml-1">by {comment.author}{comment.isOP && <i className="fas fa-at text-blue-500 ml-2" title="OP"></i>}
                    </span>
                    <span className="text-gray-400 ml-2"><i className="fas fa-arrow-up"></i>{formatUpvotes(comment.ups)}</span>
                    {comment.pinned && <span className="text-yellow-500 ml-2"><i className="fas fa-thumbtack"></i></span>}
                    {comment.isEdited && <i className="fas fa-pencil-alt text-gray-400" title="Edited"></i>}
                </div>
                {isVisible && (
                    <div className="comment-body">
                        <div className="ml-2">{renderFormattedText(comment.body)}</div>
                        {disableCommentReplies ? (
                        <div className="comment-replies-disabled"></div>
                        ) : (
                            comment.replies && comment.replies.length > 0 && (
                                <div className="ml-4">
                                    {comment.replies.map((reply, index) => (
                                        <Comment key={index} comment={reply} />
                                    ))}
                                </div>
                            )
                        )
                    }
                    </div>
                )}
            </div>
        );
    };

    const renderUserComments = () => {
        return (
            comments.map((comment, index) => (
                <div className="bg-gray-700 p-2 rounded mt-2" key={index}>
                    <div className="flex justify-between items-center">
                        <div className="flex-1 overflow-hidden text-left">
                            <span className="text-white whitespace-normal">
                                {comment.link_title.replace(/&amp;/g, '&')}
                            </span>
                        </div>
                        <div className="text-gray-400 ml-4 flex-shrink-0">
                            <span className="flex items-center">
                                <i className="fas fa-arrow-up mr-1"></i>
                                {formatUpvotes(comment.ups)}
                            </span>
                        </div>
                    </div>
                    <div className="text-gray-400 ml-2 italic">{renderFormattedText(comment.body)}</div>
                    <div className="text-gray-400 text-sm mt-1 flex justify-between">
                        <span>by {comment.author}</span>
                        <span>{formatDate(comment.created_utc)}</span>
                    </div>
                </div>
            ))
        );
    };

    const toggleCommentVisibility = (index) => {
        const updatedVisibility = [...commentVisibility];
        updatedVisibility[index] = !updatedVisibility[index];
        setCommentVisibility(updatedVisibility);
    };

    const renderEnlargedCommentImages = () => {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75" onClick={handleCloseCommentImage}>
                    <img src={enlargedCommentImage} alt="Enlarged Comment" className="max-w-full max-h-full" />
                </div>
        )
    };

    const handleCloseCommentImage = () => {
        setEnlargedCommentImage(null);
    };
    
    const handleClickOutsideCommentImage = (event) => {
        if (enlargedCommentImage && !event.target.classList.contains('comment-image')) {
            handleCloseCommentImage();
        }
    };

    useEffect(() => {
        if (enlargedCommentImage) {
            document.addEventListener('mousedown', handleClickOutsideCommentImage);
        } else {
            document.removeEventListener('mousedown', handleClickOutsideCommentImage);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutsideCommentImage);
        };
    }, [enlargedCommentImage]);


    // Settings page, components and functions
    const SettingsPage = ({ onClose, onViewSavedPosts, onViewConfig }) => {

        return (
            <div ref={settingsRef} className="bg-gray-800 p-4 rounded">
                <h2 className="text-white text-xl mb-4">Settings</h2>
                <button className="mt-2 w-full p-2 bg-gray-700 text-white rounded" onClick={onViewConfig}>
                    Config
                </button>
                <button className="mt-2 w-full p-2 bg-gray-700 text-white rounded" onClick={() => { onViewSavedPosts(); onClose(); }}>
                    View Saved Posts
                </button>
                <button className="mt-2 w-full p-2 bg-gray-700 text-white rounded" onClick={clearCache}>
                    Clear Cache/Data
                </button>
                <button className="mt-2 w-full p-2 bg-gray-700 text-white rounded" onClick={() => { setSelectedPost(null); setViewingSaved(false); handleViewAbout(); onClose(); }}>
                    About Zennit
                </button>
                <button className="mt-4 w-full p-2 bg-gray-700 text-white rounded" onClick={onClose}>
                    Close
                </button>
                {showClearCachePopup && renderClearCachePopup()}
            </div>
        );
    };

    const handleClickOutsideSettings = (event) => {
        if (settingsRef.current && !settingsRef.current.contains(event.target)) {
            setShowSettings(false);
        }
    };

    useEffect(() => {
        if (showSettings) {
            document.addEventListener('mousedown', handleClickOutsideSettings);
        } else {
            document.removeEventListener('mousedown', handleClickOutsideSettings);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutsideSettings);
        };
    }, [showSettings]);
    

    const ConfigPage = ({ onClose }) => {
        return (
            <div className="bg-gray-800 p-4 rounded">
                <h2 className="text-white text-xl mb-4">Config</h2>
                <h3 className="text-white text-lg mb-2">Theme Selection</h3>
                <select 
                    className="mt-2 w-full p-2 bg-gray-700 text-white rounded" 
                    style={{ 'text-align': 'center' }}
                    value={currentTheme} 
                    onChange={(e) => changeTheme(e.target.value)}
                >
                    {themes.map((theme, index) => (
                        <option key={index} value={theme.name}>
                            {theme.name}
                        </option>
                    ))}
                </select>
                <div className="mt-4">
                    <h3 className="text-white text-lg mb-2">Content Preferences</h3>
                    <div className="flex items-center mb-2">
                        <span className="text-white mr-2" style={{ width: '200px' }}>Show NSFW Posts</span>
                        <div className="relative">
                            <input 
                                type="checkbox" 
                                checked={showNSFWPosts} 
                                onChange={() => setShowNSFWPosts(prev => !prev)} 
                                className="hidden"
                            />
                            <div className={`toggle-switch ${showNSFWPosts ? 'on' : 'off'}`} onClick={() => setShowNSFWPosts(prev => !prev)}>
                                <div className={`toggle-thumb ${showNSFWPosts ? 'on' : 'off'}`}></div>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center mb-2">
                        <span className="text-white mr-2" style={{ width: '200px' }}>Disable Comments</span>
                        <div className="relative">
                            <input 
                                type="checkbox" 
                                checked={disableComments} 
                                onChange={() => setDisableComments(prev => !prev)} 
                                className="hidden"
                            />
                            <div className={`toggle-switch ${disableComments ? 'on' : 'off'}`} onClick={() => setDisableComments(prev => !prev)}>
                                <div className={`toggle-thumb ${disableComments ? 'on' : 'off'}`}></div>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center mb-2">
                        <span className="text-white mr-2" style={{ width: '200px' }}>Disable Comment Replies</span>
                        <div className="relative">
                            <input 
                                type="checkbox" 
                                checked={disableCommentReplies} 
                                onChange={() => setDisableCommentReplies(prev => !prev)} 
                                className="hidden"
                            />
                            <div className={`toggle-switch ${disableCommentReplies ? 'on' : 'off'}`} onClick={() => setDisableCommentReplies(prev => !prev)}>
                                <div className={`toggle-thumb ${disableCommentReplies ? 'on' : 'off'}`}></div>
                            </div>
                        </div>
                    </div>
                </div>
                <button className="mt-4 w-full p-2 bg-gray-700 text-white rounded" onClick={onClose}>
                    Close
                </button>
            </div>
        );
    };

    const handleViewConfig = () => {
        setShowConfig(true);
        setShowSettings(false);
    };

    const changeTheme = (theme) => {
        setCurrentTheme(theme);
    };

    useEffect(() => {
        document.body.className = currentTheme === 'Ocean' ? '' : currentTheme.toLowerCase();
        localStorage.setItem('theme', currentTheme);
    }, [currentTheme]);

    useEffect(() => {
        localStorage.setItem('showNSFWPosts', JSON.stringify(showNSFWPosts));
    }, [showNSFWPosts]);

    useEffect(() => {
        localStorage.setItem('disableComments', JSON.stringify(disableComments));
    }, [disableComments]);

    useEffect(() => {
        localStorage.setItem('disableCommentReplies', JSON.stringify(disableCommentReplies));
    }, [disableCommentReplies]);

    //_ Function and support functions for saved posts
    const renderSavedPosts = () => {
        return savedPosts.map((post, index) => (
            <div className="bg-gray-700 p-2 rounded mt-2" key={index}>
                <div className="flex justify-between items-center">
                    <div className="flex-1 overflow-hidden">
                        <span className="text-white whitespace-normal">{post.title.replace(/&amp;/g, '&')}</span>
                    </div>
                    <div className="text-gray-400 ml-4 flex-shrink-0">
                        <span className="flex items-center">
                            {post.edited && <i className="fas fa-pencil-alt text-gray-400 ml-2" title="Edited"></i>}
                            <i className="fas fa-arrow-up mr-1"></i>
                            {formatUpvotes(post.ups)}
                        </span>
                    </div>
                    <button className="ml-4 p-2 bg-gray-600 text-white rounded" onClick={() => viewPost(post.id)}>
                        View Post
                    </button>
                </div>
                <div className="text-gray-400 text-sm mt-1 flex justify-between">
                    <span>by {post.author}</span>
                    <span>{formatDate(post.created_utc)}</span>
                </div>
                {editMode && (
                        <button 
                            className="text-red-500 ml-2" 
                            onClick={() => {
                                setPostToDelete(post);
                                setShowDeletePopup(true);
                            }}
                        >
                            <i className="fas fa-times"></i>
                        </button>
                    )
                }
            </div>
        ));
    };

    const renderViewSavedPost = () => {
        return (
            <div>
                <h2 className="text-white text-xl mb-4">Saved Posts</h2>
                <div className="text-gray-400 text-sm mb-4">
                <h3 className="text-gray-400 text-sm mt-1" onClick={() => setEditMode(!editMode)}>Edit saved posts</h3>
                {renderSavedPosts()}
                </div>
            </div>
        )
    }

    const renderDeleteSavedPostPopup = () => {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                <div className="bg-gray-800 p-4 rounded">
                    <div className="text-white mb-4">Do you want to delete {postToDelete.title}?</div>
                    <div className="flex justify-end">
                        <button className="p-2 bg-gray-700 text-white rounded mr-2" onClick={confirmDeletePost}>Yes</button>
                        <button className="p-2 bg-gray-700 text-white rounded" onClick={cancelDeletePost}>No</button>
                    </div>
                </div>
            </div>
        )
    };

    const confirmDeletePost = () => {
        setSavedPosts(savedPosts.filter(p => p.id !== postToDelete.id));
        localStorage.setItem('savedPosts', JSON.stringify(savedPosts.filter(p => p.id !== postToDelete.id)));
        setShowDeletePopup(false);
        setPostToDelete(null);
        setToastMessage('Post removed from bookmarks!');
    };
    
    const cancelDeletePost = () => {
        setShowDeletePopup(false);
        setPostToDelete(null);
    };

    const handleViewSavedPosts = () => {
        setViewingSaved(true);
        setShowSettings(false);
    };

    const renderClearCachePopup = () => {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                <div className="bg-gray-800 p-4 rounded">
                    <div className="text-white mb-4">Are you sure you want to clear the cache? This action cannot be undone.</div>
                    <div className="flex justify-end">
                        <button className="p-2 bg-gray-700 text-white rounded mr-2" onClick={confirmClearCache}>Yes</button>
                        <button className="p-2 bg-gray-700 text-white rounded" onClick={cancelClearCache}>No</button>
                    </div>
                </div>
            </div>
        );
    };

    const clearCache = () => {
        setShowClearCachePopup(true);
    };

    const confirmClearCache = () => {
        localStorage.clear();
        setSubreddits(() => JSON.parse(localStorage.getItem('subreddits') || '[{"name": "r/Zennit"}]'));
        setSelectedSubreddit(localStorage.getItem('selectedSubreddit') || 'r/Zennit');
        setSavedPosts(JSON.parse(localStorage.getItem('savedPosts') || '[]'));
        setToastMessage('Cache cleared successfully!');
        setShowClearCachePopup(false);
    };
    
    const cancelClearCache = () => {
        setShowClearCachePopup(false);
    };

    const renderAbout = () => {
        return (
            <div className="bg-gray-800 p-4 rounded">
                <h2 className="text-white text-xl mb-4">About Zennit</h2>
                <p className="text-gray-400 mb-2">
                    Zennit started as a creative project to fill some time. Being a frequent lurker on Reddit, ads, highly cluttered interfaces, and much more always bothered me. I opted to build an entirely minimal "zen" frontend instead.
                </p>
                <p className="text-gray-400 mb-2">
                    My goal with Zennit is to create a clean and user-friendly interface for browsing Reddit, focusing on simplicity and ease of use. I hope to continue improving it and adding features that enhance the user experience.
                </p>
                {commitInfo && (
                    <div className="text-gray-400 mt-4">
                        <p>
                            Built from <a href={`https://github.com/9-5/Zennit/tree/${commitInfo.hash}`} className="text-blue-500 hash">{commitInfo.hash}</a>
                        </p>
                        <p>Changes: {commitInfo.message}</p>
                    </div>
                )}
                <div className="flex items-center mt-4">
                    <a href="https://github.com/9-5/Zennit" target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-500 hover:underline mr-4">
                        <i className="fab fa-github mr-2"></i>
                        GitHub Repo
                    </a>
                    <a href="https://johnle.org" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                        Developer's Page
                    </a>
                </div>
            </div>
        );
    };

    const handleViewAbout = () => {
        setViewingAbout(true);
        setShowSettings(false);
    };

    const fetchCommitInfo = async () => {
        try {
            const response = await fetch('https://api.github.com/repos/9-5/Zennit/commits/main'); // Adjust the branch if necessary
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            setCommitInfo({
                hash: data.sha,
                message: data.commit.message,
            });
        } catch (error) {
            console.error('Error fetching commit info:', error);
        }
    };
    
    useEffect(() => {
        fetchCommitInfo();
    }, []);



    // Touch handlers
    useEffect(() => {
        hammerRef.current = new Hammer(document.getElementById('root'));
        hammerRef.current.on('swipe', handleSwipe);

        return () => {
            hammerRef.current.off('swipe', handleSwipe);
            hammerRef.current = null;
        };
    }, []);

    const handleSwipe = (event) => {
        if (event.direction === Hammer.DIRECTION_RIGHT) {
            setSidebarOpen(true);
        }
        if (event.direction === Hammer.DIRECTION_LEFT) {
            setSidebarOpen(false);
            setSelectedPost(null);
            setViewingSaved(false);
            setViewingAbout(false);
        }
    };



    // Miscellaneous functions
    const Toast = ({ message, onClose }) => {
        useEffect(() => {
            const timer = setTimeout(onClose, 3000);
            return () => clearTimeout(timer);
        }, [onClose]);
    
        return (
            <div className="fixed bottom-4 right-4 bg-green-500 text-white p-2 rounded shadow-lg">
                {message}
            </div>
        );
    };

    const renderErrorPopup = () => {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                <div className="bg-gray-800 p-4 rounded">
                    <div className="text-white mb-4">{errorMessage}</div>
                    <div className="flex justify-end">
                        <button className="p-2 bg-gray-700 text-white rounded" onClick={() => setShowErrorPopup(false)}>Close</button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="flex h-screen">
            <div>
                {renderSidebar()}
                {showPopup && (renderSubredditDeletePopup())}
            </div>
            <div className="flex-1 bg-gray-800 p-4 flex flex-col">
                {contentBlockerDetected && (renderContentBlocked())}
                {renderPageHeader()}
                {showSettings && <SettingsPage onClose={() => setShowSettings(false)} onViewSavedPosts={handleViewSavedPosts} onViewConfig={handleViewConfig} />}
                <div className="flex-1 overflow-y-auto">
                    {loadingPosts && (renderLoadingSpinner())}
                    
                    {selectedSubreddit.startsWith('u/') ? (
                        <>
                            {showConfig ? (
                                <ConfigPage onClose={() => setShowConfig(false)} />
                            ) : viewingSaved ? (
                                renderViewSavedPost()
                            ) : selectedPost ? (
                                renderSelectedPost()
                            ) : viewingAbout ? (
                                renderAbout()
                            ) : (
                                <>
                                    {renderTabSlider()}
                                    {activeUserTab === 'posts' ? renderPostFeed() : renderUserComments()} {/* Conditional rendering */}
                                </>
                            )}
                        </>
                    ) : (
                        showConfig ? (
                            <ConfigPage onClose={() => setShowConfig(false)} />
                        ) : viewingSaved ? (
                            renderViewSavedPost()
                        ) : selectedPost ? (
                            renderSelectedPost()
                        ) : viewingAbout ? (
                            renderAbout()
                        ) : (
                            renderPostFeed()
                        )
                    )}
                </div>
                {enlargedImage && (renderEnlargedPostImages())}
                {enlargedCommentImage && (renderEnlargedCommentImages())}
            </div>
            {showDeletePopup && (renderDeleteSavedPostPopup())}
            {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage('')} />}
            {showErrorPopup && renderErrorPopup()}
        </div>
    )
}

const rootElement = document.getElementById('root');
const root = createRoot(rootElement);
root.render(<App />);