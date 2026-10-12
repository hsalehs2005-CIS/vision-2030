// Copies face-api model weights into public/ so the browser can load them.
import { cpSync, existsSync, mkdirSync } from "node:fs";

const src = "node_modules/@vladmandic/face-api/model";
const dest = "public/models";
if (existsSync(src)) {
  mkdirSync(dest, { recursive: true });
  for (const f of [
    "ssd_mobilenetv1_model.bin",
    "ssd_mobilenetv1_model-weights_manifest.json",
    "face_landmark_68_model.bin",
    "face_landmark_68_model-weights_manifest.json",
    "face_recognition_model.bin",
    "face_recognition_model-weights_manifest.json",
  ]) cpSync(`${src}/${f}`, `${dest}/${f}`);
}
