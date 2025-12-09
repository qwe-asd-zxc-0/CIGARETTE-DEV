import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // React Compiler 已从 experimental 挪到顶层配置
  reactCompiler: true,
};

export default nextConfig;