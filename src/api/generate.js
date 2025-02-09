export default async function handler(req, res) {
    try {
      // Validate required fields
      if (!req.body.mood || !req.body.activity || !req.body.vibe) {
        return res.status(400).json({ error: "Missing required fields" });
      }
  
      // Call DeepSeek API
      const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [{
            role: "user",
            content: `Suggest 10 songs for ${req.body.mood} mood during ${req.body.activity} with "${req.body.vibe}" vibe. 
              Return ONLY JSON array: [{"title": "...", "artist": "...", "reason": "..."}]`
          }]
        }),
      });
  
      const data = await response.json();
      
      // Handle API errors
      if (!response.ok) {
        throw new Error(`DeepSeek API Error: ${data.error?.message}`);
      }
  
      // Parse and validate response
      const songs = JSON.parse(data.choices[0].message.content);
      if (!Array.isArray(songs)) throw new Error("Invalid response format");
      
      res.status(200).json({ songs });
  
    } catch (error) {
      console.error("API Error:", error);
      res.status(500).json({ 
        error: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }