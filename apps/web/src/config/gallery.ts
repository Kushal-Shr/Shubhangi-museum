interface GalleryPhoto {
  image: string;
  thumbnail: string;
  width: number;
  height: number;
}
type Gallery = Record<"story" | "her", GalleryPhoto[]>;

// Personal metadata is optional and never committed to the public repository.
const local = import.meta.glob<Gallery>("./gallery-photos.json", {
  eager: true,
  import: "default",
});
const gallery: Gallery = local["./gallery-photos.json"] ?? { story: [], her: [] };
export default gallery;
