import { SerialPort } from "serialport";
import { ServiceCallable, ServicesBase } from "@bettercorp/service-base";
import { MyPluginConfig } from "./sec.config";

export interface SerialEvents extends ServiceCallable {
  onMessage(data: Buffer | string): Promise<void>;
}

export interface SerialEmitEvents extends ServiceCallable {
  writeMessage(data: Buffer | string): Promise<void>;
  reconnect(): Promise<void>;
}

export class Service extends ServicesBase<
  SerialEmitEvents,
  SerialEvents,
  ServiceCallable,
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
    const self = this;
    await this.onEvent("reconnect", async () => {
      await self.log.info("Requested reconnect.");
      if (self._server.isOpen) {
        await self.log.info("Requested reconnect: closing");
        self._server.close();
        await self.log.info("Requested reconnect: re-opening");
        await self.openSerial();
        await self.log.info("Requested reconnect: complete");
      }
    });
    await this.onEvent("writeMessage", async (data: string | Buffer) => {
      if (!self._server.isOpen) {
        await self.openSerial();
      }
      self._server.write(data);
      self._lastUse = new Date().getTime();
    });
    this._server = new SerialPort({
      path: (await this.getPluginConfig()).port,
      baudRate: (await this.getPluginConfig()).baudRate,
      dataBits: (await this.getPluginConfig()).dataBits,
      stopBits: (await this.getPluginConfig()).stopBits,
      parity: (await this.getPluginConfig()).parity,
      autoOpen: false,
    });
    const messageBuffer = (await this.getPluginConfig()).messageBuffer;
    this._server.on("data", async (value) => {
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

      await self.emitEvent("onMessage", messageBuffer ? value : dataAsText);
    });
    this._server.on("error", async (err) => {
      await self.log.error(err);
    });
  }
  private async openSerial(): Promise<void> {
    const self = this;
    if (self._server.isOpen) return;
    return new Promise((resolve, reject) => {
      self._server.open(async (err) => {
        if (err) {
          self.log.fatal(err);
          reject(err);
          return;
        }
        if ((await self.getPluginConfig()).autoConnect) {
          self._lastUserTimer = setInterval(async () => {
            if (self._server.isOpen) return;

            clearInterval(self._lastUserTimer!);
            if ((await self.getPluginConfig()).autoReConnect) {
              await self.log.warn(
                "Serial closed somehow! - We`re going to try reconnect!"
              );
              return await this.openSerial();
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
      //this._server!.open();
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
