# 如你所见，这是目前互联网后端开发最常见且最原始的文件形式之一，Python文件
# 这行代码左边的井号是Python文件的注释形式

# 简单的说，后端开发就是负责创建网站或网页类应用中用户看不到的那一部分的工程
# 例如你在bilibili.com登录时，账号密码的验证、视频数据的存储、推荐算法的运行
# 这些在服务器端进行的处理，都是后端开发涵盖的部分

# 后端开发依赖的核心概念：
# 1，服务器（Server）
# 规范属性：服务器是一种计算机程序或设备，用于接收、处理和响应客户端请求。
# 在Web开发中，服务器通过HTTP/HTTPS协议与客户端（浏览器）通信，监听特定端口，
# 接收请求后执行相应的业务逻辑，并返回HTML、JSON、图片等资源。
# 工程化角色：作为后端的核心载体，承载应用程序的运行环境，负责请求分发、负载均衡、
# 安全防护等功能。常见的服务器软件有Nginx、Apache、Tomcat等。

# 2，数据库（Database）
# 规范属性：数据库是按照数据结构来组织、存储和管理数据的仓库。
# 分为关系型数据库（如MySQL、PostgreSQL、SQLite）和非关系型数据库（如MongoDB、Redis）。
# 通过SQL（结构化查询语言）或API进行数据的增删改查（CRUD）操作。
# 工程化角色：作为应用的数据持久层，存储用户信息、业务数据、日志记录等。
# 在现代应用中，数据库设计直接影响系统性能、数据一致性和可扩展性。

# 3，API（Application Programming Interface）
# 规范属性：API是一组定义和协议，用于构建和集成应用软件。
# 在Web开发中，最常见的是RESTful API，通过HTTP方法（GET、POST、PUT、DELETE）
# 对资源进行操作，通常以JSON格式交换数据。
# 工程化角色：作为前后端通信的桥梁，后端通过API暴露业务能力，前端通过API获取数据。
# 良好的API设计应遵循统一接口、无状态、可缓存等原则。

# 这三者共同构成后端开发的核心：服务器接收请求，API定义交互规则，数据库存储数据。
# 在实际开发中，后端还需要处理身份认证、权限控制、日志记录、错误处理等任务。

# 类比于前端开发的简明解释，下面是后端几个部分的简明解释：
# 服务器：挂号窗口，负责接收病人的请求（比如挂号、问诊），然后分配到对应的科室处理。
# 数据库：档案室，负责存储所有病人的信息、诊断记录、处方等数据，需要时可以查询和更新。
# API：各种表格和流程，规定了怎么挂号、怎么开药、怎么查询报告，让医患之间的沟通有章可循。

# 下面是示范代码
# 这个示范使用Python内置的http.server模块，创建一个最简单的Web服务器

# ============================================================
# 示范代码：一个简单的后端服务器，该后端代码的前端范例是位于同一个文件夹下的1,前端范例.html
# ============================================================

from http.server import HTTPServer, BaseHTTPRequestHandler
import json
from urllib.parse import urlparse, parse_qs

# 模拟数据库：用一个字典存储用户数据，实际上，在工业开发流程中数据库一般作为独立的插件化系统存在，这里简单处理，后续再进行详细展开
fake_database = {
    "users": [
        {"id": 1, "name": "XTSgreen", "age": 20, "major": "临床医学"},
        {"id": 2, "name": "wszwszwsz2", "age": 21, "major": "口腔医学"},
        {"id": 3, "name": "tiger", "age": 22, "major": "眼视光医学"}
    ]
}

# 定义请求处理器：这是后端的核心，决定如何响应不同的请求
class SimpleAPIHandler(BaseHTTPRequestHandler):
    
    # 添加CORS支持，允许跨域请求
    def send_headers(self):
        self.send_header("Content-type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
    
    # 处理OPTIONS请求（CORS预检）
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_headers()
        
    # 处理GET请求：通常用于获取数据
    def do_GET(self):
        # 解析URL路径
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
        # 路由：根据不同的路径返回不同的数据
        if path == "/":
            # 首页：返回欢迎信息
            self.send_response(200)
            self.send_headers()
            response = {"message": "欢迎来到后端开发示范服务器！", "hint": "访问 /users 查看用户列表"}
            self.wfile.write(json.dumps(response, ensure_ascii=False).encode("utf-8"))
            
        elif path == "/users":
            # 用户列表：从"数据库"获取所有用户
            self.send_response(200)
            self.send_headers()
            self.wfile.write(json.dumps(fake_database["users"], ensure_ascii=False).encode("utf-8"))
            
        else:
            # 404：路径不存在
            self.send_response(404)
            self.send_headers()
            response = {"error": "找不到该路径"}
            self.wfile.write(json.dumps(response, ensure_ascii=False).encode("utf-8"))
    
    # 处理POST请求：通常用于创建新数据
    def do_POST(self):
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
        if path == "/users":
            # 读取请求体中的数据
            content_length = int(self.headers.get("Content-Length", 0))
            post_data = self.rfile.read(content_length)
            
            try:
                # 解析JSON数据
                new_user = json.loads(post_data.decode("utf-8"))
                # 生成新ID
                new_user["id"] = len(fake_database["users"]) + 1
                # 存入"数据库"
                fake_database["users"].append(new_user)

                # 返回成功响应
                self.send_response(201)
                self.send_headers()
                self.wfile.write(json.dumps(new_user, ensure_ascii=False).encode("utf-8"))
                
            except json.JSONDecodeError:
                self.send_response(400)
                self.send_headers()
                response = {"error": "无效的JSON数据"}
                self.wfile.write(json.dumps(response, ensure_ascii=False).encode("utf-8"))
        else:
            self.send_response(404)
            self.send_headers()
            response = {"error": "找不到该路径"}
            self.wfile.write(json.dumps(response, ensure_ascii=False).encode("utf-8"))
    
    # 关闭默认的日志输出，保持简洁
    def log_message(self, format, *args):
        print(f"[请求] {self.address_string()} - {args[0]}")

# 主程序：启动服务器
if __name__ == "__main__":
    # 设置服务器地址和端口
    HOST = "localhost"
    PORT = 8080
    
    # 创建服务器实例
    server = HTTPServer((HOST, PORT), SimpleAPIHandler)
    
    print(f"后端服务器已启动！")
    print(f"访问地址: http://{HOST}:{PORT}")
    print(f"用户列表: http://{HOST}:{PORT}/users")
    print("按 Ctrl+C 停止服务器")
    print("-" * 50)
    
    # 运行服务器
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n服务器已停止")
        server.shutdown()

# =====================================================
# 如何测试这个后端服务器：
# =====================================================
# 1. 运行本文件：python 后端开发.py
# 2. 打开浏览器，访问 http://localhost:8080
# 3. 访问 http://localhost:8080/users 查看用户列表
# 4. 使用工具（如Postman）发送POST请求添加新用户：
#    POST http://localhost:8080/users
#    Body: {"name": "user_name", "age": 23, "major": "智能医学工程"}

# =======================================================
# 代码解释：
# =======================================================
# - HTTPServer：Python内置的HTTP服务器类，监听指定端口
# - BaseHTTPRequestHandler：请求处理器基类，我们继承它来实现自定义逻辑
# - do_GET：处理GET请求的方法，用于获取数据
# - do_POST：处理POST请求的方法，用于创建数据
# - send_response：设置HTTP状态码（200成功，404未找到，400错误请求）
# - send_header：设置响应头，告诉客户端返回的是JSON数据
# - json.dumps：将Python字典转换为JSON字符串
# - fake_database：模拟数据库，实际开发中会使用MySQL、MongoDB等

# =======================================================
# 一些常见的后端框架：
# =======================================================
# - Flask：轻量级框架，适合小型项目和快速原型开发
# - Django：全功能框架，适合大型项目，内置用户认证、后台管理等
# - FastAPI：现代高性能框架，自动生成API文档，支持异步
# - Express（Node.js）：JavaScript后端框架
# - Spring Boot（Java）：企业级Java框架

# =====================================================
# 推荐学习资源：
# =====================================================
# - Python入门：https://www.bilibili.com/video/BV1Jgf6YvE8e/
# - 后端开发基础：https://www.bilibili.com/video/BV1k4421Z7d2/
#实际上我很喜欢这种30分钟速成的课程，我认为这种课程可以为我打下一个对应领域的基础，然后通过项目进行深度学习与巩固
#这被称作项目式学习，现在已经在一些985高校的研究生教育阶段试点了

# 祝你早日奔向属于自己的山海！
