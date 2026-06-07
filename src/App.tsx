import type { ParentComponent } from "solid-js";
import { useLocation } from "@solidjs/router";
import { createEffect } from "solid-js";
import Nav from "./components/Nav";
import Footer from "./components/Footer";

// Root layout. The router mounts each page into `props.children`.
const App: ParentComponent = (props) => {
  const location = useLocation();

  // Scroll to top on route change.
  createEffect(() => {
    location.pathname;
    window.scrollTo({ top: 0 });
  });

  return (
    <div class="flex min-h-dvh flex-col bg-ink-950">
      <Nav />
      <main class="flex-1">{props.children}</main>
      <Footer />
    </div>
  );
};

export default App;
