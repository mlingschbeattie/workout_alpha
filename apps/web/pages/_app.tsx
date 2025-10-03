import type { AppProps } from "next/app";
import "../styles/globals.css";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div className="min-h-screen bg-white text-black">
      <Header />
      <Component {...pageProps} />
      <Footer />
    </div>
  );
}

