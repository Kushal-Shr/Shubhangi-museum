export interface AvatarAsset {
  id: string;
  label: string;
  url: string;
  height: number;
  rotationY: number;
  proceduralMotion?: boolean;
  scanRig?: "dress" | "casual-man" | "hoodie";
  scanGroundPlane?: [number, number, number, number];
  generated?: boolean;
  animations: { idle: string; walk: string; run?: string; sit?: string };
  materials?: { skin?: string[]; hair?: string[]; outfit?: string[] };
  variants?: { hair?: string[]; outfits?: string[]; accessories?: string[] };
}
// Add your own licensed models locally.
export const avatarAssets: AvatarAsset[] = [];
