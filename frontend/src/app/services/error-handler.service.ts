import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {

  constructor() { }

  /**
   * Convert technical error messages to user-friendly messages
   */
  getUserFriendlyErrorMessage(error: any, operation: string = 'operation'): string {
    console.error(`Error during ${operation}:`, error);
    
    // Network connectivity issues
    if (error.message?.includes('Failed to fetch') || 
        error.name === 'TypeError' || 
        error.message?.includes('NetworkError') ||
        error.message?.includes('fetch') ||
        error.status === 0) {
      return `Cannot connect to the recipe server. Please check that the backend service is running and try again.`;
    }
    
    // HTTP status errors
    if (error.status === 500 || error.message?.includes('HTTP 500')) {
      return `Server error occurred. Please try again in a moment.`;
    }
    
    if (error.status === 404 || error.message?.includes('HTTP 404')) {
      return `The requested ${operation.replace('load ', '')} could not be found.`;
    }
    
    if (error.status === 403 || error.status === 401 || 
        error.message?.includes('HTTP 403') || error.message?.includes('HTTP 401')) {
      return `Access denied. Please check your permissions.`;
    }
    
    // Timeout errors
    if (error.message?.includes('timeout') || error.name === 'TimeoutError') {
      return `Request timed out. The server might be busy, please try again.`;
    }
    
    // Angular HTTP error with custom message
    if (error.error?.message) {
      return `Failed to ${operation}. ${error.error.message}`;
    }
    
    // Default fallback with more context
    const errorMessage = error.message || error.statusText || 'Unknown error occurred.';
    return `Failed to ${operation}. ${errorMessage}`;
  }
}
