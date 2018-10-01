import { Routes, RouterModule } from "@angular/router";
import { MyApp } from "./app.component";
import { OktaCallbackComponent } from '@okta/okta-angular';


const routes: Routes = [
	{ path: 'implicit/callback', component: OktaCallbackComponent },
	{ path: '**', component: MyApp },
];

export const routing = RouterModule.forRoot(routes);