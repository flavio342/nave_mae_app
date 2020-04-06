import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from "@angular/router";
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-class',
  templateUrl: './class.page.html',
  styleUrls: ['./class.page.scss'],
})
export class ClassPage implements OnInit {

  class_obj = null

  info = {
    avg_grade: null,
    avg_attendance: null
  }

  grades = null

  constructor(public navCtrl: NavController, private route: ActivatedRoute) { }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.class_obj = params["class_obj"];
      this.setup_data()
    });
  }

  setup_data(){

    let sum_grade = 0
    let num_grade = 0
 
    for(let i=0; i < this.class_obj.grades.length; i++){
      sum_grade += this.class_obj.grades[i].points
      num_grade += 1
    }

    this.info.avg_grade = (sum_grade/num_grade).toFixed(1)

    let sum_attended = 0
    let num_attended = 0
    for(let i=0; i < this.class_obj.attendances.length; i++){
      sum_attended += this.class_obj.attendances[i].attended
      num_attended += 1
    }

    this.info.avg_attendance = ((sum_attended/num_attended)*100).toFixed(0) + "%"

    this.grades = this.class_obj.grades
  }

  pop_page(){
    this.navCtrl.pop()
  }

}
