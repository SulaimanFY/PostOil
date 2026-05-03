// App entry point. I register every page renderer against its hash
// route, then start the router.
import { registerRoute, startRouter } from "./router.js";
import { renderLanding } from "./pages/landing.js";
import { renderOverview } from "./pages/overview.js";
import { renderCountry } from "./pages/country.js";
import { renderMethodology } from "./pages/methodology.js";

registerRoute("/", renderLanding);
registerRoute("/overview", renderOverview);
registerRoute("/country/:slug", renderCountry);
registerRoute("/methodology", renderMethodology);

startRouter();
