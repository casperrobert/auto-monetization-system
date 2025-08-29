import React from "react";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import AISettings from "./pages/AISettings";
import AIIntegration from "./pages/AIIntegration";
import StreamConfig from "./pages/StreamConfig";
import "./i18n";

const darkTheme = createTheme({
  palette: { mode: "dark" }
});

function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/ai" element={<AIIntegration />} />
          <Route path="/streams" element={<StreamConfig />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
