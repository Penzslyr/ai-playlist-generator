import { BrowserRouter, Routes, Route } from "react-router-dom";
import PlaylistForm from "./components/PlaylistForm";
import SpotifyAuth from "./components/SpotifyAuth";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <div style={{ padding: "2rem" }}>
              <SpotifyAuth />
              <PlaylistForm />
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
