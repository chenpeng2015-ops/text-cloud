第一步：部署 Cloudflare Worker 后端
登录 Cloudflare：打开并登录 Cloudflare 控制台。

进入 Workers 页面：在左侧导航栏点击 Workers 和 Pages（Workers & Pages） -> 点击 创建应用程序（Create Application） -> 选择 创建 Worker（Create Worker）。

命名并部署初始模板：

为你的 Worker 取一个名字（例如 my-text-cloud）。

点击 部署（Deploy）。

绑定 KV 数据库（核心）：

返回左侧菜单 Workers 和 Pages 下的 KV 页面。

点击 创建命名空间（Create a namespace），命名为 TEXT_KV（必须全大写且拼写一致），点击添加。

返回你刚才创建的 Worker（my-text-cloud）页面，点击 设置（Settings）选项卡 -> 变量（Variables）。

找到 KV 命名空间绑定（KV Namespace Bindings），点击 添加绑定（Add binding）：

变量名称（Variable name）：输入 TEXT_KV

KV 命名空间：选择你刚创建的 TEXT_KV

（可选）在 环境变量（Environment Variables）中添加：

变量名称：ADMIN_PASSWORD

值：设置你的自定义密码（如不设置，将默认使用脚本中的备用密码）。

点击 保存并部署（Save and deploy）。

部署代码：

在 Worker 页面点击右上角的 编辑代码（Edit code）。

清空编辑器中的原有代码，粘贴之前给你的 worker.js 完整代码。

点击右上角的 保存并部署（Save and Deploy）。

获取 API 域名：

部署成功后，复制该 Worker 的完整访问域名（例如 [https://my-text-cloud.xxx.workers.dev](https://my-text-cloud.xxx.workers.dev)）。

第二步：配置前端文件
修改 config.js：

打开 config.js 文件。

将 API_BASE 的值修改为你第一步中获取的 Worker 域名：

JavaScript
const CONFIG = {
  API_BASE: "https://my-text-cloud.xxx.workers.dev", // 替换为你的实际 Worker 域名，结尾不要带斜杠 /
  ...
};
确认文件目录结构：
将以下三个文件放在同一本地文件夹中：

Plaintext
├── config.js
├── index.html
└── worker.js (已上传至 Cloudflare，本地留存备份即可)
第三步：部署前端页面
你有两种常见的方式部署前端：

方案 A：使用 Cloudflare Pages 静态托管（推荐，免费且速度快）
返回 Cloudflare 控制台，进入 Workers 和 Pages -> 创建应用程序。

选择 Pages 选项卡 -> 选择 上传资产（Upload assets）。

为页面取一个项目名称，然后将包含 index.html 和 config.js 的文件夹直接拖拽上传。

点击 部署站点 即可获得一个专属的前端访问域名。

方案 B：本地直接打开或部署至任意服务器/NAS
本地使用：因为使用了 CDN 引入依赖，只需将 index.html 和 config.js 保存在本地，直接双击 index.html 用浏览器打开即可使用。

自建服务器：将 index.html 与 config.js 放置在 Nginx、宝塔或任意 Web 服务器的根目录下即可。

第四步：首次登录与使用
打开部署好的前端页面。

在弹出的密码框中输入你在 Worker 环境变量中设置的密码（若未设置则输入 your_admin_password_here）。

选择登录保活时间并点击 登录，即可开始创建文件和文件夹。
