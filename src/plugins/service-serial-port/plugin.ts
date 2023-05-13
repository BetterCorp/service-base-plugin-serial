import { SerialPort } from "serialport";
import { ServiceCallable, ServicesBase } from "@bettercorp/service-base";
import { MyPluginConfig } from "./sec.config";
import { SerialEvents, SerialEmitAndReturnEvents } from "../../index";

export class Service extends ServicesBase<
  ServiceCallable,
  SerialEvents,
  SerialEmitAndReturnEvents,
  ServiceCallable,
  ServiceCallable,
  MyPluginConfig
> {
  private _server!: SerialPort;
  private _lastUse: number = 0;
  private _lastUserTimer: NodeJS.Timer | null = null;
  public override dispose(): void {
    if (this._server.isOpen) this._server.close();
  }
  public override async init(): Promise<void> {
    const config = await this.getPluginConfig();
    const thisServerId = config.serverId ?? "default";
    const self = this;
    await self.onReturnableEventSpecific(
      thisServerId,
      "isConnected",
      async () => {
        return self._server.isOpen;
      }
    );
    await self.onReturnableEventSpecific(
      thisServerId,
      "reconnect",
      async () => {
        await self.log.info("Requested reconnect.");
        if (self._server.isOpen) {
          await self.log.info("Requested reconnect: closing");
          self._server.close();
          await self.log.info("Requested reconnect: re-opening");
          await self.openSerial();
          await self.log.info("Requested reconnect: complete");
        }
      }
    );
    await self.onReturnableEventSpecific(
      thisServerId,
      "writeMessage",
      async (data: string | Buffer) => {
        if (!self._server.isOpen) {
          await self.openSerial();
        }
        self._server.write(data);
        self._lastUse = new Date().getTime();
      }
    );
    self._server = new SerialPort({
      path: config.port,
      baudRate: config.baudRate,
      dataBits: config.dataBits,
      stopBits: config.stopBits,
      parity: config.parity,
      autoOpen: false,
    });
    const messageBuffer = config.messageBuffer;
    self._server.on("data", async (value) => {
      self._lastUse = new Date().getTime();
      const dataAsText = messageBuffer
        ? "buffer"
        : Buffer.from(value).toString("utf-8").trim();
      self.log.debug(
        "Read: {value}",
        {
          value: dataAsText,
        },
        true
      );

      await self.emitEventSpecific(
        thisServerId,
        "onMessage",
        messageBuffer ? value : dataAsText
      );
    });
    self._server.on("drain", async () => {
      await self.emitEventSpecific(thisServerId, "onPortEvent", "drain");
      await self.log.info("Serial port drained.");
    });
    self._server.on("close", async () => {
      await self.emitEventSpecific(thisServerId, "onPortEvent", "close");
      await self.log.warn("Serial port closed.");
    });
    self._server.on("open", async () => {
      await self.emitEventSpecific(thisServerId, "onPortEvent", "open");
      await self.log.info("Serial port opened.");
    });
    self._server.on("error", async (err) => {
      await self.emitEventSpecific(thisServerId, "onPortEvent", "error", err);
      await self.log.error(err);
    });
  }
  private async openSerial(): Promise<void> {
    const self = this;
    if (self._server.isOpen) return;
    const config = await this.getPluginConfig();
    return new Promise((resolve, reject) => {
      self._server.open(async (err) => {
        if (err) {
          self.log.fatal(err);
          reject(err);
          return;
        }
        if (config.autoConnect) {
          self._lastUserTimer = setInterval(async () => {
            if (self._server.isOpen) return;

            clearInterval(self._lastUserTimer!);
            if (config.autoReConnect) {
              await self.log.warn(
                "Serial closed somehow! - We`re going to try reconnect!"
              );
              return await self.openSerial();
            }
            await self.log.fatal("Serial closed somehow!");
          }, 30000);
        } else {
          self._lastUserTimer = setInterval(() => {
            const now = new Date().getTime();
            if (now - self._lastUse > 60000) {
              self._server.close();
              clearInterval(self._lastUserTimer!);
            }
          }, 30000);
        }
        resolve();
      });
    });
  }
  public override async run(): Promise<void> {
    if ((await this.getPluginConfig()).autoConnect) await this.openSerial();
    /*
    const self = this;
    setTimeout(() => {
      (self as any).emitEvent('writeMessage', 'HELLO WORLD');
    }, 10000)*/
  }
}
