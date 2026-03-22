import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import socketService from '../services/socketService';

/**
 * useRealtimeSync — Custom hook for module-specific real-time UI updates.
 * 
 * @param {string} module - Module name (e.g., 'products', 'orders')
 * @param {function} actionCreator - Redux action to dispatch (e.g., productSnapshot)
 */
const useRealtimeSync = (module, actionCreator) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const orgId = user?.organization?._id || user?.organization;

  useEffect(() => {
    if (!orgId || !socketService.isConnected) return;

    // Subscribe to module-specific data changes
    const unsubscribe = socketService.subscribeToDataChanges(module, (payload) => {
      console.log(`[Realtime] ${module} update received:`, payload);
      if (actionCreator) {
        dispatch(actionCreator(payload));
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [module, actionCreator, orgId, dispatch]);

  return null;
};

export default useRealtimeSync;
