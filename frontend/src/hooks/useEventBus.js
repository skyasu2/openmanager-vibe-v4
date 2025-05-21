import { useEffect } from 'react';
import EventBus from '../services/EventBus';

/**
 * Custom hook to subscribe to EventBus events
 * @param {string} event - Event name to subscribe to
 * @param {function} callback - Callback function to be called when event is published
 */
const useEventBus = (event, callback) => {
  useEffect(() => {
    // Subscribe to event
    const unsubscribe = EventBus.subscribe(event, callback);
    
    // Cleanup subscription on component unmount
    return () => {
      unsubscribe();
    };
  }, [event, callback]);
};

export default useEventBus; 