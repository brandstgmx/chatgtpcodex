// The silent preview contains one encoded segment, not the entire sales video.
// Preserve key/map/byte-range tags and the original response URL for relative URIs.
export function previewPlaylist(text) {
  if (!text.startsWith("#EXTM3U") || text.includes("#EXT-X-STREAM-INF"))
    return text;
  const result = [];
  for (const line of text.split(/\r?\n/)) {
    if (line.startsWith("#EXT-X-ENDLIST")) break;
    result.push(line);
    if (line.trim() && !line.startsWith("#")) break;
  }
  return result.join("\n") + "\n#EXT-X-ENDLIST\n";
}

// One bounded cache per page, shared by preview and audible sessions. Only bytes
// actually downloaded for the preview are retained, never the complete video.
export function createDeliveryCache(limit = 12 * 1024 * 1024) {
  const entries = new Map();
  let bytes = 0;
  return {
    get(key) {
      return entries.get(key);
    },
    put(key, data) {
      if (!(data instanceof ArrayBuffer) || data.byteLength > limit) return;
      const old = entries.get(key);
      if (old) bytes -= old.byteLength;
      entries.delete(key);
      while (entries.size && bytes + data.byteLength > limit) {
        const first = entries.keys().next().value;
        bytes -= entries.get(first).byteLength;
        entries.delete(first);
      }
      // Workers can transfer/detach the original buffer after onSuccess.
      entries.set(key, data.slice(0));
      bytes += data.byteLength;
    },
  };
}

export function deliveryLoaders(Hls, { preview, cache, onDuration }) {
  const Base = Hls.DefaultConfig.loader;
  class PlaylistLoader extends Base {
    load(context, config, callbacks) {
      super.load(context, config, {
        ...callbacks,
        onSuccess(response, stats, ctx, details) {
          if (
            typeof response.data === "string" &&
            response.data.startsWith("#EXTM3U") &&
            !response.data.includes("#EXT-X-STREAM-INF")
          ) {
            const duration = [
              ...response.data.matchAll(/#EXTINF:([\d.]+)/g),
            ].reduce((sum, match) => sum + Number(match[1]), 0);
            if (duration > 0) onDuration(duration);
            if (preview)
              response = { ...response, data: previewPlaylist(response.data) };
          }
          callbacks.onSuccess(response, stats, ctx, details);
        },
      });
    }
  }
  class FragmentLoader extends Base {
    load(context, config, callbacks) {
      const key = `${context.url}|${context.rangeStart ?? ""}|${context.rangeEnd ?? ""}`;
      const stored = cache.get(key);
      if (stored) {
        this.context = context;
        const now = performance.now();
        Object.assign(this.stats, {
          loaded: stored.byteLength,
          total: stored.byteLength,
        });
        Object.assign(this.stats.loading, {
          start: now,
          first: now,
          end: now + 1,
        });
        // Match the async loader contract and honor aborts from superseded media.
        queueMicrotask(() => {
          if (this.stats.aborted) return;
          callbacks.onSuccess(
            { url: context.url, data: stored.slice(0) },
            this.stats,
            context,
            null,
          );
        });
        return;
      }
      super.load(context, config, {
        ...callbacks,
        onSuccess(response, stats, ctx, details) {
          if (preview) cache.put(key, response.data);
          callbacks.onSuccess(response, stats, ctx, details);
        },
      });
    }
  }
  return { pLoader: PlaylistLoader, fLoader: FragmentLoader };
}
