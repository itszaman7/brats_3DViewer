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
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      <main className="flex-1 flex">
        <NiftiViewerPage />
      </main>
      <Footer />
    </div>
  );
}
