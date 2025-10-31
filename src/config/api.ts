// API Configuration per GameCall

// Backend API URL (Fly.io)
export const API_BASE_URL = 'https://gamecall-api.fly.dev';

// PeerJS Server Configuration (Fly.io)
export const PEER_CONFIG = {
  host: 'gamecall-peerjs.fly.dev',
  port: 443,
  path: '/peerjs',
  secure: true,
  config: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ]
  }
};

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  register: `${API_BASE_URL}/auth/register`,
  login: `${API_BASE_URL}/auth/login`,
  me: `${API_BASE_URL}/auth/me`,

  // Friends
  friends: `${API_BASE_URL}/friends`,
  addFriend: `${API_BASE_URL}/friends/add`,
  friendRequests: `${API_BASE_URL}/friends/requests`,
  acceptFriend: (requestId: string) => `${API_BASE_URL}/friends/accept/${requestId}`,
  rejectFriend: (requestId: string) => `${API_BASE_URL}/friends/reject/${requestId}`,
  removeFriend: (friendId: string) => `${API_BASE_URL}/friends/remove/${friendId}`,
};

export default API_BASE_URL;
