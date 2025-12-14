import axios from 'axios';

// Backend server configuration - easily replaceable with production URLs
const BACKEND_SERVERS = [
    'https://k-hub-ug2s.onrender.com/api'
    // 'http://localhost:5000/api'
    // 'http://localhost:5001/api',  
    // 'http://localhost:5002/api',  
    // 'http://localhost:5003/api',
    // 'http://localhost:5004/api'   
];

// Load balancing configuration
const LOAD_BALANCER = {
    currentIndex: 0,
    requestTimeout: 10000, // 10 seconds
    retryAttempts: 2
};

// Load balancing strategies
const BALANCER_STRATEGIES = {
    ROUND_ROBIN: 'round_robin',
    STICKY_SESSION: 'sticky_session'
};

// Current strategy
let CURRENT_STRATEGY = BALANCER_STRATEGIES.STICKY_SESSION;

// Get user's assigned server (sticky session)
const getUserAssignedServer = () => {
    let assignedIndex = localStorage.getItem('assigned_server_index');
    
    if (!assignedIndex || assignedIndex >= BACKEND_SERVERS.length) {
        // Assign user to a random server for better distribution
        assignedIndex = Math.floor(Math.random() * BACKEND_SERVERS.length);
        localStorage.setItem('assigned_server_index', assignedIndex);
        console.log(`🎯 User assigned to server ${parseInt(assignedIndex) + 1}`);
    }
    
    return parseInt(assignedIndex);
};

// Get next server using round-robin
const getNextServerIndex = () => {
    const serverIndex = LOAD_BALANCER.currentIndex;
    LOAD_BALANCER.currentIndex = (LOAD_BALANCER.currentIndex + 1) % BACKEND_SERVERS.length;
    return serverIndex;
};

// Get server URL based on strategy
const getServerUrl = () => {
    let serverIndex;
    
    switch (CURRENT_STRATEGY) {
        case BALANCER_STRATEGIES.STICKY_SESSION:
            serverIndex = getUserAssignedServer();
            break;
            
        case BALANCER_STRATEGIES.ROUND_ROBIN:
            serverIndex = getNextServerIndex();
            break;
            
        default:
            serverIndex = 0;
    }
    
    return BACKEND_SERVERS[serverIndex];
};

// Create axios instance with load balancing
const createApiInstance = () => {
    const baseURL = getServerUrl();
    
    const instance = axios.create({
        baseURL,
        timeout: LOAD_BALANCER.requestTimeout,
        headers: {
            'Content-Type': 'application/json',
        },
    });
    
    // Add auth token to requests
    instance.interceptors.request.use(
        (config) => {
            const token = localStorage.getItem('token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        },
        (error) => {
            return Promise.reject(error);
        }
    );
    
    // Handle responses and basic retry
    instance.interceptors.response.use(
        (response) => response,
        async (error) => {
            // Handle auth errors
            if (error.response?.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return Promise.reject(error);
            }
            
            // Basic retry with different server on failure
            if (error.code === 'ECONNABORTED' || error.response?.status >= 500) {
                console.log(`🔄 Server error, trying different server...`);
                
                // Try a different server if using sticky session
                if (CURRENT_STRATEGY === BALANCER_STRATEGIES.STICKY_SESSION && BACKEND_SERVERS.length > 1) {
                    const currentIndex = getUserAssignedServer();
                    const nextIndex = (currentIndex + 1) % BACKEND_SERVERS.length;
                    localStorage.setItem('assigned_server_index', nextIndex);
                    
                    // Retry with new server
                    error.config.baseURL = BACKEND_SERVERS[nextIndex];
                    return instance.request(error.config);
                }
            }
            
            return Promise.reject(error);
        }
    );
    
    return instance;
};

// Main API instance
const api = {
    get(url, config = {}) {
        const instance = createApiInstance();
        return instance.get(url, config);
    },
    
    post(url, data, config = {}) {
        const instance = createApiInstance();
        return instance.post(url, data, config);
    },
    
    put(url, data, config = {}) {
        const instance = createApiInstance();
        return instance.put(url, data, config);
    },
    
    delete(url, config = {}) {
        const instance = createApiInstance();
        return instance.delete(url, config);
    }
};

// Utility functions for monitoring (simplified)
export const loadBalancerStats = {
    getServerUrls: () => BACKEND_SERVERS,
    getCurrentStrategy: () => CURRENT_STRATEGY,
    getAssignedServer: () => {
        const index = getUserAssignedServer();
        return BACKEND_SERVERS[index];
    },
    switchStrategy: (strategy) => {
        if (Object.values(BALANCER_STRATEGIES).includes(strategy)) {
            CURRENT_STRATEGY = strategy;
            console.log(`🔄 Load balancer strategy changed to: ${strategy}`);
        }
    },
    reassignUser: () => {
        const newIndex = Math.floor(Math.random() * BACKEND_SERVERS.length);
        localStorage.setItem('assigned_server_index', newIndex);
        console.log(`🎯 User reassigned to server ${newIndex + 1}`);
    }
};

export default api;


