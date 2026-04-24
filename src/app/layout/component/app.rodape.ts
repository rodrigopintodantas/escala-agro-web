import { Component } from '@angular/core';

@Component({
    standalone: true,
    selector: 'app-rodape',
    template: ` <div class="footer-start">
            <!-- <img src="assets/layout/images/logo.png" alt="logo" height="25" width="50" /> -->
            <!-- <span class="app-name"></span> -->
        </div>
        <div class="footer-right">
            <span>NOME DO ÓRGÃO!</span>
        </div>`,
    host: {
        class: 'layout-footer'
    }
})
export class AppRodape {}
