import * as Network from "expo-network";

 function getLocalIP(): string | null {
  return "http://172.16.115.65:5000";
  return "http://abhijeet.taild80e14.ts.net";
  return "https://empirical-required-vid-accordingly.trycloudflare.com"
  // try {
  //   const ip = await Network.getIpAddressAsync();
  //   console.log("ip between is",ip)
  //   console.log("type is ",typeof ip)
  //   return ip;
  // } catch (e) {
  //   console.error("Failed to get IP:", e);
  //   return "bhalu";
  // }
}

export default getLocalIP;