

import { Routes } from '@angular/router';
import { PublicContentFull }  from './layout/public/content-full/content-full';
import { PrivateContentFull } from './layout/private/content-full/content-full';
import { Encuesta } from './features/encuesta/encuesta';
import { Dashboard } from './features/dashboard/dashboard';
import { ModeloGestion } from './features/modelo-gestion/modelo-gestion';
import { Login } from './features/login/login';
import { loginGuard } from './core/guards/login.guard';


export const routes: Routes = [


    {
        path: 'public',
        component: PublicContentFull,
        children: [
            { path: '', redirectTo: 'encuesta', pathMatch: 'full' },
            { path: 'encuesta', component: Encuesta },
            { path: 'modelo', component: ModeloGestion },
            { path: 'login', component: Login },
        ]
    },

    {
        path: 'private',
        component: PrivateContentFull,
        children: [
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
            { path: 'dashboard', component: Dashboard, canActivate: [loginGuard] },
        ]
    },

    {
        path: '**',
        redirectTo: 'public'
    }

];
