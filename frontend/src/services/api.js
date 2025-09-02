import axios from 'axios';

// Backend server configuration - easily replaceable with production URLs
const BACKEND_SERVERS = [
    'https://khub-mqjz.onrender.com/api'
    // 'http://localhost:5000/api'
    // 'http://localhost:5003/api',  
    // 'http://localhost:5004/api',  
    // 'http://localhost:5005/api'   
];

// Load balancing configuration
const LOAD_BALANCER = {
    currentIndex: 0,
    healthStatus: {},
    lastHealthCheck: 0,
    healthCheckInterval: 30000, // 30 seconds
    requestTimeout: 10000, // 10 seconds
    retryAttempts: 2
};

// Enhanced error handling configuration
const ERROR_HANDLING = {
    maxRetries: 3,
    retryDelay: 1000, // 1 second
    circuitBreakerThreshold: 5, // failures before circuit breaker opens
    circuitBreakerTimeout: 60000, // 1 minute before trying again
    emergencyFallback: true
};

// Circuit breaker state for each server
const CIRCUIT_BREAKERS = {};
BACKEND_SERVERS.forEach((url, index) => {
    CIRCUIT_BREAKERS[index] = {
        state: 'CLOSED', // CLOSED, OPEN, HALF_OPEN
        failureCount: 0,
        lastFailureTime: 0,
        nextAttemptTime: 0
    };
});

// Initialize health status for all servers
BACKEND_SERVERS.forEach((url, index) => {
    LOAD_BALANCER.healthStatus[index] = {
        isHealthy: true,
        lastChecked: 0,
        responseTime: 0,
        failCount: 0
    };
});

// Load balancing strategies
const BALANCER_STRATEGIES = {
    ROUND_ROBIN: 'round_robin',
    STICKY_SESSION: 'sticky_session',
    HEALTH_BASED: 'health_based'
};

// Current strategy (can be changed based on needs)
let CURRENT_STRATEGY = BALANCER_STRATEGIES.STICKY_SESSION;

// Get user's assigned server (sticky session)
const getUserAssignedServer = () => {
    let assignedIndex = localStorage.getItem('assigned_server_index');
    
    if (!assignedIndex) {
        // Assign user to a healthy server
        assignedIndex = getHealthyServerIndex();
        localStorage.setItem('assigned_server_index', assignedIndex);
        console.log(`🎯 User assigned to server ${parseInt(assignedIndex) + 1}`);
    }
    
    return parseInt(assignedIndex);
};

// Get next server using round-robin
const getNextServerIndex = () => {
    const healthyServers = getHealthyServers();
    if (healthyServers.length === 0) {
        console.warn('⚠️ No healthy servers found, using server 1');
        return 0;
    }
    
    LOAD_BALANCER.currentIndex = (LOAD_BALANCER.currentIndex + 1) % healthyServers.length;
    return healthyServers[LOAD_BALANCER.currentIndex];
};

// Enhanced get healthy server with fallback
const getHealthyServerIndex = () => {
    const healthyServers = getHealthyServers();
    
    if (healthyServers.length === 0) {
        console.warn('⚠️ No healthy servers found!');
        
        if (ERROR_HANDLING.emergencyFallback) {
            return handleAllServersDown();
        }
        
        return 0; // Last resort
    }
    
    // Return server with best response time and lowest fail count
    return healthyServers.reduce((best, current) => {
        const currentHealth = LOAD_BALANCER.healthStatus[current];
        const bestHealth = LOAD_BALANCER.healthStatus[best];
        
        // Prioritize by fail count, then response time
        if (currentHealth.failCount < bestHealth.failCount) return current;
        if (currentHealth.failCount > bestHealth.failCount) return best;
        
        return currentHealth.responseTime < bestHealth.responseTime ? current : best;
    });
};

// Get list of healthy servers
const getHealthyServers = () => {
    return Object.keys(LOAD_BALANCER.healthStatus)
        .map(Number)
        .filter(index => LOAD_BALANCER.healthStatus[index].isHealthy);
};

// Enhanced health check with circuit breaker logic
const checkServerHealth = async (serverIndex) => {
    const serverUrl = BACKEND_SERVERS[serverIndex];
    const circuitBreaker = CIRCUIT_BREAKERS[serverIndex];
    const startTime = Date.now();
    
    // Check circuit breaker state
    if (circuitBreaker.state === 'OPEN') {
        if (Date.now() < circuitBreaker.nextAttemptTime) {
            console.log(`⚡ Server ${serverIndex + 1} circuit breaker OPEN - skipping health check`);
            return false;
        } else {
            // Try to transition to HALF_OPEN
            circuitBreaker.state = 'HALF_OPEN';
            console.log(`🔄 Server ${serverIndex + 1} circuit breaker transitioning to HALF_OPEN`);
        }
    }
    
    try {
        const response = await axios.get(`${serverUrl.replace('/api', '')}/api/health`, {
            timeout: LOAD_BALANCER.requestTimeout
        });
        
        const responseTime = Date.now() - startTime;
        
        // Success - reset circuit breaker
        if (circuitBreaker.state === 'HALF_OPEN') {
            circuitBreaker.state = 'CLOSED';
            console.log(`✅ Server ${serverIndex + 1} circuit breaker CLOSED - server recovered`);
        }
        circuitBreaker.failureCount = 0;
        
        LOAD_BALANCER.healthStatus[serverIndex] = {
            isHealthy: response.status === 200,
            lastChecked: Date.now(),
            responseTime,
            failCount: 0,
            error: null
        };
        
        console.log(`✅ Server ${serverIndex + 1} healthy (${responseTime}ms)`);
        return true;
        
    } catch (error) {
        const errorInfo = {
            message: error.message,
            code: error.code,
            status: error.response?.status,
            timestamp: Date.now()
        };
        
        // Update circuit breaker
        circuitBreaker.failureCount++;
        circuitBreaker.lastFailureTime = Date.now();
        
        if (circuitBreaker.failureCount >= ERROR_HANDLING.circuitBreakerThreshold) {
            circuitBreaker.state = 'OPEN';
            circuitBreaker.nextAttemptTime = Date.now() + ERROR_HANDLING.circuitBreakerTimeout;
            console.log(`🚨 Server ${serverIndex + 1} circuit breaker OPEN - too many failures`);
        }
        
        LOAD_BALANCER.healthStatus[serverIndex].failCount++;
        LOAD_BALANCER.healthStatus[serverIndex].isHealthy = 
            LOAD_BALANCER.healthStatus[serverIndex].failCount < 3;
        LOAD_BALANCER.healthStatus[serverIndex].error = errorInfo;
        
        console.log(`❌ Server ${serverIndex + 1} unhealthy (${error.message})`);
        return false;
    }
};

// Check health of all servers
const performHealthCheck = async () => {
    const now = Date.now();
    if (now - LOAD_BALANCER.lastHealthCheck < LOAD_BALANCER.healthCheckInterval) {
        return;
    }
    
    console.log('🔍 Performing health check on all servers...');
    LOAD_BALANCER.lastHealthCheck = now;
    
    const healthPromises = BACKEND_SERVERS.map((_, index) => checkServerHealth(index));
    await Promise.allSettled(healthPromises);
    
    const healthyCount = getHealthyServers().length;
    console.log(`📊 Health check complete: ${healthyCount}/${BACKEND_SERVERS.length} servers healthy`);
};

// Get appropriate server based on strategy
const getServerUrl = async () => {
    // Perform health check if needed
    await performHealthCheck();
    
    let serverIndex;
    
    switch (CURRENT_STRATEGY) {
        case BALANCER_STRATEGIES.STICKY_SESSION:
            serverIndex = getUserAssignedServer();
            // Fallback to healthy server if assigned server is down
            if (!LOAD_BALANCER.healthStatus[serverIndex].isHealthy) {
                serverIndex = getHealthyServerIndex();
                localStorage.setItem('assigned_server_index', serverIndex);
                console.log(`🔄 Reassigned user to server ${serverIndex + 1}`);
            }
            break;
            
        case BALANCER_STRATEGIES.ROUND_ROBIN:
            serverIndex = getNextServerIndex();
            break;
            
        case BALANCER_STRATEGIES.HEALTH_BASED:
            serverIndex = getHealthyServerIndex();
            break;
            
        default:
            serverIndex = 0;
    }
    
    return BACKEND_SERVERS[serverIndex];
};

// Enhanced retry logic with exponential backoff
const retryRequest = async (requestFn, maxRetries = ERROR_HANDLING.maxRetries) => {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await requestFn();
        } catch (error) {
            lastError = error;
            
            console.log(`🔄 Request attempt ${attempt}/${maxRetries} failed: ${error.message}`);
            
            if (attempt < maxRetries) {
                // Exponential backoff: 1s, 2s, 4s...
                const delay = ERROR_HANDLING.retryDelay * Math.pow(2, attempt - 1);
                console.log(`⏰ Waiting ${delay}ms before retry...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    
    throw lastError;
};

// Emergency fallback when all servers are down
const handleAllServersDown = () => {
    console.error('🚨 CRITICAL: All servers are down!');
    
    // Try to recover by resetting circuit breakers
    Object.keys(CIRCUIT_BREAKERS).forEach(index => {
        CIRCUIT_BREAKERS[index] = {
            state: 'CLOSED',
            failureCount: 0,
            lastFailureTime: 0,
            nextAttemptTime: 0
        };
        LOAD_BALANCER.healthStatus[index].isHealthy = true;
        LOAD_BALANCER.healthStatus[index].failCount = 0;
    });
    
    // Show user notification
    if (window.showEmergencyNotification) {
        window.showEmergencyNotification(
            'Connection Issues', 
            'Experiencing server connectivity issues. Attempting to reconnect...'
        );
    }
    
    // Force immediate health check
    performHealthCheck();
    
    return 0; // Return first server as last resort
};

// Create axios instance with load balancing
const createApiInstance = async () => {
    const baseURL = await getServerUrl();
    
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
    
    // Handle responses and retries
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
            
            // Handle server errors with retry
            if (error.code === 'ECONNABORTED' || error.response?.status >= 500) {
                console.log(`🔄 Server error, attempting retry...`);
                
                // Mark current server as potentially unhealthy
                const currentUrl = error.config.baseURL;
                const serverIndex = BACKEND_SERVERS.indexOf(currentUrl);
                if (serverIndex !== -1) {
                    LOAD_BALANCER.healthStatus[serverIndex].failCount++;
                }
                
                // Try with a different server
                const retryUrl = await getServerUrl();
                if (retryUrl !== currentUrl) {
                    error.config.baseURL = retryUrl;
                    return retryRequest(() => instance.request(error.config));
                }
            }
            
            return Promise.reject(error);
        }
    );
    
    return instance;
};

// Main API instance - created dynamically
const api = {
    async request(config) {
        const instance = await createApiInstance();
        return instance.request(config);
    },
    
    async get(url, config = {}) {
        const instance = await createApiInstance();
        return instance.get(url, config);
    },
    
    async post(url, data, config = {}) {
        const instance = await createApiInstance();
        return instance.post(url, data, config);
    },
    
    async put(url, data, config = {}) {
        const instance = await createApiInstance();
        return instance.put(url, data, config);
    },
    
    async delete(url, config = {}) {
        const instance = await createApiInstance();
        return instance.delete(url, config);
    }
};

// Utility functions for monitoring
export const loadBalancerStats = {
    getHealthStatus: () => LOAD_BALANCER.healthStatus,
    getServerUrls: () => BACKEND_SERVERS,
    getCurrentStrategy: () => CURRENT_STRATEGY,
    getAssignedServer: () => {
        const index = getUserAssignedServer();
        return BACKEND_SERVERS[index];
    },
    forceHealthCheck: () => performHealthCheck(),
    switchStrategy: (strategy) => {
        if (Object.values(BALANCER_STRATEGIES).includes(strategy)) {
            CURRENT_STRATEGY = strategy;
            console.log(`🔄 Load balancer strategy changed to: ${strategy}`);
        }
    },
    reassignUser: () => {
        localStorage.removeItem('assigned_server_index');
        const newIndex = getHealthyServerIndex();
        localStorage.setItem('assigned_server_index', newIndex);
        console.log(`🎯 User reassigned to server ${newIndex + 1}`);
    }
};

// Initialize with health check
performHealthCheck();

// Set up periodic health checks
setInterval(performHealthCheck, LOAD_BALANCER.healthCheckInterval);

export default api;

