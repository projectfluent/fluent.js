'use strict';

/* global bridge, BroadcastChannel */

export const Client = bridge.client;
export const Service = bridge.service;
export const channel = new BroadcastChannel('l20n-channel');

export function broadcast(type, data) {
  return this.service.broadcast(type, data);
}
