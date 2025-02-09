import React, { useState, useEffect } from "react";
import axios from "axios";
import handler from "../api/generate";
import {
  Button,
  TextField,
  Box,
  Typography,
  CircularProgress,
  Container,
} from "@mui/material";

export default function PlaylistForm() {
  // State management
  const [formData, setFormData] = useState({
    mood: "",
    activity: "",
    vibe: "",
  });
  const [playlist, setPlaylist] = useState([]);
  const [loading, setLoading] = useState(false);
  const [spotifyReady, setSpotifyReady] = useState(false);

  // Spotify token handling
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const token = new URLSearchParams(hash.substring(1)).get("access_token");
      if (token) {
        localStorage.setItem("spotify_token", token);
        setSpotifyReady(true);
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );
      }
    } else {
      setSpotifyReady(!!localStorage.getItem("spotify_token"));
    }
  }, []);

  // Form handling
  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Search for tracks matching AI suggestions
  const searchSpotify = async (query) => {
    const token = localStorage.getItem("spotify_token");
    const response = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(
        query
      )}&type=track`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.json();
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!Object.values(formData).every(Boolean)) return;

    setLoading(true);
    try {
      // Call DeepSeek API
      const response = await fetch(
        "http://localhost:1234/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // Authorization: `Bearer ${process.env.FORFORE_AI}`,
          },
          body: JSON.stringify({
            model: "deepseek-r1-distill-qwen-7b",

            messages: [
              {
                role: "user",
                content: `Suggest 10 songs for a ${formData.mood} mood during ${formData.activity} with a "${formData.vibe}" vibe.
Return a JSON object following this structure: 
{"songs": [{"title": "Song Name", "artist": "Artist Name", "reason": "Why this song fits"}]}.`,
              },
            ],
            temperature: 0.7,
            max_tokens: -1,
            stream: false,
            remove_reasoning: "think",
          }),
        }
      );

      const data = await response.json();

      function extractJSON(text) {
        const jsonMatch = text.match(/```json([\s\S]*?)```/);
        if (jsonMatch) {
          return jsonMatch[1].trim();
        }
        return null;
      }

      console.log("--------------------------------------------------");
      console.log(extractJSON(data?.choices[0]?.message.content));

      const dataSongsJson = extractJSON(data?.choices[0]?.message.content);
      const dataSongs = dataSongsJson ? JSON.parse(dataSongsJson) : null;
      // const tracks = await Promise.all(
      //   dataSongs.songs.map(async (song) => ({
      //     ...song,
      //     spotifyUri: await searchSpotify(`${song.title} ${song.artist}`),
      //   }))
      // );
      // console.log(tracks);

      if (dataSongs?.songs) {
        const tracks = await Promise.all(
          dataSongs.songs.map(async (song) => ({
            ...song,
            spotifyUri: await searchSpotify(`${song.title} ${song.artist}`),
          }))
        );
        setPlaylist(tracks);
      }
    } catch (error) {
      console.error("Generation failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          backgroundColor: "background.paper",
          p: 4,
          borderRadius: 2,
          boxShadow: 1,
        }}
      >
        <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
          🎵 AI Playlist Generator
        </Typography>

        {/* Mood Input */}
        <TextField
          fullWidth
          label="Mood"
          name="mood"
          value={formData.mood}
          onChange={handleInputChange}
          placeholder="e.g., nostalgic, energetic"
          sx={{ mb: 3 }}
          required
        />

        {/* Activity Input */}
        <TextField
          fullWidth
          label="Activity"
          name="activity"
          value={formData.activity}
          onChange={handleInputChange}
          placeholder="e.g., cooking, working out"
          sx={{ mb: 3 }}
          required
        />

        {/* Vibe Input */}
        <TextField
          fullWidth
          label="Vibe"
          name="vibe"
          value={formData.vibe}
          onChange={handleInputChange}
          placeholder="e.g., 'summer night', 'dark academia'"
          multiline
          rows={3}
          sx={{ mb: 4 }}
          required
        />

        <Button
          fullWidth
          variant="contained"
          size="large"
          type="submit"
          disabled={loading || !spotifyReady}
          sx={{ height: 50 }}
        >
          {loading ? (
            <CircularProgress size={24} color="inherit" />
          ) : spotifyReady ? (
            "Generate Playlist"
          ) : (
            "Login to Spotify First"
          )}
        </Button>

        {/* Playlist Display */}
        {playlist.length > 0 && (
          <Box sx={{ mt: 6 }}>
            <Typography variant="h5" gutterBottom>
              Generated Playlist
            </Typography>
            {playlist.length > 0 && (
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" gutterBottom>
                  Your AI-Generated Playlist:
                </Typography>
                <ul style={{ listStyle: "none", padding: 0 }}>
                  {playlist.map((song, index) => (
                    <li key={index} style={{ marginBottom: "1rem" }}>
                      <strong>{song.title}</strong> by {song.artist}
                      <br />
                      <small>{song.reason}</small>
                    </li>
                  ))}
                </ul>
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Container>
  );
}
