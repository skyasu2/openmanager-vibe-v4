import React, { createContext, useContext, useReducer, useEffect } from 'react';
import EventBus from '../services/EventBus';
import ServerDataService from '../services/ServerDataService';

// 초기 상태
const initialState = {
  servers: [],
  selectedServer: null,
  filterStatus: 'all',
  loading: false,
  error: null,
  aiResponse: null,
  darkMode: localStorage.getItem('darkMode') === 'true'
};

// 액션 타입
const actions = {
  SET_SERVERS: 'SET_SERVERS',
  SELECT_SERVER: 'SELECT_SERVER',
  SET_FILTER: 'SET_FILTER',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_AI_RESPONSE: 'SET_AI_RESPONSE',
  TOGGLE_DARK_MODE: 'TOGGLE_DARK_MODE'
};

// 리듀서 함수
const appReducer = (state, action) => {
  switch (action.type) {
    case actions.SET_SERVERS:
      return { ...state, servers: action.payload, loading: false };
    case actions.SELECT_SERVER:
      return { ...state, selectedServer: action.payload };
    case actions.SET_FILTER:
      return { ...state, filterStatus: action.payload };
    case actions.SET_LOADING:
      return { ...state, loading: action.payload };
    case actions.SET_ERROR:
      return { ...state, error: action.payload, loading: false };
    case actions.SET_AI_RESPONSE:
      return { ...state, aiResponse: action.payload };
    case actions.TOGGLE_DARK_MODE:
      const newDarkMode = !state.darkMode;
      localStorage.setItem('darkMode', newDarkMode);
      return { ...state, darkMode: newDarkMode };
    default:
      return state;
  }
};

// Context 생성
const AppContext = createContext();

// Context Provider 컴포넌트
export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  
  // EventBus와 Context 상태 동기화
  useEffect(() => {
    // 서버 선택 이벤트 구독
    const serverSelectedUnsubscribe = EventBus.subscribe(
      'server:selected', 
      (server) => {
        dispatch({ type: actions.SELECT_SERVER, payload: server });
      }
    );
    
    // AI 응답 이벤트 구독
    const aiResponseUnsubscribe = EventBus.subscribe(
      'ai:response-received',
      (response) => {
        dispatch({ type: actions.SET_AI_RESPONSE, payload: response });
      }
    );
    
    // 오류 이벤트 구독
    const errorUnsubscribe = EventBus.subscribe(
      'error',
      (errorData) => {
        dispatch({ type: actions.SET_ERROR, payload: errorData.message });
      }
    );
    
    // 필터 변경 이벤트 발행 함수
    function handleFilterChange(filterData) {
      dispatch({ type: actions.SET_FILTER, payload: filterData.status });
    }
    
    // 필터 변경 이벤트 구독
    const filterChangedUnsubscribe = EventBus.subscribe(
      'filter:changed',
      handleFilterChange
    );
    
    // 서버 데이터 로드
    loadServerData();
    
    // 주기적 데이터 갱신 설정
    const intervalId = setInterval(() => {
      loadServerData();
    }, 30000);
    
    // 클린업 함수
    return () => {
      serverSelectedUnsubscribe();
      aiResponseUnsubscribe();
      errorUnsubscribe();
      filterChangedUnsubscribe();
      clearInterval(intervalId);
    };
  }, []);
  
  // 서버 데이터 로드 함수
  const loadServerData = async () => {
    try {
      dispatch({ type: actions.SET_LOADING, payload: true });
      const data = await ServerDataService.getServers();
      dispatch({ type: actions.SET_SERVERS, payload: data });
      
      // 이벤트 발행
      EventBus.publish('servers:data-updated', data);
    } catch (err) {
      dispatch({ 
        type: actions.SET_ERROR, 
        payload: 'Failed to load server data' 
      });
      
      // 이벤트 발행
      EventBus.publish('error', {
        source: 'app-context',
        message: 'Failed to load server data',
        details: err.message
      });
    }
  };
  
  // 필터 변경 함수
  const changeFilterStatus = (status) => {
    dispatch({ type: actions.SET_FILTER, payload: status });
    
    // 이벤트 발행
    EventBus.publish('filter:changed', { status });
  };
  
  // 서버 선택 함수
  const selectServer = (server) => {
    dispatch({ type: actions.SELECT_SERVER, payload: server });
    
    // 이벤트 발행
    EventBus.publish('server:selected', server);
    EventBus.publish('context:updated', {
      selectedServer: server
    });
  };
  
  // 다크 모드 토글 함수
  const toggleDarkMode = () => {
    dispatch({ type: actions.TOGGLE_DARK_MODE });
  };
  
  // 컨텍스트 값
  const contextValue = {
    ...state,
    dispatch,
    actions,
    loadServerData,
    changeFilterStatus,
    selectServer,
    toggleDarkMode
  };
  
  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

// 커스텀 Hook
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}; 