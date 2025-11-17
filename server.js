const http = require("http");
const fs = require("fs");
const path = require("path");

const port = process.env.PORT || 8080;
const root = __dirname;

const mime = {
  ".html": "text/html; charset=UTF-8",
  ".css": "text/css; charset=UTF-8",
  ".js": "application/javascript; charset=UTF-8",
  ".json": "application/json; charset=UTF-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

http
  .createServer((req, res) => {
    let urlPath = req.url.split("?")[0];
    if (urlPath === "/" || urlPath === "") urlPath = "/index.html";
    const filePath = path.join(root, urlPath);
    const ext = path.extname(filePath).toLowerCase();
    const type = mime[ext] || "application/octet-stream";

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(err.code === "ENOENT" ? 404 : 500, {
          "Content-Type": "text/plain; charset=UTF-8",
        });
        res.end(err.code === "ENOENT" ? "Not Found" : "Server Error");
        return;
      }
      res.writeHead(200, { "Content-Type": type, "Cache-Control": "no-cache" });
      res.end(data);
    });
  })
  .listen(port, () => {
    console.log(`Momentum running at http://localhost:${port}`);
  });
