---
title: 执行后端
description: PRX Agent 支持 Native、Docker 和 WASM 三种运行时后端，提供不同的隔离和安全级别。
---

# 执行后端

PRX 支持三种 Agent 执行后端，分别针对性能、隔离性和可移植性进行了优化。通过统一的 `RuntimeAdapter` trait，上层代码无需关心底层执行环境的差异。

## 概述

| 后端 | 隔离级别 | 性能 | 可移植性 | 适用场景 |
|------|---------|------|---------|---------|
| Native | 无隔离（进程级） | 最高 | 当前平台 | 开发调试、本地单用户 |
| Docker | 容器级 | 中等 | Linux/macOS | 生产部署、多租户 |
| WASM | 沙箱级 | 中等 | 跨平台 | 插件执行、不信任代码 |

## 核心架构

### `RuntimeAdapter` trait

所有执行后端实现统一接口：

```rust
#[async_trait]
pub trait RuntimeAdapter: Send + Sync {
    /// 初始化运行时环境
    async fn init(&mut self, config: &RuntimeConfig) -> Result<()>;

    /// 执行命令并返回结果
    async fn execute(&self, request: ExecuteRequest) -> Result<ExecuteResponse>;

    /// 检查运行时是否可用
    async fn health_check(&self) -> Result<RuntimeHealth>;

    /// 获取运行时信息
    fn info(&self) -> RuntimeInfo;

    /// 清理资源
    async fn cleanup(&mut self) -> Result<()>;
}
```

### `ExecuteRequest` 结构体

```rust
pub struct ExecuteRequest {
    /// 要执行的命令
    pub command: String,
    /// 命令参数
    pub args: Vec<String>,
    /// 环境变量
    pub env: HashMap<String, String>,
    /// 工作目录
    pub working_dir: Option<PathBuf>,
    /// 超时时间
    pub timeout: Duration,
    /// 资源限制
    pub limits: ResourceLimits,
    /// stdin 输入
    pub stdin: Option<Vec<u8>>,
}
```

### `ResourceLimits`

```rust
pub struct ResourceLimits {
    /// 最大内存使用量（字节）
    pub max_memory: Option<u64>,
    /// 最大 CPU 时间（秒）
    pub max_cpu_time: Option<u64>,
    /// 最大输出大小（字节）
    pub max_output_size: Option<u64>,
    /// 网络访问
    pub network_access: NetworkPolicy,
    /// 文件系统访问
    pub filesystem_access: FilesystemPolicy,
}
```

## Native 后端

直接在宿主机进程中执行工具调用。

### 特点

- **零开销** -- 无虚拟化或容器化成本
- **完全访问** -- 可访问宿主机所有资源
- **最快启动** -- 毫秒级工具调用
- **适合开发** -- 调试友好，日志直接输出到终端

### 配置

```toml
[agent.runtime]
backend = "native"

[agent.runtime.native]
# 工具执行的默认 shell
shell = "/bin/bash"

# 默认工作目录
working_dir = "~"

# 默认超时（秒）
timeout = 30

# 允许的命令白名单（空 = 全部允许）
allowed_commands = []

# 拒绝的命令黑名单
denied_commands = ["rm -rf /", "dd if=/dev/zero"]

# 环境变量传递模式: "inherit" | "clean" | "allowlist"
env_mode = "inherit"
```

### 安全注意事项

::: warning
Native 后端没有隔离机制。Agent 执行的命令与 PRX 进程拥有相同权限。仅建议在信任的单用户环境中使用。
:::

## Docker 后端

在 Docker 容器中执行工具调用，提供进程和文件系统隔离。

### 特点

- **容器隔离** -- 每次执行在独立容器或复用容器中运行
- **资源限制** -- 通过 cgroups 限制 CPU、内存、网络
- **镜像管理** -- 支持自定义执行镜像
- **网络策略** -- 可精细控制网络访问范围

### 配置

```toml
[agent.runtime]
backend = "docker"

[agent.runtime.docker]
# 默认执行镜像
image = "openprx/runtime:latest"

# 容器复用策略: "per_call" | "per_session" | "persistent"
container_policy = "per_session"

# 资源限制
[agent.runtime.docker.limits]
memory = "512m"
cpus = 1.0
pids_limit = 100

# 网络配置
[agent.runtime.docker.network]
# "none" | "bridge" | "host"
mode = "bridge"

# 允许访问的域名（仅 bridge 模式）
allowed_hosts = ["api.github.com", "registry.npmjs.org"]

# 文件系统挂载
[[agent.runtime.docker.mounts]]
source = "/home/user/projects"
target = "/workspace"
readonly = false

[[agent.runtime.docker.mounts]]
source = "/tmp/prx-shared"
target = "/shared"
readonly = true
```

### 容器生命周期

| 策略 | 行为 | 开销 | 隔离性 |
|------|------|------|--------|
| `per_call` | 每次工具调用创建新容器 | 最高 | 最强 |
| `per_session` | 每个会话复用同一容器 | 中等 | 会话级 |
| `persistent` | 持久容器，跨会话复用 | 最低 | 最弱 |

## WASM 后端

在 WebAssembly 沙箱中执行工具，提供最严格的隔离。

### 特点

- **内存安全** -- WASM 线性内存模型，天然隔离
- **确定性执行** -- 相同输入产生相同输出
- **跨平台** -- 编译一次，任何支持 WASM 的平台运行
- **细粒度权限** -- 通过 WASI 精确控制文件和网络访问

### 配置

```toml
[agent.runtime]
backend = "wasm"

[agent.runtime.wasm]
# WASM 运行时: "wasmtime" | "wasmer"
engine = "wasmtime"

# WASI 权限
[agent.runtime.wasm.wasi]
# 预打开的目录
preopened_dirs = ["/workspace::/home/user/projects"]

# 环境变量
env = ["PATH=/usr/bin", "HOME=/workspace"]

# 网络能力 (WASI Preview 2)
network = false

# 资源限制
[agent.runtime.wasm.limits]
max_memory_pages = 1024  # 每页 64KB，总计 64MB
max_fuel = 1000000000    # 指令计数限制
max_execution_time = 30  # 秒
```

### WASM 工具开发

工具需编译为 WASM 模块：

```bash
# Rust 工具编译为 WASM
cargo build --target wasm32-wasip1 --release

# 注册 WASM 工具
prx tools register my-tool.wasm --name "my-tool"
```

## 混合模式

PRX 支持同时使用多个后端，为不同工具指定不同的执行环境：

```toml
[agent.runtime]
# 默认后端
backend = "native"

# 工具级覆盖
[agent.runtime.overrides]
# shell 命令使用 Docker
"shell.*" = "docker"

# 不信任的第三方工具使用 WASM
"plugins.*" = "wasm"

# 文件操作使用 Native（性能优先）
"file.*" = "native"
```

## 使用方法

### CLI 命令

```bash
# 查看当前运行时信息
prx runtime info

# 健康检查
prx runtime health

# 切换运行时后端
prx runtime switch docker

# 列出可用的 WASM 模块
prx runtime wasm list

# 清理 Docker 容器
prx runtime docker prune
```

## 参数说明

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `backend` | string | `"native"` | 默认执行后端 |
| `native.shell` | string | `"/bin/bash"` | Native 后端使用的 shell |
| `native.timeout` | u64 | `30` | 默认超时（秒） |
| `docker.image` | string | `"openprx/runtime:latest"` | Docker 镜像 |
| `docker.container_policy` | string | `"per_session"` | 容器策略 |
| `docker.limits.memory` | string | `"512m"` | 内存限制 |
| `docker.limits.cpus` | f64 | `1.0` | CPU 限制 |
| `wasm.engine` | string | `"wasmtime"` | WASM 运行时引擎 |
| `wasm.limits.max_memory_pages` | u32 | `1024` | 最大内存页数 |
| `wasm.limits.max_fuel` | u64 | `10^9` | 指令计数限制 |

## 安全性对比

| 安全特性 | Native | Docker | WASM |
|---------|--------|--------|------|
| 进程隔离 | -- | 容器级 | 沙箱级 |
| 文件系统隔离 | -- | 挂载控制 | WASI preopened |
| 网络隔离 | -- | 网络策略 | 默认无网络 |
| 资源限制 | -- | cgroups | fuel + 内存页 |
| 适合不信任代码 | 否 | 部分 | 是 |
| 适合生产多租户 | 否 | 是 | 是 |

## 相关文档

- [Agent 循环](/zh/prx/agent/loop)
- [Agent 运行时](/zh/prx/agent/runtime)
- [Session Worker](/zh/prx/agent/session-worker)
- [安全沙箱](/zh/prx/security/sandbox)
- [插件系统](/zh/prx/plugins/)
