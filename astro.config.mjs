// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightThemeTerminal from 'starlight-theme-terminal'

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
			plugins: [starlightThemeTerminal()],
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
				},
				{
					label: 'Product Owner Study',
					items: [
						{
							label: 'Chapter 1',
							slug: 'product-owner/1'
						},
						{
							label: 'Chapter 2',
							slug: 'product-owner/2'
						},
						{
							label: 'Chapter 3',
							slug: 'product-owner/3'
						},
						{
							label: 'Chapter 4',
							slug: 'product-owner/4'
						}
					]
				},
				{
					label: 'Product Owner Study Plan',
					items: [{ autogenerate: { "directory": "studyplan" } }]
				}

			],
		}),
	],
});
