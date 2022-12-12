import { SecConfig } from "@bettercorp/service-base";

export interface MyPluginConfig {
  port: string; // Port: The port to bind too
  autoConnect: boolean; // Auto Connect: Connect and hold the connection option
  autoReConnect: boolean; // Auto re-Connect: When auto-connect is enabled, we'll try reconnect automatically if the connection closes/times out. If it failes, we'll throw a fatal
  baudRate: number; // Baud Rate
  dataBits?: 5 | 6 | 7 | 8; // Data Bits
  stopBits?: 2 | 1 | 1.5; // Stop Bits
  parity?: "none" | "even" | "odd" | "mark" | "space"; // Parity
  messageBuffer: boolean; // Send Buffer: OnMessage returns buffer instead of a parsed string
}

export class Config extends SecConfig<MyPluginConfig> {
  migrate(
    mappedPluginName: string,
    existingConfig: MyPluginConfig
  ): MyPluginConfig {
    return {
      port: existingConfig.port !== undefined ? existingConfig.port : "COM1",
      parity: existingConfig.parity,
      dataBits: existingConfig.dataBits,
      stopBits: existingConfig.stopBits,
      autoConnect:
        existingConfig.autoConnect !== undefined
          ? existingConfig.autoConnect
          : false,
      autoReConnect:
        existingConfig.autoReConnect !== undefined &&
        existingConfig.autoConnect === true
          ? existingConfig.autoReConnect
          : false,
      messageBuffer:
        existingConfig.messageBuffer !== undefined
          ? existingConfig.messageBuffer
          : false,
      baudRate:
        existingConfig.baudRate !== undefined
          ? existingConfig.baudRate
          : 115200,
    };
  }
}
