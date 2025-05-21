import React, { useState, useEffect } from 'react';
import EventBus from '../services/EventBus';
import ServerDataService from '../services/ServerDataService';
import ServerCard from './ServerCard';
import StatusSummary from './StatusSummary';

const Dashboard = () => {
  const [servers, setServers] = useState([]);
  const [selectedServer, setSelectedServer] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load server data on component mount
  useEffect(() => {
    loadServerData();
    
    // Setup refresh interval
    const intervalId = setInterval(() => {
      loadServerData();
    }, 30000);
    
    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, []);
  
  // Subscribe to events
  useEffect(() => {
    // Server selection event
    const serverSelectedUnsubscribe = EventBus.subscribe(
      'server:selected', 
      handleServerSelection
    );
    
    // AI response event
    const aiResponseUnsubscribe = EventBus.subscribe(
      'ai:response-received',
      handleAIResponse
    );
    
    // Cleanup subscriptions on unmount
    return () => {
      serverSelectedUnsubscribe();
      aiResponseUnsubscribe();
    };
  }, []);
  
  // Load server data from service
  const loadServerData = async () => {
    try {
      setLoading(true);
      const data = await ServerDataService.getServers();
      setServers(data);
      
      // Publish data update event
      EventBus.publish('servers:data-updated', data);
    } catch (err) {
      setError('Failed to load server data');
      
      // Publish error event
      EventBus.publish('error', {
        source: 'dashboard',
        message: 'Failed to load server data',
        details: err.message
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Handle server selection
  const handleServerSelection = (server) => {
    setSelectedServer(server);
    
    // Publish context update event
    EventBus.publish('context:updated', {
      selectedServer: server
    });
  };
  
  // Handle AI response
  const handleAIResponse = (response) => {
    // Handle AI response, e.g. highlight related servers
    if (response.related_servers && response.related_servers.length > 0) {
      highlightRelatedServers(response.related_servers);
    }
  };
  
  // Filter servers based on status
  const getFilteredServers = () => {
    if (filterStatus === 'all') {
      return servers;
    }
    return servers.filter(server => server.status === filterStatus);
  };
  
  // Change filter status
  const changeFilterStatus = (status) => {
    setFilterStatus(status);
    
    // Publish filter changed event
    EventBus.publish('filter:changed', { status });
  };
  
  // Highlight related servers (implementation detail)
  const highlightRelatedServers = (serverIds) => {
    // In React this would typically be handled through state
    console.log('Highlighting servers:', serverIds);
  };
  
  // Display loading indicator
  if (loading && servers.length === 0) {
    return <div className="loading">Loading server data...</div>;
  }
  
  // Display error message
  if (error && servers.length === 0) {
    return <div className="error">{error}</div>;
  }
  
  return (
    <div className="dashboard">
      {/* Status summary section */}
      <StatusSummary servers={servers} />
      
      {/* Filter buttons */}
      <div className="filter-buttons">
        <button 
          className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
          onClick={() => changeFilterStatus('all')}
        >
          All
        </button>
        <button 
          className={`filter-btn ${filterStatus === 'normal' ? 'active' : ''}`}
          onClick={() => changeFilterStatus('normal')}
        >
          Normal
        </button>
        <button 
          className={`filter-btn ${filterStatus === 'warning' ? 'active' : ''}`}
          onClick={() => changeFilterStatus('warning')}
        >
          Warning
        </button>
        <button 
          className={`filter-btn ${filterStatus === 'critical' ? 'active' : ''}`}
          onClick={() => changeFilterStatus('critical')}
        >
          Critical
        </button>
      </div>
      
      {/* Server list */}
      <div className="server-list">
        {getFilteredServers().map(server => (
          <ServerCard 
            key={server.id}
            server={server}
            isSelected={selectedServer && selectedServer.id === server.id}
            onSelect={() => handleServerSelection(server)}
          />
        ))}
      </div>
      
      {/* Server detail section - shown when server is selected */}
      {selectedServer && (
        <div className="server-details">
          <h2>{selectedServer.hostname}</h2>
          {/* More detail content would go here */}
        </div>
      )}
    </div>
  );
};

export default Dashboard; 