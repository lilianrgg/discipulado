import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => {
	const chapter = parseInt(params.chapter, 10);

	if (!params.book || isNaN(chapter) || chapter < 1) {
		error(400, 'Referencia inválida');
	}

	return {
		book: params.book,
		chapter
	};
};
