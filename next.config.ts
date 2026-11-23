import type { NextConfig } from "next";
import dns from "node:dns";

// Ensure Node.js resolves IPv4 first to prevent IPv6 NAT64 timeouts and "fetch failed" errors
try {
  dns.setDefaultResultOrder("ipv4first");
} catch {
  // Ignore in non-Node environments
}

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
