import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Features from "./pages/Features";
import Cryptography from "./pages/Cryptography";
import Chat from "./pages/Chat";
import { Routes, Route } from "react-router-dom";
import type { JSX } from "react";

const App = (): JSX.Element => {
	return (
		<>
			<Navbar />
			<Routes>
				<Route path="/" element={<Home />} />
				<Route path="/features" element={<Features />} />
				<Route path="/cryptography" element={<Cryptography />} />
				<Route path="/chat" element={<Chat />} />
			</Routes>
			<Footer />
		</>
	);
};

export default App;
