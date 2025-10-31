// Types per l'applicazione GameCall

export interface User {
  id: string;
  username: string;
  avatar?: string;
  status: 'online' | 'offline' | 'in-call' | 'busy';
  lastSeen?: Date;
  friendCode?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export interface Contact extends User {
  isFavorite?: boolean;
}

export interface Call {
  id: string;
  callerId: string;
  receiverId: string;
  type: 'audio' | 'video' | 'screen';
  status: 'ringing' | 'active' | 'ended';
  startTime?: Date;
  endTime?: Date;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: Date;
  encrypted: boolean;
  read: boolean;
}

export interface MediaSettings {
  audioEnabled: boolean;
  videoEnabled: boolean;
  screenSharing: boolean;
  pipEnabled: boolean;
}

export interface WebRTCConfig {
  iceServers: RTCIceServer[];
}

export interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate' | 'call-request' | 'call-accept' | 'call-reject' | 'call-end';
  from: string;
  to: string;
  data?: any;
}
