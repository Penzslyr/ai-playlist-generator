// src/components/SpotifyAuth.js
import React, { useState, useEffect } from "react";
import { Button, Typography, Box, Avatar } from "@mui/material";

export default function SpotifyAuth() {
  const [profile, setProfile] = useState(null);
  const SPOTIFY_CLIENT_ID = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
  const redirectUri = window.location.origin;

  // Check for existing token on initial load
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const token = hash.split("&")[0].split("=")[1];
      localStorage.setItem("spotify_token", token);
      window.location.hash = "";
      fetchProfile(token);
    } else {
      const savedToken = localStorage.getItem("spotify_token");
      if (savedToken) fetchProfile(savedToken);
    }
  }, []);

  const fetchProfile = async (token) => {
    try {
      const response = await fetch("https://api.spotify.com/v1/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setProfile(data);
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      logout();
    }
  };

  const handleLogin = () => {
    const scopes = ["playlist-modify-private", "user-read-private"];
    window.location.href = `https://accounts.spotify.com/authorize?client_id=${SPOTIFY_CLIENT_ID}&redirect_uri=${redirectUri}&scope=${scopes.join(
      "%20"
    )}&response_type=token`;
  };

  const logout = () => {
    localStorage.removeItem("spotify_token");
    setProfile(null);
  };

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
      {profile ? (
        <>
          <Avatar
            src={profile.images?.[0]?.url}
            alt={profile.display_name}
            sx={{ width: 40, height: 40 }}
          />
          <Typography variant="body1">{profile.display_name}</Typography>
          <Button
            variant="outlined"
            color="error"
            onClick={logout}
            sx={{ ml: 2 }}
          >
            Logout
          </Button>
        </>
      ) : (
        <Button variant="contained" color="success" onClick={handleLogin}>
          Login with Spotify
        </Button>
      )}
    </Box>
  );
}
