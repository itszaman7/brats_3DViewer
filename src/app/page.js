"use client";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import dynamic from "next/dynamic";

const NiftiViewerPage = dynamic(
  () => import("@/components/ThirdDimenssion/NifitViewerPage"),
  {
    ssr: false,
    loading: () => (
      <p style={{ color: "white", textAlign: "center", width: "100%" }}>
        Loading Viewer...
      </p>
    ),
  }
);

export default function Home() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        backgroundColor: "#272727",
      }}
    >
      <Navbar />
      <main style={{ flex: 1, display: "flex" }}>
        <NiftiViewerPage />
      </main>
      <Footer />
    </div>
  );
}
