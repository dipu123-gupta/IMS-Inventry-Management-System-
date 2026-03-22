import { io } from 'socket.io-client';
import config from '../config/api';

const SOCKET_URL = config.SOCKET_URL;


class SocketService {
  constructor() {
    this.socket = null;
    this.statusListeners = [];
    this.isConnected = false;
    this.orgId = null;
  }

  connect(userId, orgId = null) {
    if (this.socket) {
      if (orgId && orgId !== this.orgId) {
        this.joinOrg(orgId);
      }
      return this.socket;
    }

    this.orgId = orgId;
    this.socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('Connected to socket server');
      this.isConnected = true;
      this._notifyStatusChange('connected');
      
      if (userId) {
        this.socket.emit('join', userId);
      }
      
      if (this.orgId) {
        this.socket.emit('join:org', this.orgId);
      }
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from socket server');
      this.isConnected = false;
      this._notifyStatusChange('disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.isConnected = false;
      this._notifyStatusChange('error');
    });

    return this.socket;
  }

  joinOrg(orgId) {
    if (this.socket && orgId) {
      this.orgId = orgId;
      this.socket.emit('join:org', orgId);
    }
  }

  onStatusChange(callback) {
    this.statusListeners.push(callback);
    callback(this.isConnected ? 'connected' : 'disconnected');
    return () => {
      this.statusListeners = this.statusListeners.filter(l => l !== callback);
    };
  }

  _notifyStatusChange(status) {
    this.statusListeners.forEach(callback => callback(status));
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.orgId = null;
      this._notifyStatusChange('disconnected');
    }
  }

  /**
   * Universal data change subscriber
   * @param {string} module - 'products', 'orders', 'inventory', etc.
   * @param {function} callback - (payload) => ...
   */
  subscribeToDataChanges(module, callback) {
    if (!this.socket) return () => {};
    const eventName = `data:${module}`;
    this.socket.on(eventName, callback);
    return () => this.socket.off(eventName, callback);
  }

  /**
   * Specifically for dashboard stats refresh
   */
  onDashboardUpdate(callback) {
    if (!this.socket) return () => {};
    this.socket.on('data:dashboard', callback);
    return () => this.socket.off('data:dashboard', callback);
  }

  subscribeToNotifications(callback) {
    if (!this.socket) return () => {};
    this.socket.on('notification', callback);
    return () => this.socket.off('notification', callback);
  }

  unsubscribeFromNotifications() {
    if (!this.socket) return;
    this.socket.off('notification');
  }
}

const socketService = new SocketService();
export default socketService;
