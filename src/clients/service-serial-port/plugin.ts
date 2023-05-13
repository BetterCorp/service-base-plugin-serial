import {
  ServiceCallable,
  ServicesBase,
  ServicesClient,
} from "@bettercorp/service-base";
import { SerialEvents, SerialEmitAndReturnEvents } from "../../";
import { Tools } from "@bettercorp/tools";

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

  async onMessage(listener: {
    (data: Buffer | string): Promise<void>;
  }): Promise<void> {
    await this._plugin.onEventSpecific(this._serverId, "onMessage", listener);
  }
  async writeMessage(data: Buffer | string): Promise<void> {
    await this._plugin.emitEventAndReturnSpecific(
      this._serverId,
      "writeMessage",
      data
    );
  }
  async reconnect(): Promise<void> {
    await this._plugin.emitEventAndReturnSpecific(this._serverId, "reconnect");
  }
}
