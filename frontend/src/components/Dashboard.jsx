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
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // Display error message
  if (error && servers.length === 0) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-md">
        <p className="font-bold">오류</p>
        <p>{error}</p>
      </div>
    );
  }
  
  return (
    <div className="dashboard">
      {/* Status summary section */}
      <StatusSummary servers={servers} />
      
      {/* Filter buttons */}
      <div className="filter-buttons flex flex-wrap space-x-2 my-4">
        <button 
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            filterStatus === 'all' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          onClick={() => changeFilterStatus('all')}
        >
          전체
        </button>
        <button 
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            filterStatus === 'normal' 
              ? 'bg-green-500 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          onClick={() => changeFilterStatus('normal')}
        >
          정상
        </button>
        <button 
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            filterStatus === 'warning' 
              ? 'bg-yellow-500 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          onClick={() => changeFilterStatus('warning')}
        >
          경고
        </button>
        <button 
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            filterStatus === 'critical' 
              ? 'bg-red-500 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          onClick={() => changeFilterStatus('critical')}
        >
          심각
        </button>
      </div>
      
      {/* Server list */}
      <div className="server-list grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        {getFilteredServers().map(server => (
          <ServerCard 
            key={server.id}
            server={server}
            isSelected={selectedServer && selectedServer.id === server.id}
            onSelect={() => handleServerSelection(server)}
          />
        ))}
      </div>
      
      {/* Empty state when no servers match filter */}
      {getFilteredServers().length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg mt-4">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">일치하는 서버가 없습니다</h3>
          <p className="mt-1 text-sm text-gray-500">다른 필터를 선택하여 서버를 확인하세요.</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 