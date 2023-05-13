import { ServiceCallable } from '@bettercorp/service-base';
export { serialPort } from "./clients/service-serial-port/plugin";

export interface SerialEvents extends ServiceCallable {
  onMessage(data: Buffer | string): Promise<void>;
}

export interface SerialEmitAndReturnEvents extends ServiceCallable {
  writeMessage(data: Buffer | string): Promise<void>;
  reconnect(): Promise<void>;
}
