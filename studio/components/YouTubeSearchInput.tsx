import React, { useState } from "react";
import { Stack, TextInput, Button, Card, Text, Inline, Spinner } from "@sanity/ui";
import { set } from "sanity";

type YouTubeResult = {
  youtubeId: string;
  title: string;
  channel: string;
  durationSeconds?: number | null;
  thumbnail?: string;
};

const getSearchUrl = () =>
  process.env?.SANITY_STUDIO_YOUTUBE_SEARCH_URL
  || process.env?.YOUTUBE_SEARCH_URL;

const getItemKey = (currentKey?: string) => {
  if (currentKey) return currentKey;
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `key-${Math.random().toString(36).slice(2, 10)}`;
};

export default function YouTubeSearchInput(props: any) {
  const { value, onChange } = props;
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<YouTubeResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const search = async () => {
    if (!query.trim()) {
      setMessage("Enter a search term.");
      setResults([]);
      return;
    }
    const searchUrl = getSearchUrl();
    if (!searchUrl) {
      setMessage("Missing YOUTUBE_SEARCH_URL. Check studio .env for VITE_YOUTUBE_SEARCH_URL.");
      setResults([]);
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch(`${searchUrl}?q=${encodeURIComponent(query.trim())}`);
      const data = await response.json();
      setResults(Array.isArray(data) ? data : []);
      if (!Array.isArray(data) || data.length === 0) {
        setMessage("No videos found.");
      }
    } catch (error) {
      setMessage("Unable to search YouTube.");
    } finally {
      setLoading(false);
    }
  };

  const selectVideo = (video: YouTubeResult) => {
    onChange(
      set({
        _key: getItemKey(value?._key),
        youtubeId: video.youtubeId,
        title: video.title,
        channel: video.channel,
        durationSeconds: video.durationSeconds ?? null,
        isPrimary: value?.isPrimary ?? false,
      })
    );
  };

  return (
    <Stack space={3}>
      <TextInput
        placeholder="Search YouTube (e.g. single leg RDL)"
        value={query}
        onChange={event => setQuery(event.currentTarget.value)}
      />
      <Inline space={2}>
        <Button text="Search" onClick={search} disabled={loading} />
        {loading && <Spinner muted />}
      </Inline>
      {message && <Text size={1}>{message}</Text>}
      {results.map(video => (
        <Card
          key={video.youtubeId}
          padding={3}
          shadow={1}
          radius={2}
          style={{ cursor: "pointer" }}
          onClick={() => selectVideo(video)}
        >
          <Stack space={2}>
            {video.thumbnail && (
              <img
                src={video.thumbnail}
                alt={video.title}
                style={{ width: "100%", borderRadius: 6, display: "block" }}
              />
            )}
            <Text weight="semibold">{video.title}</Text>
            <Text size={1}>{video.channel}</Text>
            {typeof video.durationSeconds === "number" && (
              <Text size={1}>{video.durationSeconds}s</Text>
            )}
          </Stack>
        </Card>
      ))}
    </Stack>
  );
}
