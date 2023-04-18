import adapter from '@sveltejs/adapter-auto';
import preprocess from 'svelte-preprocess';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consulter https://github.com/sveltejs/svelte-preprocess
	// pour plus d'informations sur le préprocesseur
	kit: {
		adapter: adapter()
	},
	preprocess: preprocess()
};

export default config;
