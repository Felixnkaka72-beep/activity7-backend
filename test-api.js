// Automatic API check. Needs Node 18 or newer (no packages to install).
// Local:   node test-api.js
// Hosted:  node test-api.js https://your-backend.onrender.com
const base = (process.argv[2] || "http://localhost:3000").replace(/\/+$/, "");
let passed = 0, failed = 0;

function check(name, ok) {
  console.log((ok ? "PASS  " : "FAIL  ") + name);
  ok ? passed++ : failed++;
}

async function call(method, path, body, rawBody) {
  const options = { method, headers: {} };
  if (rawBody !== undefined) { options.headers["Content-Type"] = "application/json"; options.body = rawBody; }
  else if (body !== undefined) { options.headers["Content-Type"] = "application/json"; options.body = JSON.stringify(body); }
  const response = await fetch(base + path, options);
  const text = await response.text();
  let json = null;
  try { json = JSON.parse(text); } catch (error) { /* not JSON */ }
  return { status: response.status, json, text };
}

// A sleeping free host can take about a minute to wake up, so try the health route a few times.
async function waitForServer() {
  for (let attempt = 1; attempt <= 8; attempt++) {
    try { return await call("GET", "/health"); }
    catch (error) {
      console.log("Waiting for " + base + " (attempt " + attempt + " of 8)...");
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }
  return null;
}

(async () => {
  console.log("Testing " + base + "\n");
  const health = await waitForServer();
  if (!health) { console.log("Could not reach the server. Is it running, and is the address correct?"); process.exit(1); }

  const good = { title: "  Cracked window  ", category: "Furniture", description: "Window in Room B3 is cracked", status: "Pending" };
  const unusedId = "999999999";

  check("GET /health returns 200 and database connected", health.status === 200 && health.json && health.json.status === "ok");
  const guide = await call("GET", "/");
  check("GET / returns an HTML guide mentioning /api/records", guide.status === 200 && /\/api\/records/.test(guide.text) && /<html/i.test(guide.text));

  const list = await call("GET", "/api/records");
  const countBefore = Array.isArray(list.json) ? list.json.length : -1;
  check("GET /api/records returns 200 and an array", list.status === 200 && Array.isArray(list.json));

  const created = await call("POST", "/api/records", { ...good, id: 999999 });
  const id = created.json && created.json.id;
  check("POST valid body returns 201 and a new id (client id ignored)", created.status === 201 && Number.isInteger(id) && id !== 999999);
  check("POST trims spaces from text", created.json && created.json.title === "Cracked window");

  const one = await call("GET", "/api/records/" + id);
  check("GET one returns 200 and the exact record", one.status === 200 && one.json.id === id && one.json.title === "Cracked window" && one.json.status === "Pending");

  const updated = await call("PUT", "/api/records/" + id, { title: "Window repaired", category: "Furniture", description: "Glass replaced in Room B3", status: "Completed" });
  check("PUT returns 200, changed values and the original id", updated.status === 200 && updated.json.id === id && updated.json.title === "Window repaired" && updated.json.status === "Completed");

  const removed = await call("DELETE", "/api/records/" + id);
  check("DELETE returns 200 and the deletion message", removed.status === 200 && removed.json && removed.json.message === "Record deleted.");
  const gone = await call("GET", "/api/records/" + id);
  check("GET the deleted id returns 404 with a message", gone.status === 404 && gone.json && !!gone.json.message);

  const noTitle = await call("POST", "/api/records", { category: "Furniture", description: "Window in Room B3 is cracked", status: "Pending" });
  check("POST with missing title returns 400 and a message", noTitle.status === 400 && noTitle.json && !!noTitle.json.message);
  const badStatus = await call("POST", "/api/records", { ...good, status: "Done" });
  check("POST with invalid status returns 400", badStatus.status === 400 && badStatus.json && !!badStatus.json.message);
  const spaces = await call("POST", "/api/records", { title: "   ", category: "  ", description: "     ", status: "Pending" });
  check("POST with spaces only returns 400", spaces.status === 400);
  const notText = await call("POST", "/api/records", { ...good, title: 12345 });
  check("POST with a non-text title returns 400", notText.status === 400);
  const after = await call("GET", "/api/records");
  check("Invalid requests created no new rows", Array.isArray(after.json) && after.json.length === countBefore);

  const badId = await call("GET", "/api/records/abc");
  check("Invalid id (abc) returns 400 and a JSON message", badId.status === 400 && badId.json && !!badId.json.message);
  const badJson = await call("POST", "/api/records", undefined, '{ "title": ');
  check("Malformed JSON returns 400 and a JSON message", badJson.status === 400 && badJson.json && !!badJson.json.message);

  const g = await call("GET", "/api/records/" + unusedId);
  const p = await call("PUT", "/api/records/" + unusedId, good);
  const d = await call("DELETE", "/api/records/" + unusedId);
  check("Unused id returns 404 for GET one, PUT and DELETE", g.status === 404 && p.status === 404 && d.status === 404);

  const unknown = await call("GET", "/no-such-route");
  check("Unknown route returns 404 as JSON", unknown.status === 404 && unknown.json && !!unknown.json.message);

  console.log("\n" + passed + " passed, " + failed + " failed.");
  console.log("Still to check by hand: create a record, restart the server, and confirm the record is still there.");
  process.exit(failed === 0 ? 0 : 1);
})();
