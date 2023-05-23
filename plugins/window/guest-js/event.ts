// Copyright 2019-2023 Tauri Programme within The Commons Conservancy
// SPDX-License-Identifier: Apache-2.0
// SPDX-License-Identifier: MIT

declare global {
  interface Window {
    __TAURI_INVOKE__: <T>(cmd: string, args?: unknown) => Promise<T>;
    __TAURI__: {
      transformCallback: <T>(cb: (payload: T) => void) => number;
    };
  }
}

export interface Event<T> {
  /** Event name */
  event: string;
  /** The label of the window that emitted this event. */
  windowLabel: string;
  /** Event identifier used to unlisten */
  id: number;
  /** Event payload */
  payload: T;
}

export type EventCallback<T> = (event: Event<T>) => void;

export type UnlistenFn = () => void;

/**
 * Unregister the event listener associated with the given name and id.
 *
 * @ignore
 * @param event The event name
 * @param eventId Event identifier
 * @returns
 */
async function _unlisten(event: string, eventId: number): Promise<void> {
  await window.__TAURI_INVOKE__("plugin:event|unlisten", {
    event,
    eventId,
  });
}

/**
 * Emits an event to the backend.
 *
 * @param event Event name. Must include only alphanumeric characters, `-`, `/`, `:` and `_`.
 * @param [windowLabel] The label of the window to which the event is sent, if null/undefined the event will be sent to all windows
 * @param [payload] Event payload
 * @returns
 */
async function emit(
  event: string,
  windowLabel?: string,
  payload?: unknown
): Promise<void> {
  await window.__TAURI_INVOKE__("plugin:event|emit", {
    event,
    windowLabel,
    payload,
  });
}

/**
 * Listen to an event from the backend.
 *
 * @param event Event name. Must include only alphanumeric characters, `-`, `/`, `:` and `_`.
 * @param handler Event handler callback.
 * @return A promise resolving to a function to unlisten to the event.
 */
async function listen<T>(
  event: string,
  windowLabel: string | null,
  handler: EventCallback<T>
): Promise<UnlistenFn> {
  return window
    .__TAURI_INVOKE__<number>("plugin:event|listen", {
      event,
      windowLabel,
      handler: window.__TAURI__.transformCallback(handler),
    })
    .then((eventId) => {
      return async () => _unlisten(event, eventId);
    });
}

/**
 * Listen to an one-off event from the backend.
 *
 * @param event Event name. Must include only alphanumeric characters, `-`, `/`, `:` and `_`.
 * @param handler Event handler callback.
 * @returns A promise resolving to a function to unlisten to the event.
 */
async function once<T>(
  event: string,
  windowLabel: string | null,
  handler: EventCallback<T>
): Promise<UnlistenFn> {
  return listen<T>(event, windowLabel, (eventData) => {
    handler(eventData);
    _unlisten(event, eventData.id).catch(() => {
      // do nothing
    });
  });
}

export { emit, listen, once };