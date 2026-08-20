/**
 * 全局系统配置文件
 */
const CONFIG = {
  // Cloudflare Worker 后端 API 根地址 (部署后替换为你的 Worker 域名)
  API_BASE: "https://text-cloud-api.chenpeng2015.workers.dev",
  
  // 密码登录状态保持时长选项 (单位: 毫秒)
  KEEP_ALIVE_OPTIONS: {
    ONE_HOUR: 3600000,
    ONE_DAY: 86400000,
    THIRTY_DAYS: 2592000000
  },

  // 默认文本编辑器配置
  EDITOR_DEFAULT: {
    FONT_SIZE: 20,
    FONT_FAMILY: "font-mono"
  }
};

// 冻结配置对象，防止运行时意外修改
Object.freeze(CONFIG);
