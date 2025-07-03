import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import oauth2Client from '../../../lib/google-oauth';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('google_access_token')?.value;

    if (!accessToken) {
      return NextResponse.json({ authenticated: false, accessToken: null });
    }

    // Verify the token is valid by setting it and checking
    oauth2Client.setCredentials({ access_token: accessToken });
    
    // Try to get token info to verify it's valid
    try {
      const tokenInfo = await oauth2Client.getTokenInfo(accessToken);
      if (tokenInfo && tokenInfo.expiry_date && tokenInfo.expiry_date > Date.now()) {
        return NextResponse.json({ authenticated: true, accessToken });
      }
    } catch (error) {
      // Token is invalid or expired
      console.error('Token validation error:', error);
    }

    return NextResponse.json({ authenticated: false, accessToken: null });
  } catch (error) {
    console.error('Auth status check error:', error);
    return NextResponse.json({ authenticated: false, accessToken: null });
  }
} 