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

console.log("Initial URL:", window.location.href);

window.addEventListener("beforeunload", () => {
  console.log("Navigating away from:", window.location.href);
});

const originalPushState = history.pushState;

history.pushState = function (...args) {
  console.trace("history.pushState called:", args);
  return originalPushState.apply(this, args);
};

const originalReplaceState = history.replaceState;

history.replaceState = function (...args) {
  console.log("replaceState URL argument:", args[2]);
  console.trace("replaceState caller");

  return originalReplaceState.apply(this, args);
};

createRoot(document.getElementById("root")).render(
  // <StrictMode>
  <ChakraProvider>
    <App />
  </ChakraProvider>,
  // </StrictMode>,
);
