export const state = {
    currentSessionId: null,
    currentProtocol: null,
    currentPath: '/',
    editor: null,
    currentOpenedFile: null,
    openTabs: [],
    selectedPath: '/',
    selectedIsDir: true
};
export const SESSIONS_KEY = 'fast_tunnel_sessions';
export const SESSION_EXPIRY_DAYS = 30;