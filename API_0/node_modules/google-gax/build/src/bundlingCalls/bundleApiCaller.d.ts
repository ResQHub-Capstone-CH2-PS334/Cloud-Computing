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
import { CallSettings } from 'google-gax/build/src/gax';
import { GoogleError } from 'google-gax/build/src/googleError';
import { BundleExecutor } from 'google-gax/build/src/bundlingCalls/bundleExecutor';
/**
 * An implementation of APICaller for bundled calls.
 * Uses BundleExecutor to do bundling.
 */
export declare class BundleApiCaller implements APICaller {
    bundler: BundleExecutor;
    constructor(bundler: BundleExecutor);
    init(callback?: APICallback): OngoingCallPromise | OngoingCall;
    wrap(func: GRPCCall): GRPCCall;
    call(apiCall: SimpleCallbackFunction, argument: {}, settings: CallSettings, status: OngoingCallPromise): void;
    fail(canceller: OngoingCallPromise, err: GoogleError): void;
    result(canceller: OngoingCallPromise): import("google-gax/build/src/call").CancellablePromise<import("google-gax/build/src/apitypes").ResultTuple>;
}
