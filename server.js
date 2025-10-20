import express from "express";
import axios from "axios";
import cors from "cors";
import * as cheerio from 'cheerio';
import { URL } from "url";

const app = express();
app.use(cors());

const GOOGLE_API_KEY = "AIzaSyBv1kL9WWIC0kDr5uFXhHXkkxhAUlpIG9M";

app.get("/api/places", async (req, res) => {
  const { query } = req.query;
  if (!query) {
    return res.status(400).json({ error: "Missing query parameter" });
  }

  try {
    const response = await axios.post(
      "https://places.googleapis.com/v1/places:searchText",
      {
        textQuery: query,
        pageSize: 100,
        languageCode: "en",
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": GOOGLE_API_KEY,
          "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.rating,places.websiteUri",
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error("Error fetching data:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to fetch places" });
  }
});

app.get("/api/enrich", async (req, res) => {
  const { website } = req.query;
  if (!website) {
    return res.status(400).json({ error: "Missing website parameter" });
  }

  try {
    // Fetch the website’s HTML
    const response = await axios.get(website, { timeout: 8000 });
    const html = response.data;
    const $ = cheerio.load(html);

    // Extract emails and phones using regex
    const htmlText = $("body").text();

    const emailMatches = htmlText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi);
    const phoneMatches = htmlText.match(/(\+?\d[\d -]{8,}\d)/g);

    res.json({
      emails: emailMatches ? [...new Set(emailMatches)] : [],
      phones: phoneMatches ? [...new Set(phoneMatches)] : [],
    });
  } catch (error) {
    console.error("Error scraping site:", website, error.message);
    res.json({ emails: [], phones: [] });
  }
});


const PORT = 5000;
app.listen(PORT, () => console.log(`✅ Proxy server running on port ${PORT}`));
