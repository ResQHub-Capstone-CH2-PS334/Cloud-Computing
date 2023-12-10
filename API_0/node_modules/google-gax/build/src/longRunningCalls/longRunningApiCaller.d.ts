/**
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { APICaller } from 'google-gax/build/src/apiCaller';
import { APICallback, GRPCCall, SimpleCallbackFunction } from 'google-gax/build/src/apitypes';
import { OngoingCall, OngoingCallPromise } from 'google-gax/build/src/call';
import { CallOptions } from 'google-gax/build/src/gax';
import { GoogleError } from 'google-gax/build/src/googleError';
import { LongRunningDescriptor } from 'google-gax/build/src/longRunningCalls/longRunningDescriptor';
export declare class LongrunningApiCaller implements APICaller {
    longrunningDescriptor: LongRunningDescriptor;
    /**
     * Creates an API caller that performs polling on a long running operation.
     *
     * @private
     * @constructor
     * @param {LongRunningDescriptor} longrunningDescriptor - Holds the
     * decoders used for unpacking responses and the operationsClient
     * used for polling the operation.
     */
    constructor(longrunningDescriptor: LongRunningDescriptor);
    init(callback?: APICallback): OngoingCallPromise | OngoingCall;
    wrap(func: GRPCCall): GRPCCall;
    call(apiCall: SimpleCallbackFunction, argument: {}, settings: CallOptions, canceller: OngoingCallPromise): void;
    private _wrapOperation;
    fail(canceller: OngoingCallPromise, err: GoogleError): void;
    result(canceller: OngoingCallPromise): import("google-gax/build/src/call").CancellablePromise<import("google-gax/build/src/apitypes").ResultTuple>;
}
