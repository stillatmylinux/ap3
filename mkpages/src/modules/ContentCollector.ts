import { AppConfig } from "../AppConfig";
import https = require('https');
import http = require('http');

export class ContentCollector {

	private hostname: string;
	private port: number;
	
	constructor(private site_name: string) { 
		this.hostname = AppConfig.api.server.hostname;
		this.port     = AppConfig.api.server.port;
	}
	
	get_page_content(page_id: string) {
	
		return new Promise((resolve, reject) => {
			let req;
			const options = {
				hostname: this.hostname,
				port: this.port,
				method: 'GET',
				path: '/' + this.site_name + '/wp-json/wp/v2/apppages/' + page_id,
			};

			if(this.port == 80) {
				req = http.get(options, (res) => {
					res.on('data', (d) => {
						const json = JSON.parse(d.toString());
						if(json.content && json.content.rendered) {
							resolve(json.content.rendered);
						} else {
							reject('No content found for page id ' + page_id);
						}
					});

				}).on('error', (e) => {
					console.error(e);
					reject(e.message);
				});
			} else if(this.port == 443) {
				req = https.request(options, (res) => {
					res.setEncoding('utf8');
					res.on('data', (chunk) => {
						const json = JSON.parse(chunk.toString());
						if(json.content && json.content.rendered) {
							resolve(json.content.rendered);
						} else {
							reject('No content found for page id ' + page_id);
						}
					});
				});

				req.on('error', function(e) {
					console.log('problem with request: ' + e.message);
					reject(e.message);
				});

				req.end();
			};
		});
	}
}