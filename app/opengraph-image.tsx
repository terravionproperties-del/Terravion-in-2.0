import { ImageResponse } from "next/og";

export const alt =
  "Terravion Properties — Premium villa plots in Shankarpally, Hyderabad";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Brand OG card: golden-hour gradient, serif wordmark, no external assets. */
export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: 72,
          background:
            "linear-gradient(165deg, #191410 0%, #2e241a 55%, #6b4a1f 100%)",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            right: 90,
            top: 110,
            width: 180,
            height: 180,
            borderRadius: 999,
            background:
              "radial-gradient(circle at center, #f3cf8a 0%, #cfae6b 45%, rgba(207,174,107,0) 70%)",
            display: "flex",
          }}
        />
        <div
          style={{
            fontSize: 26,
            letterSpacing: 10,
            textTransform: "uppercase",
            color: "#cfae6b",
            display: "flex",
          }}
        >
          Shankarpally · West Hyderabad
        </div>
        <div
          style={{
            fontSize: 96,
            color: "#f6f3ec",
            marginTop: 18,
            fontWeight: 500,
            display: "flex",
          }}
        >
          Terravion Properties
        </div>
        <div
          style={{
            fontSize: 32,
            color: "rgba(246,243,236,0.72)",
            marginTop: 16,
            display: "flex",
          }}
        >
          HMDA & DTCP approved villa plots — own the land the city moves toward.
        </div>
      </div>
    ),
    { ...size }
  );
}
