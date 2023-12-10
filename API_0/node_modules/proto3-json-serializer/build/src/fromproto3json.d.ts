import * as protobuf from 'protobufjs';
import { FromObjectValue, JSONValue } from 'proto3-json-serializer/build/src/types';
export declare function fromProto3JSONToInternalRepresentation(type: protobuf.Type | protobuf.Enum | string, json: JSONValue): FromObjectValue;
export declare function fromProto3JSON(type: protobuf.Type, json: JSONValue): protobuf.Message<{}> | null;
