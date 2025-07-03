import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import oauth2Client from '../../../lib/google-oauth';
import { google } from 'googleapis';

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('google_access_token')?.value;

    if (!accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Set the credentials
    oauth2Client.setCredentials({ access_token: accessToken });

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');

    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    // Build the query for the files.list API
    let q = "trashed=false";
    if (query) {
      // Search for files with name containing the query
      q += ` and name contains '${query.replace(/'/g, "\\'")}'`;
    }

    try {
      const result = await drive.files.list({
        pageSize: 20,
        fields: 'files(id, name, mimeType, iconLink, webViewLink, modifiedTime)',
        q,
        orderBy: 'modifiedTime desc',
      });

      const files = result.data.files || [];

      // Transform files to match the expected format
      const transformedFiles = files.map(file => ({
        value: file.id || '',
        label: file.name || 'Untitled',
        type: 'google-drive',
        mimeType: file.mimeType,
        iconLink: file.iconLink,
        webViewLink: file.webViewLink,
        modifiedTime: file.modifiedTime,
      }));

      return NextResponse.json(transformedFiles);
    } catch (error: any) {
      console.error('Google Drive API error:', error);
      if (error?.status === 401 || error?.code === 401) {
        return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
      }
      return NextResponse.json({ error: 'Failed to fetch files' }, { status: 500 });
    }
  } catch (error) {
    console.error('Files API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 