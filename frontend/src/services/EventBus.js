/**
 * 이벤트 버스 - 컴포넌트 간 통신을 위한 발행/구독 패턴 구현
 */
class EventBus {
  constructor() {
    this.subscribers = {};
  }

  // 이벤트 발행 (이벤트 이름과 데이터 전달)
  publish(eventName, data) {
    if (!this.subscribers[eventName]) {
      return;
    }

    this.subscribers[eventName].forEach(callback => {
      callback(data);
    });
  }

  // 이벤트 구독 (이벤트 이름과 콜백 함수 등록)
  subscribe(eventName, callback) {
    if (!this.subscribers[eventName]) {
      this.subscribers[eventName] = [];
    }

    this.subscribers[eventName].push(callback);

    // 구독 해제 함수 반환
    return () => {
      this.unsubscribe(eventName, callback);
    };
  }

  // 이벤트 구독 해제
  unsubscribe(eventName, callback) {
    if (!this.subscribers[eventName]) {
      return;
    }

    this.subscribers[eventName] = this.subscribers[eventName].filter(
      cb => cb !== callback
    );
  }

  // 모든 구독 해제
  clearAll() {
    this.subscribers = {};
  }
}

// 싱글톤 인스턴스 생성하여 내보내기
export default new EventBus(); 