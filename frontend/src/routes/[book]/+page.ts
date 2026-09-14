import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => {
	if (!params.book) {
		error(400, 'Libro no especificado');
	}
	return { book: params.book };
};
