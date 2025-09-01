import React, { useState, useEffect } from 'react';
import { loadBalancerStats } from '../services/api';

const LoadBalancerDashboard = () => {
    const [healthStatus, setHealthStatus] = useState({});
    const [serverUrls, setServerUrls] = useState([]);
    const [currentStrategy, setCurrentStrategy] = useState('');
    const [assignedServer, setAssignedServer] = useState('');
    const [isVisible, setIsVisible] = useState(false);
    const [criticalAlerts, setCriticalAlerts] = useState([]);

    useEffect(() => {
        updateStats();
        const interval = setInterval(updateStats, 5000); // Update every 5 seconds for better monitoring
        return () => clearInterval(interval);
    }, []);

    const updateStats = () => {
        const health = loadBalancerStats.getHealthStatus();
        setHealthStatus(health);
        setServerUrls(loadBalancerStats.getServerUrls());
        setCurrentStrategy(loadBalancerStats.getCurrentStrategy());
        setAssignedServer(loadBalancerStats.getAssignedServer());
        
        // Check for critical issues
        checkForCriticalAlerts(health);
    };

    const checkForCriticalAlerts = (healthStatus) => {
        const alerts = [];
        const healthyCount = Object.values(healthStatus).filter(s => s.isHealthy).length;
        
        if (healthyCount === 0) {
            alerts.push({ type: 'critical', message: '🚨 ALL SERVERS DOWN!' });
        } else if (healthyCount <= 1) {
            alerts.push({ type: 'warning', message: '⚠️ Only 1 server remaining!' });
        } else if (healthyCount <= 2) {
            alerts.push({ type: 'caution', message: '⚡ Limited servers available' });
        }
        
        setCriticalAlerts(alerts);
    };

    const handleForceHealthCheck = () => {
        loadBalancerStats.forceHealthCheck();
        setTimeout(updateStats, 2000);
    };

    const handleReassignUser = () => {
        loadBalancerStats.reassignUser();
        updateStats();
    };

    const getStatusColor = (isHealthy, failCount, error) => {
        if (error && error.code === 'ECONNABORTED') return 'bg-orange-500'; // Timeout
        if (!isHealthy) return 'bg-red-500'; // Down
        if (failCount > 0) return 'bg-yellow-500'; // Warning
        return 'bg-green-500'; // Healthy
    };

    const getStatusText = (isHealthy, failCount, error) => {
        if (error) {
            if (error.code === 'ECONNABORTED') return 'Timeout';
            if (error.code === 'ECONNREFUSED') return 'Connection Refused';
            if (error.status >= 500) return 'Server Error';
            return 'Error';
        }
        if (!isHealthy) return 'Down';
        if (failCount > 0) return 'Unstable';
        return 'Healthy';
    };

    const getCircuitBreakerState = (serverIndex) => {
        // This would need to be exposed from the API service
        // For now, we'll infer from fail count
        const status = healthStatus[serverIndex];
        if (!status) return 'UNKNOWN';
        
        if (status.failCount >= 5) return 'OPEN';
        if (status.failCount > 0) return 'HALF_OPEN';
        return 'CLOSED';
    };

    const formatLastError = (error) => {
        if (!error) return null;
        
        const timeAgo = Math.round((Date.now() - error.timestamp) / 1000);
        return `${error.message} (${timeAgo}s ago)`;
    };

    if (!isVisible) {
        return (
            <div className="fixed bottom-4 right-4 z-50">
                {criticalAlerts.length > 0 && (
                    <div className="mb-2 p-2 bg-red-600 text-white rounded-lg shadow-lg animate-pulse">
                        {criticalAlerts[0].message}
                    </div>
                )}
                <button
                    onClick={() => setIsVisible(true)}
                    className={`px-4 py-2 rounded-lg shadow-lg hover:opacity-90 transition-all ${
                        criticalAlerts.some(a => a.type === 'critical') 
                            ? 'bg-red-600 text-white animate-pulse' 
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                >
                    📊 Load Balancer Stats
                    {criticalAlerts.length > 0 && (
                        <span className="ml-2 bg-white text-red-600 px-2 py-1 rounded-full text-xs font-bold">
                            {criticalAlerts.length}
                        </span>
                    )}
                </button>
            </div>
        );
    }

    return (
        <div className="fixed top-4 right-4 bg-white rounded-lg shadow-xl p-6 max-w-lg z-50 border max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Load Balancer Dashboard</h3>
                <button
                    onClick={() => setIsVisible(false)}
                    className="text-gray-400 hover:text-gray-600"
                >
                    ✕
                </button>
            </div>

            {/* Critical Alerts */}
            {criticalAlerts.length > 0 && (
                <div className="mb-4 space-y-2">
                    {criticalAlerts.map((alert, index) => (
                        <div 
                            key={index}
                            className={`p-3 rounded text-white font-medium ${
                                alert.type === 'critical' ? 'bg-red-600' :
                                alert.type === 'warning' ? 'bg-orange-600' :
                                'bg-yellow-600'
                            }`}
                        >
                            {alert.message}
                        </div>
                    ))}
                </div>
            )}

            {/* Strategy Info */}
            <div className="mb-4 p-3 bg-gray-50 rounded">
                <div className="text-sm text-gray-600">Current Strategy:</div>
                <div className="font-medium text-blue-600">{currentStrategy}</div>
                <div className="text-sm text-gray-600 mt-1">Assigned Server:</div>
                <div className="font-medium text-green-600 text-xs">{assignedServer}</div>
            </div>

            {/* Server Status */}
            <div className="space-y-3 mb-4">
                <div className="text-sm font-medium text-gray-700">Server Status:</div>
                {serverUrls.map((url, index) => {
                    const status = healthStatus[index] || {};
                    const isAssigned = assignedServer === url;
                    const circuitState = getCircuitBreakerState(index);
                    
                    return (
                        <div 
                            key={index} 
                            className={`p-3 rounded border ${
                                isAssigned ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
                            }`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                    <div 
                                        className={`w-3 h-3 rounded-full ${getStatusColor(status.isHealthy, status.failCount, status.error)}`}
                                    />
                                    <div>
                                        <div className="text-sm font-medium">Server {index + 1}</div>
                                        <div className="text-xs text-gray-500">
                                            {url.replace('http://localhost:', ':').replace('/api', '')}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs font-medium">
                                        {getStatusText(status.isHealthy, status.failCount, status.error)}
                                    </div>
                                    {status.responseTime > 0 && (
                                        <div className="text-xs text-gray-500">
                                            {status.responseTime}ms
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {/* Additional Status Info */}
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                    <span className="text-gray-500">Circuit:</span>
                                    <span className={`ml-1 font-medium ${
                                        circuitState === 'OPEN' ? 'text-red-600' :
                                        circuitState === 'HALF_OPEN' ? 'text-yellow-600' :
                                        'text-green-600'
                                    }`}>
                                        {circuitState}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-500">Fails:</span>
                                    <span className="ml-1 font-medium text-red-600">
                                        {status.failCount || 0}
                                    </span>
                                </div>
                            </div>
                            
                            {/* Last Error */}
                            {status.error && (
                                <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-700">
                                    <div className="font-medium">Last Error:</div>
                                    <div>{formatLastError(status.error)}</div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Actions */}
            <div className="space-y-2">
                <button
                    onClick={handleForceHealthCheck}
                    className="w-full px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                    🔍 Force Health Check
                </button>
                <button
                    onClick={handleReassignUser}
                    className="w-full px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                >
                    🎯 Reassign to Best Server
                </button>
                <button
                    onClick={updateStats}
                    className="w-full px-3 py-2 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                >
                    🔄 Refresh Stats
                </button>
            </div>

            {/* Summary */}
            <div className="mt-4 pt-3 border-t text-xs text-gray-500">
                <div>Healthy Servers: {Object.values(healthStatus).filter(s => s.isHealthy).length}/{serverUrls.length}</div>
                <div>Last Check: {Math.max(...Object.values(healthStatus).map(s => s.lastChecked || 0)) > 0 ? 
                    new Date(Math.max(...Object.values(healthStatus).map(s => s.lastChecked || 0))).toLocaleTimeString() : 'Never'}</div>
                <div className="mt-1 text-blue-600">Auto-refresh: 5s intervals</div>
            </div>
        </div>
    );
};

export default LoadBalancerDashboard;