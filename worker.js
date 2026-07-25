export default {
  async fetch(request, env, ctx) {
    // 1. Handle browser CORS preflight requests
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    // 2. Handle the POST submission from your dashboard
    if (request.method === "POST") {
      try {
        const body = await request.json();
        
        // OPTIONAL: If you want to forward the incoming data to your Discord/Telegram webhook, 
        // you can place a fetch() call here pointing to your webhook URL using body data.

        // Return a successful response back to your website frontend
        return new Response(JSON.stringify({ success: true }), {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        });
      } catch (err) {
        return new Response(JSON.stringify({ success: false, error: err.message }), {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        });
      }
    }

    return new Response("Method not allowed", { status: 405 });
  },
};
