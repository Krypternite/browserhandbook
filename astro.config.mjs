// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	site: 'https://Krypternite.github.io',
	base: '/browserhandbook',
	markdown: {
		shikiConfig: {
			themes: {
				light: "vitesse-light",
				dark: "vitesse-dark"
			}
		}
	},
	integrations: [
		starlight({
			title: 'Browser Performance Handbook',
			customCss: ['./src/styles/amber-slate.css', './src/styles/custom.css'],
			sidebar: [
				{
					label: 'Web Foundations',
					items: [
						{
							label: 'Chapter 1: The Anatomy of a Web Navigation',
							slug: 'web-foundations/chapter-1'
						}
					]
				}
			],
		}),
	],
});
