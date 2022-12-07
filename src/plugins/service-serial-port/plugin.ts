import { SerialPort } from "serialport";
import { ServiceCallable, ServicesBase } from "@bettercorp/service-base";
import { MyPluginConfig } from "./sec.config";

export interface SerialEvents extends ServiceCallable {
  onMessage(data: Buffer | string): Promise<void>;
}

export interface SerialEmitEvents extends ServiceCallable {
  writeMessage(data: Buffer | string): Promise<void>;
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
  public override async init(): Promise<void> {
    const self = this;
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
    this._server.on("data", (value) => {
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

      self.emitEvent("onMessage", messageBuffer ? value : dataAsText);
    });
    this._server.on("error", (err) => {
      self.log.error(err);
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
        if (!(await this.getPluginConfig()).autoConnect) {
          self._lastUserTimer = setInterval(() => {
            const now = new Date().getTime();
            if (now - self._lastUse > 60000) {
              self._server.close();
              clearInterval(self._lastUserTimer!);
            }
          }, 30000);
        } else {
          self._lastUserTimer = setInterval(() => {
            if (self._server.isOpen) return;

            self._server.close();
            clearInterval(self._lastUserTimer!);
            self.log.fatal("Serial closed somehow!");
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
