import assert from "node:assert/strict";
import { env } from "@huggingface/transformers";
import { KokoroTTS } from "kokoro-js";

env.localModelPath = `${process.cwd()}/public/models/`;
env.allowRemoteModels = false;

const tts = await KokoroTTS.from_pretrained("Kokoro-82M-v1.0-ONNX", {
  dtype: "q8",
  device: "cpu",
});
const audio = await tts.generate("Hello world.", { voice: "bf_emma" });

assert(audio.audio.length > 0);
assert.equal(audio.sampling_rate, 24_000);
console.log(`Kokoro OK: ${audio.audio.length} samples at ${audio.sampling_rate} Hz`);
