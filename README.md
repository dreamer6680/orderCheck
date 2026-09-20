# OrderCheck · 订单与库存协同管理系统

OrderCheck 是面向包装用品贸易业务的前后端分离管理系统，围绕**商品、库存、客户订单、仓库出入库与异常履约**建立统一的业务流程。业务人员创建和核查订单，仓库人员记录入库并执行出库，负责人管理商品、用户及系统配置，工作台展示从后端获取的业务数据。

> 本文档是**前后端整体项目入口**，以两端 `main` 分支为基准。项目当前由两个独立 Git 仓库组成，并不是单仓库。

## 1. 仓库与技术栈

| 部分 | 仓库 | 技术 |
| --- | --- | --- |
| Web 前端 | [orderCheck](https://github.com/dreamer6680/orderCheck/tree/main) | Next.js 16.3.3 App Router、React 19、TypeScript、Tailwind CSS 4、Zustand、shadcn/ui、Orval |
| Java 后端 | [orderCheck-Backend](https://github.com/dreamer6680/orderCheck-Backend/tree/main) | Java 21、Spring Boot 3.5.6、Spring Security、Spring Data JPA、PostgreSQL、Flyway、JWT、springdoc OpenAPI |

后端仓库的 GitHub 默认分支目前仍可能显示为 `master`；**本说明中的后端代码和配置均指向 `main`**。切换到其他分支时，功能、迁移文件和演示账号配置可能不同。

## 2. 解决的问题与主要功能

纸箱、胶带等商品的销售与仓库执行容易因表格和聊天消息分散，出现库存不清、订单计划与实际出库数量不一致、交接遗漏等问题。本项目通过以下模块衔接业务操作：

| 模块 | 主要功能 |
| --- | --- |
| 工作台 | 待核查订单、待出库订单、异常订单、低库存概览；仓库执行进度由后端接口统计 |
| 商品管理 | 商品 SKU、名称、单位、安全库存和启用状态维护 |
| 库存与入库 | 查看实物／可用库存，登记商品入库与入库记录 |
| 客户订单 | 创建订单、按状态和关键词查询、库存核查、修改交付日期与取消订单 |
| 待出库任务 | 查看及核查任务、调整计划出库日期、登记实际出库数量 |
| 异常订单 | 处理库存不足、部分出库、补发、客户接受少交及无法交付等情况 |
| 用户与设置 | 管理用户角色、启停账号和重置密码；维护系统设置 |

### 典型业务流程

1. 负责人先维护商品；仓库人员登记入库，系统形成库存数据。
2. 业务人员创建客户订单，提交库存核查。库存充足时进入待出库流程；库存不足时进入异常处理流程。
3. 仓库人员查看待出库任务，核查库存并确认实际出库量。实际量与计划量不一致时，需要记录差异原因。
4. 业务人员跟进异常订单，按实际情况安排分批交付、补发、重新核查、接受少交或确认无法交付。
5. 工作台通过 `GET /api/dashboard/warehouse-progress` 获取入库、交付、差异及异常订单统计，而不是使用静态模拟指标。

订单状态包括 `PENDING_CHECK`（待核查）、`PENDING_OUTBOUND`（待出库）、`ABNORMAL`（异常）、`COMPLETED`（已完成）和 `CANCELLED`（已取消）。出库任务另有 `PENDING`、`COMPLETED`、`CANCELLED` 状态；**订单与出库任务不是同一种记录**。

## 3. 系统结构

```text
浏览器
  │  http://localhost:3000
  ▼
Next.js 前端（orderCheck）
  ├─ app/                     页面与 App Router
  ├─ components/              页面组件和 UI 组件
  ├─ lib/store/               Zustand 登录态与业务状态
  ├─ lib/permissions.ts       前端路由与操作权限
  ├─ lib/api/                 API 调用及生成的类型／客户端
  └─ app/backend/[...path]/   服务器端反向代理
            │ /backend/api/* → /api/*
            ▼
Spring Boot 后端（orderCheck-Backend，默认 localhost:8080）
  ├─ Controller / Service / Repository
  ├─ Spring Security + JWT + 角色权限
  ├─ Spring Data JPA
  └─ Flyway → PostgreSQL（默认 localhost:5432/packflow）
```

前端请求默认使用同源 `/backend` 前缀，Next.js 的代理路由根据 `BACKEND_URL` 转发到 Java 服务，并传递 `Authorization` 等请求头。前端的 `NEXT_PUBLIC_API_BASE_URL` 默认是 `/backend`，如需自定义，必须与实际代理或 API 网关的路由对应。

后端提供 REST API；前端 `orval.config.ts` 从 `http://localhost:8080/v3/api-docs` 读取 OpenAPI 文档，生成 `lib/api/generated/index.ts`。手写客户端位于 `lib/api/` 与 `lib/api-client.ts`。

## 4. 本地运行

### 环境要求

- Java 21、可运行的 PostgreSQL，以及 Docker（运行使用 Testcontainers 的后端集成测试时需要）。
- Node.js、pnpm；前端 `package.json` 声明的包管理器版本为 `pnpm@12.3.4`。
- 分别打开两个终端运行前端与后端。默认端口为前端 `3000`、后端 `8080`、PostgreSQL `5432`。

### 步骤一：拉取仓库

```bash
git clone --branch main https://github.com/dreamer6680/orderCheck.git
git clone --branch main https://github.com/dreamer6680/orderCheck-Backend.git
```

### 步骤二：准备 PostgreSQL

确保本地 PostgreSQL 已启动，并创建开发数据库及账号。例如，在有管理权限的 `psql` 会话中执行：

```sql
CREATE ROLE packflow LOGIN PASSWORD 'packflow';
CREATE DATABASE packflow OWNER packflow;
```

这组用户名和密码仅用于**本机开发演示**；已有数据库时请使用自己的连接信息。后端默认连接 `jdbc:postgresql://localhost:5432/packflow`。不需要手动执行迁移 SQL，也不要删除已有数据库的 `flyway_schema_history` 表。

### 步骤三：启动后端

```bash
cd orderCheck-Backend
./mvnw spring-boot:run
```

Windows PowerShell 使用 `.\mvnw.cmd spring-boot:run`，也可以在 IntelliJ IDEA 中启动 `PackFlowApplication`。默认 Spring Profile 为 `local`；后端会按 `src/main/resources/application.yaml` 连接数据库、执行 Flyway 迁移并准备本地演示账号。

后端启动后可访问：

- 健康检查：[http://localhost:8080/actuator/health](http://localhost:8080/actuator/health)
- Swagger UI：[http://localhost:8080/swagger-ui/index.html](http://localhost:8080/swagger-ui/index.html)
- OpenAPI JSON：[http://localhost:8080/v3/api-docs](http://localhost:8080/v3/api-docs)

### 步骤四：启动前端

```bash
cd orderCheck
pnpm install
pnpm dev
```

浏览器打开 [http://localhost:3000/login](http://localhost:3000/login)。前端开发时必须确保后端已在配置的地址运行；若后端不在 `localhost:8080`，请在启动前端的终端设置 `BACKEND_URL`，例如 `http://localhost:8081`。

### 本地演示账号

以下账号仅在后端 `local` Profile 下由启动逻辑创建或启用；密码可在 `application.yaml` 的本地配置段通过环境变量覆盖。

| 用户名 | 默认密码 | 角色 |
| --- | --- | --- |
| `sales` | `sales123` | SALES · 业务人员 |
| `warehouse` | `warehouse123` | WAREHOUSE · 仓库人员 |
| `manager` | `manager123` | MANAGER · 负责人 |
| `admin` | `123456` | MANAGER · 本地演示管理员 |

登录页提供了 `sales`、`warehouse`、`admin` 的账号快捷填充。**这些公开的开发账号和本地 JWT 密钥不能用于生产环境或真实业务数据。** 生产环境请自行创建账号并使用独立密钥。

## 5. 角色权限

| 能力 | SALES | WAREHOUSE | MANAGER |
| --- | :---: | :---: | :---: |
| 查看工作台及商品 | ✓ | ✓ | ✓ |
| 查看库存数量 | ✓ | ✓ | ✓ |
| 创建／核查／处理客户订单 | ✓ | — | ✓ |
| 登记入库 | — | ✓ | ✓ |
| 查看／执行出库任务 | — | ✓ | ✓ |
| 维护商品主数据 | — | — | ✓ |
| 用户与系统管理 | — | — | ✓ |

业务人员通过 `/api/inventory/quantities` 查看库存数量，不应访问仓库专用的完整库存或出库任务接口。前端 `lib/permissions.ts` 控制页面与操作可见性；**最终权限由后端 Spring Security 的角色校验决定**，前端隐藏按钮不能代替服务端鉴权。

## 6. API 与联调

下表列出主要接口；完整请求／响应模型和其余操作以运行中的 Swagger／OpenAPI 为准。

| 方法 | 后端接口 | 用途 |
| --- | --- | --- |
| POST | `/api/auth/login` | 登录并获取 JWT |
| GET | `/api/auth/me` | 查询当前登录用户 |
| GET、POST | `/api/orders` | 查询、创建客户订单 |
| POST | `/api/orders/{id}/check-inventory` | 核查订单库存 |
| GET | `/api/orders/abnormal` | 查询异常订单 |
| GET、POST | `/api/inventory/inbounds` | 查询、登记入库 |
| GET | `/api/inventory/quantities` | 查看库存数量 |
| GET | `/api/outbound-records` | 查询出库任务 |
| GET | `/api/outbound-records/{id}/check-inventory` | 核查出库可执行性 |
| POST | `/api/outbound-records/{id}/complete` | 确认出库 |
| GET | `/api/dashboard/warehouse-progress` | 仓库执行进度统计 |
| GET、POST | `/api/products` | 商品列表／新增商品 |
| GET | `/api/admin/users` | 用户管理（负责人） |

> 出库任务以 `GET /api/outbound-records` 查询；确认出库使用其具体任务子路径，不能直接向集合路径发送 POST 来替代确认操作。

取得 JWT 后，调用需要登录的接口时传入 `Authorization: Bearer <token>`。浏览器联调时，后端 `/api/orders` 对应前端同源地址 `/backend/api/orders`；使用 Swagger 或直接请求 Java 服务时不添加 `/backend` 前缀。

后端启动后如需重新生成 API 客户端：

```bash
cd orderCheck
pnpm api:generate
```

生成前检查 `http://localhost:8080/v3/api-docs` 可访问。不要手工修改 `lib/api/generated/index.ts`；新增或变更接口时以最新后端 OpenAPI 为准，同步调整必要的手写客户端及页面。

## 7. 配置与数据库迁移

后端配置集中于 `orderCheck-Backend/src/main/resources/application.yaml`，按 `local`、`prod` Profile 区分。常见配置如下：

| 配置项／环境变量 | 说明 |
| --- | --- |
| `DATABASE_URL`、`DATABASE_USERNAME`、`DATABASE_PASSWORD` | PostgreSQL 连接信息 |
| `SPRING_PROFILES_ACTIVE` | 运行环境；本地默认 `local`，生产显式指定 `prod` |
| `JWT_SECRET` | 生产 JWT 签名密钥，必须从部署环境提供 |
| `JWT_EXPIRATION` | JWT 有效期，单位毫秒；默认 `86400000` |
| `WAREHOUSE_TIME_ZONE` | 仓库业务日期对应的时区；默认 `Asia/Shanghai` |
| `DEMO_ADMIN_PASSWORD`、`DEMO_SALES_PASSWORD`、`DEMO_WAREHOUSE_PASSWORD`、`DEMO_MANAGER_PASSWORD` | 仅 `local` 下的演示账号密码 |
| `BACKEND_URL` | Next.js 服务端代理的 Java API 根地址，默认 `http://localhost:8080` |
| `NEXT_PUBLIC_API_BASE_URL` | 浏览器 API 前缀，默认 `/backend` |

生产环境必须显式启用 `prod`，提供数据库凭据与独立 `JWT_SECRET`；不要将开发密码、真实凭据或生产密钥提交进 Git。当前前端登录态存储在浏览器 `localStorage`，部署到真实业务环境前还应结合实际安全需求审查登录态与会话处理。

**Flyway 负责数据库版本管理。** 新数据库启动时执行仓库当前保留的合并迁移；已有数据库依靠 `flyway_schema_history` 追踪已执行版本。当前后端 `main` 配置了 `spring.flyway.ignore-migration-patterns: "*:missing"`，用于兼容合并迁移后旧脚本不再存在的历史记录。这不是清空迁移表或直接删除旧业务库的理由。后端同时配置了 `spring.jpa.hibernate.ddl-auto: validate`，由 Flyway 维护结构、JPA 校验结构。

## 8. 开发与验证

```bash
# 后端：Java 21；集成测试需要 Docker / Testcontainers
cd orderCheck-Backend
./mvnw test

# 前端
cd ../orderCheck
pnpm install
pnpm exec tsc --noEmit
pnpm build
```

在 Windows 上将 `./mvnw` 换为 `.\mvnw.cmd`。前端目前的 `package.json` **没有单独的 `lint` 或 `test` 脚本**；不要把不存在的脚本当成项目验收命令。另需注意 `next.config.ts` 设置了 `typescript.ignoreBuildErrors: true`，因此 `pnpm build` 成功**不代表**类型检查通过，应单独执行 `pnpm exec tsc --noEmit`。

推荐的联调顺序是：登录 → 新增商品 → 入库 → 创建订单 → 库存核查 → 出库确认 → 异常处理 → 工作台指标核对，并分别验证三类角色的服务端访问权限。

## 9. 常见问题

- **前端页面显示 502／接口连接失败：** 先检查 `localhost:8080/actuator/health`；确认前端进程的 `BACKEND_URL` 与后端实际地址一致。
- **Swagger 或接口返回 401：** Swagger 文档路径在后端安全配置中允许匿名访问；实际业务接口需要 JWT。检查是否启动了预期的后端分支与进程。
- **启动报数据库连接错误：** 检查 PostgreSQL 服务、`packflow` 数据库／账号和连接参数。
- **迁移校验失败：** 先核对使用的是后端 `main` 及现有 `flyway_schema_history`；不要为排除错误直接删库或删除迁移历史表。
- **登录后操作被拒绝：** 检查当前账号角色及接口所需权限。若修改了本地演示密码，重新登录取得新令牌。
- **页面数据与接口字段不一致：** 在后端更新后重新执行 `pnpm api:generate`，并检查尚未迁移到自动生成客户端的手写 API 调用。

## 10. 仓库说明

- [前端源码与问题反馈](https://github.com/dreamer6680/orderCheck)
- [后端源码与 Java 专项说明](https://github.com/dreamer6680/orderCheck-Backend/tree/main)
- [后端配置文件](https://github.com/dreamer6680/orderCheck-Backend/blob/main/src/main/resources/application.yaml)

本 README 描述的是当前代码中的功能和运行方式；在修改接口、权限或数据库迁移后，应同步更新本文件与后端专项文档。
