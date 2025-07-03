export interface GoogleDriveFile {
  value: string
  label: string
  type: string
  mimeType?: string
  iconLink?: string
  webViewLink?: string
  modifiedTime?: string
}

export const googleDriveClient = {
  async checkAuthStatus(): Promise<{ authenticated: boolean; accessToken: string | null }> {
    try {
      const response = await fetch('/api/auth/status');
      if (!response.ok) {
        return { authenticated: false, accessToken: null };
      }
      return await response.json();
    } catch (error) {
      console.error('Error checking auth status:', error);
      return { authenticated: false, accessToken: null };
    }
  },
  
  async initializeGapi() {
    // No longer needed for server-side API calls
  },
  
  async fetchFiles(accessToken: string): Promise<GoogleDriveFile[]> {
    try {
      const response = await fetch('/api/drive/files');
      if (!response.ok) {
        if (response.status === 401) {
          throw { status: 401, message: 'Authentication failed' };
        }
        throw new Error('Failed to fetch files');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching files:', error);
      throw error;
    }
  },
  
  async searchFiles(query: string, accessToken: string): Promise<GoogleDriveFile[]> {
    try {
      const response = await fetch(`/api/drive/files?q=${encodeURIComponent(query)}`);
      if (!response.ok) {
        if (response.status === 401) {
          throw { status: 401, message: 'Authentication failed' };
        }
        throw new Error('Failed to search files');
      }
      return await response.json();
    } catch (error) {
      console.error('Error searching files:', error);
      throw error;
    }
  }
} 