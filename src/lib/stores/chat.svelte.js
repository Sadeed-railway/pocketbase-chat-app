import { getContext, setContext } from 'svelte';

class ActiveChatState {
  #friend = $state(null);

  get friend() {
    return this.#friend;
  }

  select = (friend) => {
    this.#friend = friend;
  };

  clear = () => {
    this.#friend = null;
  };
}

const ACTIVE_CHAT_KEY = Symbol('ACTIVE_CHAT_STATE');

export function setActiveChatState() {
  return setContext(ACTIVE_CHAT_KEY, new ActiveChatState());
}

export function getActiveChatState() {
  const state = getContext(ACTIVE_CHAT_KEY);
  if (!state) {
    throw new Error('getActiveChatState must be called within a component tree wrapped by setActiveChatState');
  }
  return state;
}