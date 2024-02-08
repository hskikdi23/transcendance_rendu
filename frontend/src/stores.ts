import { writable } from "svelte/store";
import type { User } from "./types";
import type { Socket } from "socket.io-client";

export const logged = writable(localStorage.getItem('logged'))
logged.subscribe(val => localStorage.setItem('logged', val === 'true' ? 'true' : 'false'))

export const id = writable(localStorage.getItem('id') || '0')
id.subscribe(val => localStorage.setItem('id', val))

export const user = writable<User>(null)

export const reloadImage = writable<number>(0)

export const socket = writable<Socket>(null)