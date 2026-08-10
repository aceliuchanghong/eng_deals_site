const MODEL_ID = "Kokoro-82M-v1.0-ONNX";
const VOICE = "bf_emma";
const VOICE_CACHE_URL =
  `https://huggingface.co/onnx-community/${MODEL_ID}/resolve/main/voices/${VOICE}.bin`;

let ttsPromise: ReturnType<typeof loadTts> | undefined;
let player: HTMLAudioElement | undefined;
let audioUrl: string | undefined;

async function cacheLocalVoice() {
  const cache = await caches.open("kokoro-voices");
  if (await cache.match(VOICE_CACHE_URL)) return;

  const response = await fetch(`/models/${MODEL_ID}/voices/${VOICE}.bin`);
  if (!response.ok) throw new Error("Unable to load the local Kokoro voice.");
  await cache.put(VOICE_CACHE_URL, response);
}

async function loadTts() {
  const [{ KokoroTTS }, { env }] = await Promise.all([
    import("kokoro-js"),
    import("@huggingface/transformers"),
    cacheLocalVoice(),
  ]);

  env.allowLocalModels = true;
  env.allowRemoteModels = false;
  env.localModelPath = "/models/";

  return KokoroTTS.from_pretrained(MODEL_ID, {
    dtype: "q8",
    device: "wasm",
  });
}

export async function speak(text: string) {
  player?.pause();
  if (audioUrl) URL.revokeObjectURL(audioUrl);

  const tts = await (ttsPromise ??= loadTts().catch((error) => {
    ttsPromise = undefined;
    throw error;
  }));
  const audio = await tts.generate(text, { voice: VOICE });

  audioUrl = URL.createObjectURL(audio.toBlob());
  player = new Audio(audioUrl);
  await player.play();
}
