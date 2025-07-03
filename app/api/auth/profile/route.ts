import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import oauth2Client from '../../../lib/google-oauth';
import { google } from 'googleapis';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('google_access_token')?.value;

    if (!accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Set the credentials
    oauth2Client.setCredentials({ access_token: accessToken });

    // Create a People API instance
    const people = google.people({ version: 'v1', auth: oauth2Client });

    try {
      // Get the user's profile information
      const profile = await people.people.get({
        resourceName: 'people/me',
        personFields: 'names,emailAddresses,photos',
      });

      const person = profile.data;
      
      // Extract the information we need
      const name = person.names?.[0]?.displayName || 'Unknown User';
      const email = person.emailAddresses?.[0]?.value || '';
      const profilePicture = person.photos?.[0]?.url || '';

      return NextResponse.json({
        name,
        email,
        profilePicture,
      });
    } catch (error: any) {
      console.error('Google People API error:', error);
      if (error?.status === 401 || error?.code === 401) {
        return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
      }
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }
  } catch (error) {
    console.error('Profile API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 