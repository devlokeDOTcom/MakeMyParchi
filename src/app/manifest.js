export default function manifest() {
  return {
    name: "Make My Parchi",
    short_name: "Parchi",
    description: "Invoice generation — works offline after the first visit.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#fafafa",
    theme_color: "#18181b",
    orientation: "portrait-primary",
    categories: ["business", "finance", "productivity"],
    icons: [
      {
        src: "/assets/brand_logo.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/assets/brand_logo.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/favicon.png",
        sizes: "48x48",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
