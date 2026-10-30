window.global = window; // ✅ fixes "global is not defined" for sockjs-client

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ChakraProvider } from "@chakra-ui/react";
import App from "./App.jsx";
import "./index.css";

console.log("MAIN.JSX LOADED");
console.log("Current URL:", window.location.href);

console.log("MAIN.JSX LOADED");
console.log("Current URL:", window.location.href);
console.log("Initial URL:", window.location.href);

// Detect history API navigation
const originalPushState = history.pushState.bind(history);

history.pushState = function (...args) {
  console.log("pushState URL argument:", args[2]);
  console.trace("pushState caller");
  return originalPushState(...args);
};

const originalReplaceState = history.replaceState.bind(history);

history.replaceState = function (...args) {
  console.log("replaceState URL argument:", args[2]);
  console.trace("replaceState caller");
  return originalReplaceState(...args);
};

createRoot(document.getElementById("root")).render(
  // <StrictMode>
  <ChakraProvider>
    <App />
  </ChakraProvider>,
  // </StrictMode>,
);
