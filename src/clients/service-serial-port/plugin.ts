import { ServiceCallable, ServicesClient } from "@bettercorp/service-base";
import {
  SerialEmitEvents,
  SerialEvents,
} from "../../plugins/service-serial-port/plugin";
import { MyPluginConfig } from "../../plugins/service-serial-port/sec.config";

export class serialPort extends ServicesClient<
  SerialEmitEvents,
  SerialEvents,
  ServiceCallable,
  ServiceCallable,
  ServiceCallable,
  MyPluginConfig
> {
  public override readonly _pluginName: string = "service-serial-port";

  async onMessage(listener: {
    (data: Buffer | string): Promise<void>;
  }): Promise<void> {
    await this._plugin.onEvent("onMessage", listener);
  }
  async writeMessage(data: Buffer | string): Promise<void> {
    await this._plugin.emitEvent("writeMessage", data);
  }
}
