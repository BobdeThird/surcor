import crypto from "crypto";
import Link from "next/link";
import oauth2Client from "./lib/google-oauth";
import { Button } from "@/components/ui/button";
import Chat from "@/components/chat";
import { cookies } from "next/headers";

export default async function Home() {
  // Check if user is authenticated
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("google_access_token")?.value;
  
  let isAuthenticated = false;
  if (accessToken) {
    // Verify the token is valid
    oauth2Client.setCredentials({ access_token: accessToken });
    try {
      const tokenInfo = await oauth2Client.getTokenInfo(accessToken);
      if (tokenInfo && tokenInfo.expiry_date && tokenInfo.expiry_date > Date.now()) {
        isAuthenticated = true;
      }
    } catch (error) {
      console.error('Token validation error:', error);
    }
  }

  // If authenticated, show the chat interface
  if (isAuthenticated) {
    return (
      <div>
        <Chat />
      </div>
    );
  }

  // If not authenticated, show the login page
  const SCOPE = [
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/documents",
    "https://www.googleapis.com/auth/drive.file",
    "https://www.googleapis.com/auth/drive.appdata",
    "https://www.googleapis.com/auth/drive.photos.readonly",
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/userinfo.email",
  ];

  const state = crypto.randomBytes(16).toString("hex");

  const authorizationUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPE,
    state,
  });

  return (
    <div className="justify-center w-full flex text-center pt-10 flex-col items-center">
      <h1 className="text-2xl font-bold mb-6">Welcome to Surcor</h1>
      <p className="text-gray-600 mb-8">Sign in with Google to access your files and start chatting</p>
      <Link href={authorizationUrl}>
        <Button>Login with Google</Button>
      </Link>
    </div>
  );
}