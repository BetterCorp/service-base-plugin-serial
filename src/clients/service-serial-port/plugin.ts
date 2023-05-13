import {
  ServiceCallable,
  ServicesBase,
  ServicesClient,
} from "@bettercorp/service-base";
import {
  SerialEvents,
  SerialEmitAndReturnEvents,
  SerialPortEvent,
} from "../../";
import { Tools } from "@bettercorp/tools";

export type SPOnMessage = {
  (data: Buffer | string): Promise<void>;
};
export type SPOnEvent = {
  (event: SerialPortEvent, meta?: any): Promise<void>;
};
export class serialPort extends ServicesClient<
  ServiceCallable,
  SerialEvents,
  SerialEmitAndReturnEvents,
  ServiceCallable,
  ServiceCallable
> {
  private _serverId: string = "default";
  public override readonly _pluginName: string = "service-serial-port";
  public constructor(self: ServicesBase, serverId?: string) {
    super(self);
    if (Tools.isString(serverId)) this._serverId = serverId;
  }

  public get defaultServer() {
    return this._serverId;
  }
  public set defaultServer(serverId: string) {
    this._serverId = serverId;
  }

  async onMessage(listener: {
    (data: Buffer | string): Promise<void>;
  }): Promise<void>;
  async onMessage(serverId: string, listener: SPOnMessage): Promise<void>;
  async onMessage(
    serverIdOrlistener: SPOnMessage | string,
    listener?: SPOnMessage
  ): Promise<void> {
    await this._plugin.onEventSpecific(
      listener === undefined ? this._serverId : (serverIdOrlistener as string),
      "onMessage",
      listener === undefined
        ? (serverIdOrlistener as SPOnMessage)
        : (listener as SPOnMessage)
    );
  }

  async onPortEvent(listener: SPOnEvent): Promise<void>;
  async onPortEvent(serverId: string, listener: SPOnEvent): Promise<void>;
  async onPortEvent(
    serverIdOrlistener: SPOnEvent | string,
    listener?: SPOnEvent
  ): Promise<void> {
    await this._plugin.onEventSpecific(
      listener === undefined ? this._serverId : (serverIdOrlistener as string),
      "onPortEvent",
      listener === undefined
        ? (serverIdOrlistener as SPOnEvent)
        : (listener as SPOnEvent)
    );
  }

  async writeMessage(data: Buffer | string): Promise<void>;
  async writeMessage(serverId: string, data: Buffer | string): Promise<void>;
  async writeMessage(
    serverIdOrData: Buffer | string,
    data?: Buffer | string
  ): Promise<void> {
    await this._plugin.emitEventAndReturnSpecific(
      data === undefined ? this._serverId : (data as string),
      "writeMessage",
      data === undefined ? serverIdOrData : data
    );
  }

  async reconnect(): Promise<void>;
  async reconnect(serverId: string): Promise<void>;
  async reconnect(serverId?: string): Promise<void> {
    await this._plugin.emitEventAndReturnSpecific(
      serverId === undefined ? this._serverId : serverId,
      "reconnect"
    );
  }

  async isConnected(): Promise<boolean>;
  async isConnected(serverId: string): Promise<boolean>;
  async isConnected(serverId?: string): Promise<boolean> {
    return await this._plugin.emitEventAndReturnSpecific(
      serverId === undefined ? this._serverId : serverId,
      "isConnected"
    );
  }
}
