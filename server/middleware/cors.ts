export default defineEventHandler((event) => {
  const origin = getHeader(event, "origin");

  // Allow requests from Capacitor app (capacitor://localhost)
  // and any other origins (for development)
  setResponseHeaders(event, {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
    "Access-Control-Allow-Credentials": "true",
  });

  // Handle preflight OPTIONS requests
  if (event.method === "OPTIONS") {
    event.node.res.statusCode = 204;
    event.node.res.end();
  }
});
