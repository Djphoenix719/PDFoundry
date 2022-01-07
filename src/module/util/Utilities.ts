/*
 * Copyright 2022 Andrew Cuccinello
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 *
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * The domain white list includes domains that are allowed other than 'localhost' or
 *  the equivalent domain the user is running the server on.
 */
export const DOMAIN_WHITELIST = ['amazonaws.com', 'digitaloceanspaces.com', 'assets.forge-vtt.com', 'wasabisys.com', 'backblazeb2.com'];

/**
 * Gets the correct route prefix used to support servers using a route prefix.
 * Appended to all window.location paths.
 * @module Utilities
 */
export function getRoutePrefix(): string {
    // we prefer this over window.location.origin because foundry allows path remapping
    let prefixArr = window.location.pathname.split('/');
    prefixArr.pop(); // don't want the 'game' at the end
    return prefixArr.join('/');
}

/**
 * Convert a relative URL to a absolute URL by prepending the window origin to the relative URL.
 * If the URL is of a white listed domain, will simply return the provided URL.
 * @param dataUrl A url to be validated.
 * @see {@link DOMAIN_WHITELIST}
 * @see {@link Api.Utilities}
 * @module Utilities
 */
export function getAbsoluteURL(dataUrl: string): string {
    // Some domains are white listed, these should be considered absolute already
    for (const domain of DOMAIN_WHITELIST) {
        if (dataUrl.includes(domain)) {
            return dataUrl;
        }
    }

    return `${window.origin}${getRoutePrefix()}/${dataUrl}`;
}
