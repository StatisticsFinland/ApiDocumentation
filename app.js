const express = require("express");
const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const swaggerUi = require("swagger-ui-express");

const app = express();
const port = process.env.PORT || 3000;

/**
 * Define your routes. For each route you can:
 * - use `url` to point at a remote spec
 * - or use `file` to load a local YAML/JSON spec from the repo
 */
const routes = [
  { mount: "/docs/payments", name: "Payments API", url: "https://api.example.com/openapi/payments.yaml" },
  { mount: "/docs/users",    name: "Users API",    url: "https://api.example.com/openapi/users.json" }
];

// Helper to attach one Swagger UI per mount point
const attachSwagger = ({ mount, name, url, file }) => {
  if (url) {
    // remote spec: let Swagger UI fetch it directly
    app.use(
      mount,
      swaggerUi.serve,
      swaggerUi.setup(null, {
        customSiteTitle: `${name} — API Docs`,
        swaggerOptions: { url, deepLinking: true, docExpansion: "none" }
      })
    );
  } else if (file) {
    // local spec: load into memory
    const isYaml = file.endsWith(".yaml") || file.endsWith(".yml");
    const loaded = isYaml
      ? yaml.load(fs.readFileSync(file, "utf8"))
      : JSON.parse(fs.readFileSync(file, "utf8"));

    app.use(
      mount,
      swaggerUi.serve,
      swaggerUi.setup(loaded, {
        customSiteTitle: `${name} — API Docs`,
        explorer: true,
        swaggerOptions: { deepLinking: true, docExpansion: "none" }
      })
    );
  } else {
    throw new Error(`Route ${mount} must have either url or file`);
  }
};

routes.forEach(attachSwagger);

// optional landing page → list links
app.get("/", (req, res) => {
  const items = routes
    .map(r => `<li><a href="${r.mount}">${r.name}</a></li>`)
    .join("");
  res.send(`<h1>API Docs</h1><ul>${items}</ul>`);
});

app.get("/healthz", (_, res) => res.send("ok"));

app.listen(port, () => console.log(`Docs on :${port}`));
