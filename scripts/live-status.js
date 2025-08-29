const chalk = require("chalk");
const http = require("http");

async function check(pathname, method = "GET") {
  return new Promise(res => {
    const req = http.request(
      { hostname: "localhost", port: 3000, path: pathname, method },
      r => {
        let data = "";
        r.on("data", d => (data += d));
        r.on("end", () => res({ status: r.statusCode, body: data }));
      }
    );
    req.on("error", e => res({ error: e.message }));
    req.end();
  });
}

async function loop() {
  console.clear();
  console.log(chalk.cyan.bold("📡 LIVE STATUS MONITOR\n"));

  const health = await check("/api/health");
  console.log("✅ /api/health:", health);

  const qh = await check("/api/quantum/health");
  console.log("⚡ /api/quantum/health:", qh);

  const qe = await check("/api/quantum/execute", "POST");
  console.log("🧮 /api/quantum/execute:", qe);

  console.log(chalk.gray("\nAktualisiert:", new Date().toLocaleTimeString()));
}

// alle 1 Sekunde aktualisieren
setInterval(loop, 1000);
loop();
