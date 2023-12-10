import * as protobuf from 'protobufjs';
import { JSONValue } from 'proto3-json-serializer/build/src/types';
export interface ToProto3JSONOptions {
    numericEnums: boolean;
}
export declare function toProto3JSON(obj: protobuf.Message, options?: ToProto3JSONOptions): JSONValue;
