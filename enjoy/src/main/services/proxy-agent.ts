import { config } from "@main/config";
import { HttpsProxyAgent } from "https-proxy-agent";
import { ProxyAgent } from "proxy-agent";
import fetch from "node-fetch";

export default function () {
  const proxyConfig = config.getAppSetting("proxy").value;
  let proxyAgent = new ProxyAgent();

  if (proxyConfig.enabled && proxyConfig.url) {
    proxyAgent = new ProxyAgent({
      httpAgent: new HttpsProxyAgent(proxyConfig.url),
      httpsAgent: new HttpsProxyAgent(proxyConfig.url),
    });
  }

  return {
    httpAgent: proxyAgent,
    fetch,
  };
}
