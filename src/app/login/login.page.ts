import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Storage } from '@ionic/storage';
import { NavController } from '@ionic/angular';

import { environment, SERVER_URL } from '../../environments/environment';

@Component({
  selector: 'app-login',
  templateUrl: 'login.page.html',
  styleUrls: ['login.page.scss'],
})
export class LoginPage {

  form = {
    email: "",
    password: ""
  }

  form_errors = null

  constructor(public navCtrl: NavController, private http: HttpClient, private storage: Storage) { }

  do_login() {
    this.http.post(SERVER_URL + "relative_login", this.form, { headers: { 'Content-Type': 'application/json' } }).subscribe(
      (response) => {
        console.log(response);
        if(response['success']){
          this.storage.set("token", response['token']);
          this.navCtrl.navigateRoot('home');
        }else{
            this.form_errors = response['errors']
        }
      }, (error) => {
        console.log(error);
      });
  }

}
