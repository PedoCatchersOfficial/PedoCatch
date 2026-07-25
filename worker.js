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
        
        // Parse attached evidence files if provided
        let evidenceList = "None provided";
        try {
          if (body.evidence && body.evidence !== "None provided") {
            const parsedFiles = JSON.parse(body.evidence);
            evidenceList = parsedFiles.map(f => `• ${f.name} (${(f.size / 1024).toFixed(1)} KB)`).join("\n");
          }
        } catch (e) {
          evidenceList = "Attached files processed.";
        }

        // Format a clean, detailed message for your Discord webhook
        const discordPayload = {
          embeds: [
            {
              title: "🚨 New Incident / Evidence Report",
              color: 0xffffff,
              fields: [
                { name: "Target Identifier", value: `\`\`\`${body.targetContact}\`\`\``, inline: false },
                { name: "Incident Description", value: body.details, inline: false },
                { name: "Evidence Files Attached", value: evidenceList, inline: false }
              ],
              timestamp: new Date().toISOString()
            }
          ]
        };

        // Ensure the secret exists before fetching
        if (!env.WEBHOOK_URL) {
          throw new Error("WEBHOOK_URL secret is not bound in Cloudflare.");
        }

        // Forward the payload to your webhook using the secure Cloudflare secret
        const webhookResponse = await fetch(env.WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(discordPayload)
        });

        if (!webhookResponse.ok) {
          throw new Error("Failed to dispatch to destination webhook endpoint.");
        }

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
