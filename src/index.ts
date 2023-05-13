import { ServiceCallable } from '@bettercorp/service-base';
export { serialPort } from "./clients/service-serial-port/plugin";

export type SerialPortEvent = "open" | "close" | "error" | "drain";
export interface SerialEvents extends ServiceCallable {
  onMessage(data: Buffer | string): Promise<void>;
  onPortEvent(event: SerialPortEvent, meta?: any): Promise<void>;
}

export interface SerialEmitAndReturnEvents extends ServiceCallable {
  writeMessage(data: Buffer | string): Promise<void>;
  reconnect(): Promise<void>;
}
