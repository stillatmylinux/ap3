import { AppConfig } from './AppConfig';
import { AppSettings } from "./modules/AppSettings";
import { TemplateMaker } from './modules/TemplateMaker';
import { ContentCollector } from './modules/ContentCollector';
import { AppZip } from "./modules/AppZip";
import fs = require('fs'); // nodejs filesystem
import path = require('path'); // nodejs directory utilities
import process = require('process');


class AppBuilder {

	private cli_params: {site_name: string, app_id: string} | null;
	private myappp_settings: any;
	private build_dir = __dirname + '/builds';
	private zip_basename: string; // i.e. app-6.4 (the zip file without the .zip; used for unzipped dirname)
	
	run() {

		// we need our cli params, or bail
		this.cli_params = this.get_cli_params();

		if(! this.cli_params) {
			return false;
		}
		
		// be sure we have a place to save our files
		fs.access(this.build_dir, (err) => {
			if (err && err.code === 'ENOENT') {
				// mkdir our build dir
				fs.mkdir(this.build_dir);
			}

			// Start by getting myapp settings
			this.get_myappp_settings(); // from api
		});
	}

	/**
	 * API call to myapppresser.com
	 */
	get_myappp_settings() {
		let app_settings = new AppSettings(this.cli_params.site_name, this.cli_params.app_id);
		app_settings.get_settings().then( (json) => {
			this.myappp_settings = json;
			if(typeof json === 'object') {
				this.make_components();
				this.set_globalvars();

				const zip = new AppZip(this.myappp_settings, this.cli_params);
				zip.get_app_zip();
			} else {
				console.log(json);
			}
		}, (error) => {
			console.error("Failed!", error);
		})
	}

	make_components() {

		this.myappp_settings.menus.items.forEach(element => {
			if(element.page_type == 'html') {
				console.log('processing page: ' + element.title);
				this.make_page_html_component(element);
			}
		});

		console.log('done!');
	}

	set_globalvars() {

		const src_folder = 'templates';
		const new_folder = 'globalvars';
		const dest_dir = 'builds/app_'+this.cli_params.site_name+'_'+this.cli_params.app_id;
		const root_folder = path.resolve('../mkpages') + '/';

		const componentMaker = new TemplateMaker(src_folder, new_folder, dest_dir, root_folder);

		// globalvars
		const template_file = 'globalvars.ts';
		const new_file = 'globalvars.ts';
		componentMaker.build_template( template_file, new_file, [
			// \\ escape these for use with RegEx
			{key: "\\[\\[appp_app_id\\]\\]", value: this.cli_params.app_id},
			{key: "\\[\\[myappp_url\\]\\]", value: this.get_myapp_url()}
		]);
	}

	/**
	 * Each page component consists of
	 * 
	 * 1. html template
	 * 2. module
	 * 3. compontent
	 * 
	 * Reads the templates of each and replaces matched values with assigned values
	 * 
	 * @param page 
	 */
	make_page_html_component(page) {
		
		const page_id = page.page_id;
		let file_name: string;
		const src_folder = 'templates/custom-html-template';
		const new_folder = 'page-'+page_id;
		const dest_dir = 'builds/app_'+this.cli_params.site_name+'_'+this.cli_params.app_id;
		const root_folder = path.resolve('./') + '/';

		const componentMaker = new TemplateMaker(src_folder, new_folder, dest_dir, root_folder);
		
		// html from api
		this.get_page_content(componentMaker, file_name, page_id);
		
		// module
		file_name = 'page-' + page_id + '.module.ts';
		componentMaker.build_template( 'custom-html-template.module.ts', file_name, [
			{key: 'CustomHtmlTemplate', value: 'Page'+page_id},
			{key: 'custom-html-template', value: 'page-'+page_id}
		]);

		// component
		file_name = 'page-' + page_id + '.ts';
		componentMaker.build_template( 'custom-html-template.ts', file_name, [
			{key: 'CustomHtmlTemplate', value: 'Page'+page_id},
			{key: 'custom-html-template', value: 'page-'+page_id}
		]);
	}

	/**
	 * Page content comes from the myapp API. The ContentCollector is the 
	 * tool to get it. Reads the api, builds the html template from it's
	 * content.
	 * 
	 * @param componentMaker Reference to our configured tool
	 * @param file_name New file name
	 * @param page_id page ID
	 */
	get_page_content(componentMaker, file_name, page_id) {

		const contentCollector = new ContentCollector(this.cli_params.site_name);
		contentCollector.get_page_content(page_id).then( (content) => {

			file_name = 'page-' + page_id + '.html';
			componentMaker.build_template( 'custom-html-template.html', file_name, [
				{key: 'Content goes here', value: content}
			]);
		});
	}

	/**
	 * Verify that the proper parameters have been supplied to the cli
	 * 
	 * Expects `node app [site_name] [app_id]`
	 */
	get_cli_params() {

		let params = process.argv;

		if(typeof params[2] === 'undefined') {
			console.log('Error: Missing site name parameter. Expects `node app [site_name] [app_id]`');
			return;
		}
		if(typeof params[3] === 'undefined') {
			console.log('Error: Missing app id parameter.  Expects `node app [site_name] [app_id]`');
			return;
		}
		return {
			site_name: params[2],
			app_id: params[3]
		};
	}

	/**
	 * Uses the AppConfig.ts file to return the API URL.
	 */
	get_myapp_url() {
		const protocol = (AppConfig.api.server.port == 80) ? 'http://' : 'https://';
		const hostname = AppConfig.api.server.hostname;
		const site_name = this.cli_params.site_name;

		return protocol + hostname + '/' + site_name + '/';
	}

}
	
const appbuilder = new AppBuilder();
appbuilder.run();