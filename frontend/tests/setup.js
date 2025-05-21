import '@testing-library/jest-dom';

// 전역 모의 객체 설정
global.window = window;
global.document = document;

// EventBus를 위한 가상 구현
jest.mock('../services/EventBus.js', () => ({
  listeners: {},
  subscribe: jest.fn((event, callback) => {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    return () => this.unsubscribe(event, callback);
  }),
  unsubscribe: jest.fn((event, callback) => {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event]
        .filter(listener => listener !== callback);
    }
  }),
  publish: jest.fn((event, data) => {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  })
})); 