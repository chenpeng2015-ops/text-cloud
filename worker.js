/**
 * Cloudflare Worker 后端完整逻辑 (v2.0)
 * 依赖 KV Namespace: TEXT_KV
 */

// 1. 设置环境变量密码（若环境变量未设置，使用默认备用密码）
const ADMIN_PASSWORD_ENV = typeof ADMIN_PASSWORD !== 'undefined' ? ADMIN_PASSWORD : "your_admin_password_here";

// CORS 跨域响应头配置
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Password',
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // 处理 OPTIONS 预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const kv = env.TEXT_KV;
    const adminPassword = env.ADMIN_PASSWORD || ADMIN_PASSWORD_ENV;

    try {
      // -------------------------------------------------------------
      // 公开接口：订阅 / 纯文本拉取 (免密)
      // 路由规范：/sub/:token/:filename
      // -------------------------------------------------------------
      if (path.startsWith('/sub/')) {
        const parts = path.split('/');
        const token = parts[2];
        if (!token) return new Response('Invalid Token', { status: 400 });

        const content = await kv.get(`content:${token}`);
        if (content === null) {
          return new Response('File Not Found', { status: 404 });
        }

        return new Response(content, {
          headers: {
            ...corsHeaders,
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'no-cache'
          }
        });
      }

      // -------------------------------------------------------------
      // 权限验证中间件 (后续 API 接口统一验证密码)
      // -------------------------------------------------------------
      const clientPassword = request.headers.get('X-Admin-Password');
      
      // 登录校验接口
      if (path === '/api/auth/verify' && request.method === 'POST') {
        if (clientPassword === adminPassword) {
          return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        } else {
          return new Response(JSON.stringify({ success: false, message: 'Password incorrect' }), { status: 401, headers: corsHeaders });
        }
      }

      // 拦截未授权身份
      if (clientPassword !== adminPassword) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
      }

      // -------------------------------------------------------------
      // 管理 API：文件及元数据操作
      // -------------------------------------------------------------

      // 1. 获取所有文件树元数据
      if (path === '/api/files' && request.method === 'GET') {
        const filesJson = await kv.get('system:file_tree');
        const files = filesJson ? JSON.parse(filesJson) : [];
        return new Response(JSON.stringify(files), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // 2. 保存/更新节点元数据 (元数据存入主列表)
      if (path === '/api/files/save' && request.method === 'POST') {
        const item = await request.json();
        let filesJson = await kv.get('system:file_tree');
        let files = filesJson ? JSON.parse(filesJson) : [];

        const index = files.findIndex(f => f.id === item.id);
        if (index > -1) {
          files[index] = { ...files[index], ...item };
        } else {
          files.push(item);
        }

        await kv.put('system:file_tree', JSON.stringify(files));
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      // 3. 保存文件文本内容 (按 token 隔离存入 KV)
      if (path === '/api/files/content' && request.method === 'POST') {
        const { token, content } = await request.json();
        if (!token) return new Response('Token Required', { status: 400 });

        await kv.put(`content:${token}`, content || '');
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      // 4. 删除单个文件或文件夹
      if (path.startsWith('/api/files/') && request.method === 'DELETE') {
        const id = path.replace('/api/files/', '');
        let filesJson = await kv.get('system:file_tree');
        let files = filesJson ? JSON.parse(filesJson) : [];

        const target = files.find(f => f.id === id);
        if (target && target.token) {
          await kv.delete(`content:${target.token}`);
        }

        files = files.filter(f => f.id !== id);
        await kv.put('system:file_tree', JSON.stringify(files));

        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      return new Response('Not Found', { status: 404, headers: corsHeaders });

    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
    }
  }
};
