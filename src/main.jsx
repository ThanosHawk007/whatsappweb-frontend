window.global = window; // ✅ fixes "global is not defined" for sockjs-client

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ChakraProvider } from "@chakra-ui/react";
import App from "./App.jsx";
import "./index.css";

console.log("MAIN.JSX LOADED");
console.log("Current URL:", window.location.href);

// Detect full-page navigation attempts
const originalAssign = window.location.assign.bind(window.location);
const originalReplace = window.location.replace.bind(window.location);

window.location.assign = function (url) {
  console.trace("window.location.assign called:", url);
  return originalAssign(url);
};

window.location.replace = function (url) {
  console.trace("window.location.replace called:", url);
  return originalReplace(url);
};

// Detect history API navigation
const originalPushState = history.pushState.bind(history);

history.pushState = function (...args) {
  console.log("pushState URL argument:", args[2]);
  console.trace("pushState caller");
  return originalPushState(...args);
};

createRoot(document.getElementById("root")).render(
  // <StrictMode>
  <ChakraProvider>
    <App />
  </ChakraProvider>,
  // </StrictMode>,
);
