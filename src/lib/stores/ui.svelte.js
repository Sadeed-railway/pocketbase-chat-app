import { getContext, setContext } from 'svelte';

class SidebarState {
  #isOpen = $state(true);

  get isOpen() {
    return this.#isOpen;
  }

  toggle = () => {
    this.#isOpen = !this.#isOpen;
  };

  open = () => {
    this.#isOpen = true;
  };

  close = () => {
    this.#isOpen = false;
  };
}

const SIDEBAR_KEY = Symbol('SIDEBAR_STATE');

export function setSidebarState() {
  return setContext(SIDEBAR_KEY, new SidebarState());
}

export function getSidebarState() {
  const state = getContext(SIDEBAR_KEY);
  if (!state) {
    throw new Error('getSidebarState must be called within a component tree wrapped by setSidebarState');
  }
  return state;
}