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
import { APICallback, CancellableStream, GRPCCall, ResultTuple, SimpleCallbackFunction } from 'google-gax/build/src/apitypes';
import { CancellablePromise, OngoingCall, OngoingCallPromise } from 'google-gax/build/src/call';
import { Descriptor } from 'google-gax/build/src/descriptor';
import { CallSettings } from 'google-gax/build/src/gax';
import { GoogleError } from 'google-gax/build/src/googleError';
import { StreamProxy } from 'google-gax/build/src/streamingCalls/streaming';
/**
 * An interface for all kinds of API callers (normal, that just calls API, and
 * all special ones: long-running, paginated, bundled, streaming).
 */
export interface APICaller {
    init(callback?: APICallback): OngoingCallPromise | OngoingCall | StreamProxy;
    wrap(func: GRPCCall): GRPCCall;
    call(apiCall: SimpleCallbackFunction, argument: {}, settings: {}, canceller: OngoingCallPromise | OngoingCall | StreamProxy): void;
    fail(canceller: OngoingCallPromise | OngoingCall | CancellableStream, err: GoogleError): void;
    result(canceller: OngoingCallPromise | OngoingCall | CancellableStream): CancellablePromise<ResultTuple> | CancellableStream;
}
export declare function createAPICaller(settings: CallSettings, descriptor: Descriptor | undefined): APICaller;
