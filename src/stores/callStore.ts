import { create } from 'zustand';
import { Contact } from '../types';

export type CallType = 'audio' | 'video' | 'screen';

export interface CallState {
  // Call info
  isInCall: boolean; // true SOLO quando chiamata ATTIVA (entrambi hanno accettato)
  isCalling: boolean; // true quando sto chiamando (attesa risposta)
  callType: CallType;
  caller: Contact | null;
  receiver: Contact | null;
  
  // Call settings
  isMuted: boolean;
  isVideoOff: boolean;
  isSharingScreen: boolean;
  isPictureInPicture: boolean;
  
  // UI state
  showIncomingCallModal: boolean;
  incomingCallData: {
    from: Contact;
    callType: CallType;
  } | null;
  
  // Statistics
  callDuration: number;
  callQuality: 'excellent' | 'good' | 'poor';
  
  // Actions
  startCall: (receiver: Contact, callType: CallType) => void;
  endCall: () => void;
  acceptIncomingCall: () => void;
  rejectIncomingCall: () => void;
  setIncomingCall: (from: Contact, callType: CallType) => void;
  toggleMute: () => void;
  toggleVideo: () => void;
  toggleScreenShare: () => void;
  togglePictureInPicture: () => void;
  setCallDuration: (duration: number) => void;
  setCallQuality: (quality: 'excellent' | 'good' | 'poor') => void;
  reset: () => void;
}

const initialState = {
  isInCall: false,
  isCalling: false, // 🔥 Nuovo: stato "sto chiamando"
  callType: 'video' as CallType,
  caller: null,
  receiver: null,
  isMuted: false,
  isVideoOff: false,
  isSharingScreen: false,
  isPictureInPicture: false,
  showIncomingCallModal: false,
  incomingCallData: null,
  callDuration: 0,
  callQuality: 'good' as const,
};

export const useCallStore = create<CallState>((set, get) => ({
  ...initialState,

  startCall: (receiver, callType) => {
    console.log('📞 Avvio chiamata a:', receiver.username, 'Tipo:', callType);
    set({
      isCalling: true, // 🔥 Setto "sto chiamando" (NON isInCall!)
      isInCall: false, // Ancora NO chiamata attiva
      callType,
      receiver,
      isMuted: false,
      isVideoOff: false,
      isSharingScreen: false,
      isPictureInPicture: false,
      callDuration: 0,
    });
  },

  endCall: () => {
    console.log('📞 Chiamata terminata');
    set({
      ...initialState,
    });
  },

  setIncomingCall: (from, callType) => {
    console.log('🔔 Chiamata in arrivo da:', from.username);
    set({
      showIncomingCallModal: true,
      incomingCallData: { from, callType },
    });
  },

  acceptIncomingCall: () => {
    const { incomingCallData } = get();
    if (!incomingCallData) return;

    console.log('✅ Chiamata accettata da:', incomingCallData.from.username);
    set({
      isInCall: true, // 🔥 ORA sì, chiamata ATTIVA
      isCalling: false,
      callType: incomingCallData.callType,
      caller: incomingCallData.from,
      showIncomingCallModal: false,
      incomingCallData: null,
    });
  },

  rejectIncomingCall: () => {
    const { incomingCallData } = get();
    console.log('❌ Chiamata rifiutata da:', incomingCallData?.from.username);
    set({
      showIncomingCallModal: false,
      incomingCallData: null,
    });
  },

  toggleMute: () => {
    set((state) => {
      const newMutedState = !state.isMuted;
      console.log(newMutedState ? '🔇 Muto attivato' : '🔊 Muto disattivato');
      return { isMuted: newMutedState };
    });
  },

  toggleVideo: () => {
    set((state) => {
      const newVideoState = !state.isVideoOff;
      console.log(newVideoState ? '📹 Video disattivato' : '📹 Video attivato');
      return { isVideoOff: newVideoState };
    });
  },

  toggleScreenShare: () => {
    set((state) => {
      const newShareState = !state.isSharingScreen;
      console.log(newShareState ? '🖥️ Condivisione schermo attivata' : '🖥️ Condivisione schermo disattivata');
      return { isSharingScreen: newShareState };
    });
  },

  togglePictureInPicture: () => {
    set((state) => {
      const newPipState = !state.isPictureInPicture;
      console.log(newPipState ? '⬜ PIP attivato' : '⬜ PIP disattivato');
      return { isPictureInPicture: newPipState };
    });
  },

  setCallDuration: (duration) => {
    set({ callDuration: duration });
  },

  setCallQuality: (quality) => {
    set({ callQuality: quality });
  },

  reset: () => {
    set(initialState);
  },
}));
