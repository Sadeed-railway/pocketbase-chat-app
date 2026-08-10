// // src/routes/+page.js
// import { redirect } from '@sveltejs/kit';

// let isAuthenticated = true;

// export function load() {
//   if (isAuthenticated) {
//     redirect(303, '/chats'); // SvelteKit 2 uses redirect(...) directly (no 'throw')
//   }

//   redirect(303, '/login');
// }