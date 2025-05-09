import { GridSyncMessage } from '../core/types';

/**
 * Handle state update messages
 * @param message - The STATE_UPDATE message from server
 * @param onStateChange - Callback function for state changes
 */
export function handleStateUpdate(message: GridSyncMessage, onStateChange?: (state: any) => void): void {
  if (onStateChange && message.data) {
    onStateChange(message.data);
  }
}

/**
 * Handle authentication response
 * @param message - The AUTH_RESPONSE message from server
 * @param onError - Callback function for errors
 * @returns Whether authentication was successful
 */
export function handleAuthResponse(message: GridSyncMessage, onError?: (error: any) => void): boolean {
  if (message.data?.status === 'error') {
    if (onError) {
      onError({
        type: 'AuthenticationError',
        message: message.data.message || 'Authentication failed'
      });
    }
    return false;
  }
  return true;
}

/**
 * Handle error messages
 * @param message - The ERROR message from server
 * @param onError - Callback function for errors
 */
export function handleErrorMessage(message: GridSyncMessage, onError?: (error: any) => void): void {
  if (onError) {
    onError(message.data || { message: 'Unknown error' });
  }
} 