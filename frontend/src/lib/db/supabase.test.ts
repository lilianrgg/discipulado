import { describe, it, expect } from 'vitest';
import { supabase } from './supabase';

describe('Supabase Client Test', () => {
	it('should initialize Supabase client instance', () => {
		expect(supabase).toBeDefined();
		expect(typeof supabase.auth).toBe('object');
	});
});
