import localFont from "next/font/local";

export const SpaceMono = localFont({
  src: [
    {
      path: "./fonts/Space_Mono/SpaceMono-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/Space_Mono/SpaceMono-Regular.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-spaceMono",
});
