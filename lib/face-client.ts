"use client";
// Face detection runs in the browser: the guest's selfie never leaves their phone,
// only a 128-number descriptor is sent to the server for matching.
import type * as FaceApi from "@vladmandic/face-api";

let faceapi: typeof FaceApi | null = null;
let loading: Promise<typeof FaceApi> | null = null;

export function loadFaceApi() {
  if (faceapi) return Promise.resolve(faceapi);
  loading ??= (async () => {
    const api = await import("@vladmandic/face-api");
    const tf = api.tf as unknown as {
      setBackend(name: string): Promise<boolean>;
      ready(): Promise<void>;
    };
    if (!(await tf.setBackend("webgl").catch(() => false))) await tf.setBackend("cpu");
    await tf.ready();
    await Promise.all([
      api.nets.ssdMobilenetv1.loadFromUri("/models"),
      api.nets.faceLandmark68Net.loadFromUri("/models"),
      api.nets.faceRecognitionNet.loadFromUri("/models"),
    ]);
    faceapi = api;
    return api;
  })();
  return loading;
}

export async function fileToImage(file: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.src = url;
  await img.decode();
  URL.revokeObjectURL(url);
  return img;
}

// Downscaled copy of an image as a canvas (keeps detection fast on big camera files).
export function resize(img: HTMLImageElement, maxSide: number) {
  const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);
  canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas;
}

export function canvasToJpeg(canvas: HTMLCanvasElement, quality = 0.85) {
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/jpeg", quality),
  );
}

export async function detectAllFaces(input: HTMLCanvasElement) {
  const api = await loadFaceApi();
  const results = await api
    .detectAllFaces(input, new api.SsdMobilenetv1Options({ minConfidence: 0.5 }))
    .withFaceLandmarks()
    .withFaceDescriptors();
  return results.map((r) => Array.from(r.descriptor));
}

function padded(input: HTMLCanvasElement) {
  const canvas = document.createElement("canvas");
  canvas.width = input.width * 2;
  canvas.height = input.height * 2;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#808080";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(input, input.width / 2, input.height / 2);
  return canvas;
}

// For a selfie: the largest face in the picture. Very close-up selfies are
// retried with a border, since the detector misses faces that fill the frame.
export async function detectMainFace(input: HTMLCanvasElement) {
  const api = await loadFaceApi();
  for (const candidate of [input, padded(input)]) {
    const results = await api
      .detectAllFaces(candidate, new api.SsdMobilenetv1Options({ minConfidence: 0.4 }))
      .withFaceLandmarks()
      .withFaceDescriptors();
    if (results.length) {
      const main = results.reduce((a, b) => (a.detection.box.area > b.detection.box.area ? a : b));
      return Array.from(main.descriptor);
    }
  }
  return null;
}
