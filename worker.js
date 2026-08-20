export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-Admin-Password",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // 🔒 设置您的管理密码（请将 admin123456 改为您自己的密码）
    const ADMIN_PASSWORD = env.ADMIN_PASSWORD || "2015";

    try {
      // 1. 公开访问接口：读取分享文件（免密码）
      if (path.startsWith("/sub/")) {
        const parts = path.split("/").slice(2);
        const token = parts[0];
        const filename = decodeURIComponent(parts.slice(1).join("/"));

        const metaObj = await env.MY_R2.get(`_meta/tokens/${token}.json`);
        if (!metaObj) return new Response("404 Invalid Token", { status: 404 });

        const meta = await metaObj.json();
        if (meta.filename !== filename) {
          return new Response("404 File Not Found", { status: 404 });
        }

        const file = await env.MY_R2.get(`files/${meta.fileId}`);
        if (!file) return new Response("File Empty or Deleted", { status: 404 });

        const content = await file.text();
        return new Response(content, {
          headers: { "Content-Type": "text/plain; charset=utf-8", ...corsHeaders }
        });
      }

      // ----------------- 以下接口需要密码校验 -----------------
      const clientPassword = request.headers.get("X-Admin-Password");
      
      // 2. 验证密码接口
      if (path === "/api/auth/verify" && request.method === "POST") {
        if (clientPassword === ADMIN_PASSWORD) {
          return Response.json({ success: true }, { headers: corsHeaders });
        } else {
          return Response.json({ success: false, message: "密码错误" }, { status: 401, headers: corsHeaders });
        }
      }

      // 密码拦截：除公开接口外，其余 API 必须携带正确密码
      if (clientPassword !== ADMIN_PASSWORD) {
        return Response.json({ error: "Unauthorized: 密码不正确" }, { status: 401, headers: corsHeaders });
      }

      // 3. 获取节点列表（文件和文件夹）
      if (path === "/api/files" && request.method === "GET") {
        const list = await env.MY_R2.list({ prefix: "meta/" });
        const items = [];
        for (const object of list.objects) {
          const res = await env.MY_R2.get(object.key);
          if (res) items.push(await res.json());
        }
        return Response.json(items, { headers: corsHeaders });
      }

      // 4. 保存/更新 节点
      if (path === "/api/files/save" && request.method === "POST") {
        const data = await request.json();
        
        const metaData = { 
          id: data.id, 
          name: data.name, 
          type: data.type || 'file', 
          parentId: data.parentId || null,
          token: data.token || "" 
        };
        await env.MY_R2.put(`meta/${data.id}.json`, JSON.stringify(metaData));

        if (data.type === 'file') {
          await env.MY_R2.put(`files/${data.id}`, data.content || "");
        }

        if (data.token && data.type === 'file') {
          await env.MY_R2.put(`_meta/tokens/${data.token}.json`, JSON.stringify({
            fileId: data.id,
            filename: data.name
          }));
        }

        return Response.json({ success: true }, { headers: corsHeaders });
      }

      // 5. 删除节点
      if (path.startsWith("/api/files/") && request.method === "DELETE") {
        const id = path.replace("/api/files/", "");
        await env.MY_R2.delete(`meta/${id}.json`);
        await env.MY_R2.delete(`files/${id}`);
        return Response.json({ success: true }, { headers: corsHeaders });
      }

      return new Response("API Running", { headers: corsHeaders });
    } catch (err) {
      return new Response(err.message, { status: 500, headers: corsHeaders });
    }
  }
};
