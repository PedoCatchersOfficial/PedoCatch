export default {
  async fetch(request, env, ctx) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    if (request.method === "POST") {
      try {
        const body = await request.json();
        
        let evidenceList = "None provided";
        try {
          if (body.evidence && body.evidence !== "None provided") {
            const parsedFiles = JSON.parse(body.evidence);
            evidenceList = parsedFiles.map(f => `• ${f.name} (${(f.size / 1024).toFixed(1)} KB)`).join("\n");
          }
        } catch (e) {
          evidenceList = "Attached files processed.";
        }

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

        // Fallback directly to your webhook URL if env.WEBHOOK_URL is undefined
        const targetWebhook = (env && env.WEBHOOK_URL) ? env.WEBHOOK_URL : "YOUR_DISCORD_WEBHOOK_URL";

        const webhookResponse = await fetch(targetWebhook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(discordPayload)
        });

        if (!webhookResponse.ok) {
          throw new Error("Failed to dispatch to destination webhook endpoint.");
        }

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
