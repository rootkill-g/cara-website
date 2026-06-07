/* @refresh reload */
import { render } from "solid-js/web";
import { Router, Route } from "@solidjs/router";

import App from "./App";
import Home from "./pages/Home";
import Architecture from "./pages/Architecture";
import Glyph from "./pages/Glyph";
import NotFound from "./pages/NotFound";
import "./index.css";

const root = document.getElementById("root");
if (!root) throw new Error("Root element #root not found");

render(
  () => (
    <Router root={App}>
      <Route path="/" component={Home} />
      <Route path="/architecture" component={Architecture} />
      <Route path="/glyph" component={Glyph} />
      <Route path="*" component={NotFound} />
    </Router>
  ),
  root,
);
