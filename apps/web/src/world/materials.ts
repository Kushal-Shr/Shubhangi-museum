import {
  CanvasTexture,
  MeshStandardMaterial,
  RepeatWrapping,
  SRGBColorSpace,
  TextureLoader,
  Vector2,
} from "three";
function surface(kind: "stone" | "wood" | "plaster") {
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle =
    kind === "wood" ? "#92715f" : kind === "stone" ? "#e9e4d9" : "#eeeae1";
  ctx.fillRect(0, 0, 512, 512);
  let seed = 42;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let i = 0; i < 18000; i++) {
    const v = random();
    ctx.fillStyle = `rgba(${v > 0.5 ? "255,250,230" : "60,49,36"},${random() * 0.07})`;
    ctx.fillRect(
      random() * 512,
      random() * 512,
      kind === "wood" ? random() * 80 : 2,
      1,
    );
  }
  if (kind === "stone") {
    for (let k = 0; k < 22; k++) {
      ctx.beginPath();
      let y = random() * 512;
      ctx.moveTo(0, y);
      for (let x = 0; x <= 512; x += 8) {
        y += Math.sin(x * 0.02 + k) * 1.8;
        ctx.lineTo(x, y);
      }
      ctx.strokeStyle = `rgba(95,90,77,${random() * 0.12})`;
      ctx.lineWidth = random() * 2;
      ctx.stroke();
    }
    ctx.strokeStyle = "#aca491";
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, 511, 511);
  }
  if (kind === "wood") {
    for (let y = 0; y < 512; y += 64) {
      ctx.fillStyle = "#564431";
      ctx.fillRect(0, y, 512, 2);
      ctx.fillRect((y * 7) % 512, y, 2, 64);
    }
  }
  const map = new CanvasTexture(c);
  map.colorSpace = SRGBColorSpace;
  map.wrapS = map.wrapT = RepeatWrapping;
  map.repeat.set(kind === "wood" ? 2 : 1, kind === "wood" ? 2 : 1);
  map.anisotropy = 4;
  return map;
}
let cache: ReturnType<typeof makeMaterials> | null = null;
function makeMaterials() {
  const stone = surface("stone"),
    wood = surface("wood"),
    plaster = surface("plaster");
  const result = {
    stone: new MeshStandardMaterial({
      color: "#f0ece3",
      map: stone,
      roughness: 0.32,
      metalness: 0.07,
      bumpMap: stone,
      bumpScale: 0.018,
    }),
    wood: new MeshStandardMaterial({
      color: "#ae8874",
      map: wood,
      roughness: 0.48,
      bumpMap: wood,
      bumpScale: 0.012,
    }),
    plaster: new MeshStandardMaterial({ map: plaster, roughness: 0.9 }),
    dark: new MeshStandardMaterial({ color: "#29322e", roughness: 0.95 }),
    glass: new MeshStandardMaterial({
      color: "#afc8c1",
      transparent: true,
      opacity: 0.18,
      metalness: 0.35,
      roughness: 0.12,
      depthWrite: false,
    }),
    brass: new MeshStandardMaterial({
      color: "#bda16a",
      metalness: 0.78,
      roughness: 0.26,
    }),
    rose: new MeshStandardMaterial({ color: "#c8879f", roughness: 0.8 }),
    leaf: new MeshStandardMaterial({ color: "#52664b", roughness: 0.82 }),
  };
  const loader = new TextureLoader();
  for (const kind of ["stone", "wood"] as const) {
    const mat = result[kind];
    for (const channel of ["color", "normal", "roughness"] as const) {
      loader.load(
        `/materials/${kind}-${channel}.jpg`,
        (texture) => {
          texture.wrapS = texture.wrapT = RepeatWrapping;
          texture.anisotropy = 4;
          if (channel === "color") {
            texture.colorSpace = SRGBColorSpace;
            mat.map = texture;
            mat.bumpMap = null;
          }
          if (channel === "normal") {
            mat.normalMap = texture;
            mat.normalScale = new Vector2(0.35, 0.35);
          }
          if (channel === "roughness") {
            mat.roughnessMap = texture;
            mat.roughness = kind === "stone" ? 0.62 : 0.8;
          }
          mat.needsUpdate = true;
        },
        undefined,
        () => {
          /* Retain the original procedural maps if an asset is unavailable. */
        },
      );
    }
  }
  return result;
}
export function materials() {
  return (cache ??= makeMaterials());
}
