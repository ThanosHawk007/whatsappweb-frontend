window.global = window; // ✅ fixes "global is not defined" for sockjs-client

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ChakraProvider } from "@chakra-ui/react";
import App from "./App.jsx";
import "./index.css";

console.log("MAIN.JSX LOADED");

console.log("Current URL:", window.location.href);

window.addEventListener("beforeunload", () => {
  console.log("PAGE IS NAVIGATING AWAY FROM:", window.location.href);
});

createRoot(document.getElementById("root")).render(
  // <StrictMode>
  <ChakraProvider>
    <App />
  </ChakraProvider>,
  // </StrictMode>,
);
