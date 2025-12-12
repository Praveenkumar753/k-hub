import React, { useRef, useEffect, useState, useCallback } from 'react';

const VideoPlayer = ({ 
    videoUrl, 
    topicId, 
    onProgressUpdate, 
    onVideoComplete, 
    isCompleted = false 
}) => {
    const [watchedPercentage, setWatchedPercentage] = useState(0);
    const [actualWatchTime, setActualWatchTime] = useState(0);
    const [videoDuration, setVideoDuration] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [trackingActive, setTrackingActive] = useState(false);
    const [durationLoaded, setDurationLoaded] = useState(false);
    const [showDurationInput, setShowDurationInput] = useState(false);
    const [manualDuration, setManualDuration] = useState('');
    const intervalRef = useRef(null);
    const iframeRef = useRef(null);
    const startTimeRef = useRef(null);

    // Extract video ID from YouTube URL
    const getVideoId = useCallback((url) => {
        const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/;
        const match = url.match(regex);
        return match ? match[1] : null;
    }, []);

    const videoId = getVideoId(videoUrl);

    // Try to get duration from YouTube without API (creative methods)
    const tryGetDurationWithoutAPI = useCallback(async (videoId) => {
        if (!videoId || durationLoaded) return;

        console.log(`🔍 Trying to get duration for video: ${videoId}`);

        // Method 1: Try YouTube oEmbed (no API key needed, but limited info)
        try {
            const oEmbedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
            const response = await fetch(oEmbedUrl);
            if (response.ok) {
                const data = await response.json();
                console.log('📹 Video title:', data.title);
                
                // Try to extract duration from title if it contains time info
                const durationFromTitle = extractDurationFromTitle(data.title);
                if (durationFromTitle) {
                    console.log(`✅ Duration from title: ${durationFromTitle} seconds`);
                    setVideoDuration(durationFromTitle);
                    setDurationLoaded(true);
                    cacheDuration(videoId, durationFromTitle);
                    return durationFromTitle;
                }
            }
        } catch (error) {
            console.warn('oEmbed failed:', error.message);
        }

        // Method 2: Try JSONP approach (sometimes works)
        try {
            await tryJSONPMethod(videoId);
        } catch (error) {
            console.warn('JSONP method failed:', error.message);
        }

        // Method 3: Show manual input quickly if no other method works
        setTimeout(() => {
            if (!durationLoaded) {
                console.log('⏰ Showing manual input as fallback');
                setShowDurationInput(true);
            }
        }, 3000); // Show after 3 seconds instead of 10

        return null;
    }, [videoId, durationLoaded]);

    // Extract duration patterns from video titles
    const extractDurationFromTitle = (title) => {
        if (!title) return null;

        const patterns = [
            /\[(\d{1,2}):(\d{2})\]/, // [MM:SS]
            /\((\d{1,2}):(\d{2})\)/, // (MM:SS)
            /\[(\d{1,2}):(\d{2}):(\d{2})\]/, // [HH:MM:SS]
            /\((\d{1,2}):(\d{2}):(\d{2})\)/, // (HH:MM:SS)
            /(\d{1,2}):(\d{2}):(\d{2})/, // HH:MM:SS anywhere
            /(\d{1,2}):(\d{2})(?!\d)/, // MM:SS (not followed by digit)
            /Duration[:\s]+(\d{1,2}):(\d{2})/i,
            /Length[:\s]+(\d{1,2}):(\d{2})/i,
            /Time[:\s]+(\d{1,2}):(\d{2})/i
        ];

        for (const pattern of patterns) {
            const match = title.match(pattern);
            if (match) {
                if (match[3]) {
                    // HH:MM:SS format
                    const hours = parseInt(match[1]) || 0;
                    const minutes = parseInt(match[2]) || 0;
                    const seconds = parseInt(match[3]) || 0;
                    return hours * 3600 + minutes * 60 + seconds;
                } else {
                    // MM:SS format
                    const minutes = parseInt(match[1]) || 0;
                    const seconds = parseInt(match[2]) || 0;
                    return minutes * 60 + seconds;
                }
            }
        }
        return null;
    };

    // Try JSONP method (creative workaround)
    const tryJSONPMethod = (videoId) => {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            const callbackName = `youtube_callback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            window[callbackName] = (data) => {
                try {
                    console.log('JSONP data received:', data);
                    // Process any useful data
                    document.head.removeChild(script);
                    delete window[callbackName];
                    resolve(null); // Usually no duration data available
                } catch (error) {
                    reject(error);
                }
            };
            
            // Try different JSONP endpoints
            script.src = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json&callback=${callbackName}`;
            script.onerror = () => {
                document.head.removeChild(script);
                delete window[callbackName];
                reject(new Error('JSONP failed'));
            };
            
            document.head.appendChild(script);
            
            // Timeout after 5 seconds
            setTimeout(() => {
                if (document.head.contains(script)) {
                    document.head.removeChild(script);
                    delete window[callbackName];
                    reject(new Error('JSONP timeout'));
                }
            }, 5000);
        });
    };

    // Cache management
    const getCachedDuration = (videoId) => {
        try {
            const cache = JSON.parse(localStorage.getItem('videoDurations') || '{}');
            return cache[videoId] || null;
        } catch (error) {
            return null;
        }
    };

    const cacheDuration = (videoId, duration) => {
        try {
            const cache = JSON.parse(localStorage.getItem('videoDurations') || '{}');
            cache[videoId] = duration;
            localStorage.setItem('videoDurations', JSON.stringify(cache));
            console.log(`✅ Cached duration for ${videoId}: ${duration} seconds`);
        } catch (error) {
            console.warn('Could not cache duration:', error);
        }
    };

    // Check for cached duration first
    useEffect(() => {
        if (videoId && !durationLoaded) {
            const cachedDuration = getCachedDuration(videoId);
            if (cachedDuration) {
                console.log(`✅ Found cached duration: ${cachedDuration} seconds`);
                setVideoDuration(cachedDuration);
                setDurationLoaded(true);
                return;
            }
            
            // Try to get duration without API
            tryGetDurationWithoutAPI(videoId);
        }
    }, [videoId, durationLoaded, tryGetDurationWithoutAPI]);

    // Enhanced YouTube player state detection
    useEffect(() => {
        if (!videoId) return;

        const handleMessage = (event) => {
            if (event.origin !== 'https://www.youtube.com') return;

            try {
                const data = JSON.parse(event.data);
                
                // Enhanced play/pause state detection
                if (data.event === 'onStateChange') {
                    const state = data.info;
                    console.log('🎬 YouTube player state changed:', state);
                    
                    // YouTube player states:
                    // -1 = unstarted, 0 = ended, 1 = playing, 2 = paused, 3 = buffering, 5 = cued
                    const wasPlaying = isPlaying;
                    const nowPlaying = state === 1;
                    const isPaused = state === 2;
                    const hasEnded = state === 0;
                    
                    setIsPlaying(nowPlaying);
                    
                    if (nowPlaying && !wasPlaying) {
                        // Video started playing
                        startTimeRef.current = Date.now();
                        setTrackingActive(true);
                        console.log('▶️ Video STARTED playing - tracking activated');
                    } else if (isPaused && wasPlaying) {
                        // Video was paused
                        setTrackingActive(false);
                        console.log('⏸️ Video PAUSED - tracking stopped');
                    } else if (hasEnded) {
                        // Video ended
                        setTrackingActive(false);
                        console.log('🏁 Video ENDED - tracking stopped');
                        // Auto-complete if not already completed
                        if (!isCompleted) {
                            console.log('🎉 Video ended - auto completing');
                            onVideoComplete(topicId);
                        }
                    } else if (state === 3) {
                        // Buffering - keep previous state
                        console.log('⏳ Video buffering...');
                    }
                }
                
                // Get duration from player (when available)
                if (data.event === 'video-progress' && data.info?.duration) {
                    const duration = Math.round(data.info.duration);
                    if (duration > 0 && !durationLoaded) {
                        console.log(`✅ Duration from YouTube player: ${duration} seconds`);
                        setVideoDuration(duration);
                        setDurationLoaded(true);
                        cacheDuration(videoId, duration);
                        setShowDurationInput(false);
                    }
                }
                
                // Also listen for ready state
                if (data.event === 'onReady') {
                    console.log('📺 YouTube player is ready');
                }
                
            } catch (error) {
                // Ignore non-JSON messages
            }
        };

        // Enhanced iframe click detection for additional play/pause tracking
        const handleIframeInteraction = () => {
            const iframe = iframeRef.current;
            if (!iframe) return;

            // Add click listener for fallback detection
            const handleClick = () => {
                console.log('🖱️ Video iframe clicked - likely play/pause action');
                
                // If postMessage isn't working, estimate state change
                setTimeout(() => {
                    if (!trackingActive) {
                        // Assume play if not currently tracking
                        console.log('🔄 Fallback: Assuming play state');
                        setIsPlaying(true);
                        setTrackingActive(true);
                        startTimeRef.current = Date.now();
                    }
                }, 200);
            };

            iframe.addEventListener('click', handleClick);
            
            return () => {
                iframe.removeEventListener('click', handleClick);
            };
        };

        window.addEventListener('message', handleMessage);
        const cleanupInteraction = handleIframeInteraction();
        
        return () => {
            window.removeEventListener('message', handleMessage);
            if (cleanupInteraction) cleanupInteraction();
        };
    }, [videoId, durationLoaded, isPlaying, isCompleted, topicId, onVideoComplete]);

    // Handle manual duration input
    const handleManualDurationSubmit = () => {
        if (!manualDuration.trim()) return;

        const timeMatch = manualDuration.match(/^(\d+):(\d+)$/);
        if (timeMatch) {
            const minutes = parseInt(timeMatch[1]);
            const seconds = parseInt(timeMatch[2]);
            const totalSeconds = minutes * 60 + seconds;
            
            console.log(`✅ Manual duration entered: ${totalSeconds} seconds`);
            setVideoDuration(totalSeconds);
            setDurationLoaded(true);
            cacheDuration(videoId, totalSeconds);
            setShowDurationInput(false);
            setManualDuration('');
        } else {
            alert('Please enter duration in MM:SS format (e.g., 12:26)');
        }
    };

    // Add quick duration buttons for common lengths
    const quickDurations = [
        { label: '5 min', seconds: 300 },
        { label: '10 min', seconds: 600 },
        { label: '15 min', seconds: 900 },
        { label: '20 min', seconds: 1200 },
        { label: '30 min', seconds: 1800 }
    ];

    const handleQuickDuration = (seconds) => {
        console.log(`✅ Quick duration selected: ${seconds} seconds`);
        setVideoDuration(seconds);
        setDurationLoaded(true);
        cacheDuration(videoId, seconds);
        setShowDurationInput(false);
    };

    // Progress tracking
    useEffect(() => {
        if (isCompleted || !videoDuration) return;

        const trackingInterval = setInterval(() => {
            if (!trackingActive) return;

            const iframe = iframeRef.current;
            if (!iframe) return;

            const rect = iframe.getBoundingClientRect();
            const isVisible = rect.top < window.innerHeight && rect.bottom > 0 && !document.hidden;
            
            if (isVisible && startTimeRef.current) {
                const now = Date.now();
                const timeDiff = (now - startTimeRef.current) / 1000;
                
                if (timeDiff >= 0.8 && timeDiff <= 2) {
                    setActualWatchTime(prev => {
                        const newWatchTime = Math.min(prev + timeDiff, videoDuration);
                        const percentage = Math.round((newWatchTime / videoDuration) * 100);
                        
                        setWatchedPercentage(percentage);
                        onProgressUpdate(topicId, percentage);
                        
                        if (percentage >= 70 && !isCompleted) {
                            console.log(`🎉 Video completed at 70%: ${Math.round(newWatchTime)}s / ${videoDuration}s`);
                            onVideoComplete(topicId);
                        }
                        
                        return newWatchTime;
                    });
                }
                
                startTimeRef.current = now;
            }
        }, 1000);

        intervalRef.current = trackingInterval;
        
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isCompleted, videoDuration, trackingActive, topicId, onProgressUpdate, onVideoComplete]);

    if (!videoId) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600">Invalid YouTube URL</p>
            </div>
        );
    }

    const embedUrl = `https://www.youtube.com/embed/${videoId}?` + 
        new URLSearchParams({
            rel: '0',
            modestbranding: '1',
            controls: '1',
            enablejsapi: '1',
            origin: window.location.origin
        }).toString();

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="space-y-4">
            <div className="relative rounded-lg overflow-hidden shadow-lg" style={{ paddingBottom: '56.25%', height: 0 }}>
                <iframe
                    ref={iframeRef}
                    src={embedUrl}
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute top-0 left-0 w-full h-full"
                />
            </div>
            
            {/* Enhanced manual duration input */}
            {showDurationInput && !durationLoaded && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="space-y-3">
                        <p className="text-sm text-blue-700 font-medium">
                            📏 Help us track your progress! What's this video's duration?
                        </p>
                        
                        {/* Quick duration buttons */}
                        <div>
                            <p className="text-xs text-gray-600 mb-2">Quick select:</p>
                            <div className="flex flex-wrap gap-2">
                                {quickDurations.map((duration) => (
                                    <button
                                        key={duration.seconds}
                                        onClick={() => handleQuickDuration(duration.seconds)}
                                        className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded hover:bg-blue-200"
                                    >
                                        {duration.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        {/* Manual input */}
                        <div>
                            <p className="text-xs text-gray-600 mb-2">Or enter exact duration:</p>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="text"
                                    value={manualDuration}
                                    onChange={(e) => setManualDuration(e.target.value)}
                                    placeholder="12:26"
                                    className="px-3 py-1 border rounded text-sm w-20"
                                    onKeyPress={(e) => e.key === 'Enter' && handleManualDurationSubmit()}
                                />
                                <button
                                    onClick={handleManualDurationSubmit}
                                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                                >
                                    Set
                                </button>
                                <button
                                    onClick={() => setShowDurationInput(false)}
                                    className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
                                >
                                    Skip
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Progress indicator */}
            {isCompleted ? (
                <div className="bg-green-100 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-green-700">
                            Video Progress
                        </span>
                        <span className="text-sm font-medium text-green-600">
                            Completed ✅
                        </span>
                    </div>
                    <div className="w-full bg-green-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full w-full"></div>
                    </div>
                    <p className="text-sm text-green-600 mt-2">
                        Topic completed!
                    </p>
                </div>
            ) : (
                <div className="bg-gray-100 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">
                            Video Progress
                        </span>
                        <span className={`text-sm font-medium ${
                            watchedPercentage >= 70 ? 'text-green-600' : 'text-blue-600'
                        }`}>
                            {watchedPercentage}%
                        </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                                watchedPercentage >= 70 ? 'bg-green-600' : 'bg-blue-600'
                            }`}
                            style={{ width: `${Math.min(watchedPercentage, 100)}%` }}
                        ></div>
                    </div>
                    
                    <div className="mt-3">
                        {watchedPercentage >= 70 ? (
                            <p className="text-sm text-green-600">
                                🎉 Great! You've watched enough to complete this topic.
                            </p>
                        ) : (
                            <div className="space-y-1">
                                <p className="text-sm text-blue-600">
                                    📹 Watch 70% of the video to automatically complete this topic.
                                </p>
                                {videoDuration > 0 ? (
                                    <p className="text-xs text-gray-500">
                                        Progress: {formatTime(actualWatchTime)} / {formatTime(videoDuration)}
                                        {` • Need ${formatTime(Math.max(0, videoDuration * 0.7 - actualWatchTime))} more`}
                                    </p>
                                ) : (
                                    <p className="text-xs text-gray-500">
                                        ⏳ Detecting video duration...
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default VideoPlayer;