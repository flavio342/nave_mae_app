import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Storage } from '@ionic/storage';
import { NavController } from '@ionic/angular';
import { NavigationExtras } from '@angular/router';
import { Socket } from 'ng-socket-io';

import { environment, SERVER_URL } from '../../environments/environment';

import { calendar2020 } from './calendar.js'

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  data = null

  filter = {
    student: {
      pos: null,
      id: null,
      name: null,
      photo: null
    },
    institution: {
      pos: null,
      id: null,
      name: null,
      photo: null
    }
  }

  info = {
    avg_grade: null,
    avg_attendance: null
  }

  classes = []

  tab = "home"

  show_popup = false

  popup = {
    type: null,
    students: [],
    institutions: [],
    event: null
  }

  calendar = null
  date = {
    day: null,
    month: null,
    month_name: null,
    year: null,
    selected_day: null,
    selected_month: null,
    selected_day_i: null,
    selected_day_j: null
  }

  message = ""

  message_list = [
    
  ]

  constructor(private socket: Socket, public navCtrl: NavController, private http: HttpClient, private storage: Storage) {
    this.generate_calendar()
    this.get_info()
    this.get_message()
  }

  get_info() {
    this.storage.get('token').then((token) => {
      this.http.get(SERVER_URL + "relative", { headers: { 'Content-Type': 'application/json', 'Authorization': token } }).subscribe(
        (response) => {
          this.data = response
          this.setup_data(0, 0)
        }, (error) => {
          if (error.status == 401) {
            this.storage.set('token', null)
            this.navCtrl.navigateRoot('login')
          }
        });
    })
  }

  setup_data(student_i, institution_i) {

    this.filter.student.pos = student_i
    this.filter.student.id = this.data.students[student_i].id
    this.filter.student.name = this.data.students[student_i].name
    this.filter.student.photo = this.data.students[student_i].photo

    this.filter.institution.pos = institution_i
    this.filter.institution.id = this.data.students[student_i].institutions[institution_i].id
    this.filter.institution.name = this.data.students[student_i].institutions[institution_i].name
    this.filter.institution.photo = this.data.students[student_i].institutions[institution_i].photo

    let sum_grade = 0
    let num_grade = 0
    for (let i = 0; i < this.data.students[student_i].institutions[institution_i].classes.length; i++) {
      for (let j = 0; j < this.data.students[student_i].institutions[institution_i].classes[i].grades.length; j++) {
        sum_grade += this.data.students[student_i].institutions[institution_i].classes[i].grades[j].points
        num_grade += 1
      }
    }

    this.info.avg_grade = (sum_grade / num_grade).toFixed(1)

    let sum_attended = 0
    let num_attended = 0
    for (let i = 0; i < this.data.students[student_i].institutions[institution_i].classes.length; i++) {
      for (let j = 0; j < this.data.students[student_i].institutions[institution_i].classes[i].attendances.length; j++) {
        sum_attended += this.data.students[student_i].institutions[institution_i].classes[i].attendances[j].attended
        num_attended += 1
      }
    }

    this.info.avg_attendance = ((sum_attended / num_attended) * 100).toFixed(0) + "%"

    let classes = []
    for (let i = 0; i < this.data.students[student_i].institutions[institution_i].classes.length; i += 2) {
      if (i != this.data.students[student_i].institutions[institution_i].classes.length - 1) {
        classes.push([
          {
            id: this.data.students[student_i].institutions[institution_i].classes[i].id,
            name: this.data.students[student_i].institutions[institution_i].classes[i].name,
            photo: this.data.students[student_i].institutions[institution_i].classes[i].photo
          },
          {
            id: this.data.students[student_i].institutions[institution_i].classes[i + 1].id,
            name: this.data.students[student_i].institutions[institution_i].classes[i + 1].name,
            photo: this.data.students[student_i].institutions[institution_i].classes[i + 1].photo
          }
        ])
      } else {
        classes.push([
          {
            id: this.data.students[student_i].institutions[institution_i].classes[i].id,
            name: this.data.students[student_i].institutions[institution_i].classes[i].name,
            photo: this.data.students[student_i].institutions[institution_i].classes[i].photo
          }
        ])
      }
    }

    this.classes = classes

    this.setup_calendar_events(student_i, institution_i)
  }

  open_filter_popup(type) {

    this.popup.type = null
    this.popup.students = []
    this.popup.institutions = []

    if (type == 'student') {
      this.popup.type = 'student'

      let students = []
      for (let i = 0; i < this.data.students.length; i++) {
        students.push({
          pos: i,
          id: this.data.students[i].id,
          name: this.data.students[i].name,
          photo: this.data.students[i].photo
        })
      }

      this.popup.students = students

    } else if (type == 'institution') {

      this.popup.type = 'institution'

      let institutions = []
      for (let i = 0; i < this.data.students.length; i++) {
        if (this.data.students[i].id == this.filter.student.id) {
          for (let j = 0; j < this.data.students[i].institutions.length; j++) {
            institutions.push({
              pos: j,
              id: this.data.students[i].institutions[j].id,
              name: this.data.students[i].institutions[j].name,
              photo: this.data.students[i].institutions[j].photo
            })
          }
        }
      }

      this.popup.institutions = institutions
    }

    this.show_popup = true
  }

  open_event_popup(event) {

    this.popup.type = 'event'

    this.popup.event = event

    this.show_popup = true
  }

  close_popup() {
    this.show_popup = false
  }

  open_class_page(class_id) {

    let class_obj = null

    for (let i = 0; i < this.data.students[this.filter.student.pos].institutions[this.filter.institution.pos].classes.length; i++) {
      if (class_id == this.data.students[this.filter.student.pos].institutions[this.filter.institution.pos].classes[i].id) {
        class_obj = this.data.students[this.filter.student.pos].institutions[this.filter.institution.pos].classes[i]
        break
      }
    }

    let navigationExtras: NavigationExtras = {
      queryParams: {
        class_obj: class_obj
      }
    };
    this.navCtrl.navigateForward('class', navigationExtras)
  }

  set_tab(tab) {
    this.tab = tab
  }

  setup_calendar_events(student_i, institution_i) {

    var d = new Date();
    this.select_date(d.getDate(), d.getMonth())
    this.set_date(d.getMonth())

    let events = []
    for (let i = 0; i < this.data.students[student_i].institutions[institution_i].classes.length; i++) {
      for (let j = 0; j < this.data.students[student_i].institutions[institution_i].classes[i].events.length; j++) {
        let event = this.data.students[student_i].institutions[institution_i].classes[i].events[j]
        event['class'] = this.data.students[student_i].institutions[institution_i].classes[i].name
        events.push(event)
      }
    }

    for (let i = 0; i < this.calendar.months.length; i++) {
      for (let j = 0; j < this.calendar.months[i].days.length; j++) {
        for (let k = 0; k < this.calendar.months[i].days[j].length; k++) {
          this.calendar.months[i].days[j][k].events = []

          for (let l = 0; l < events.length; l++) {
            let day = parseInt(events[l].date.split("/")[0])
            let month = parseInt(events[l].date.split("/")[1])
            let year = parseInt(events[l].date.split("/")[2])
            if (year == parseInt(this.calendar.year) && month == i + 1 && day == parseInt(this.calendar.months[i].days[j][k].num)) {
              this.calendar.months[i].days[j][k].events.push(events[l])
            }
          }

        }
      }
    }

  }

  generate_calendar() {

    let first_day_week = 3
    let final_day_per_month = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    let months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]
    let year = 2020

    let calendar = {
      year: year,
      months: []
    }

    let months_first_day_of_week = first_day_week

    for (let i = 0; i < months.length; i++) {
      let month = {
        name: months[i],
        days: []
      }

      let current_day = 1
      let first_week = true
      let last_day = false
      while (current_day <= final_day_per_month[i]) {

        let days = []
        for (let j = 0; j < 7; j++) {
          if (j < months_first_day_of_week && first_week) {
            days.push({
              num: "",
              events: []
            })
          } else if (current_day > final_day_per_month[i]) {
            if (!last_day) {
              months_first_day_of_week = j
              last_day = true
            }
            days.push({
              num: "",
              events: []
            })
          } else {
            days.push({
              num: current_day,
              events: []
            })
            current_day += 1
          }
        }
        month.days.push(days)
        first_week = false
      }

      if (!last_day) {
        months_first_day_of_week = 0
      }


      calendar.months.push(month)

    }

    this.calendar = calendar
  }

  select_date(day, month) {
    this.date.selected_day = day
    this.date.selected_month = month

    for (let i = 0; i < this.calendar.months[month].days.length; i++) {
      for (let j = 0; j < this.calendar.months[month].days[i].length; j++) {
        if (this.calendar.months[month].days[i][j].num == day) {
          this.date.selected_day_i = i
          this.date.selected_day_j = j
        }
      }
    }
  }

  set_date(month) {
    if (month >= 0 && month < 12) {
      this.date.month = month
      this.date.month_name = this.calendar.months[month].name

      var d = new Date();
      if (d.getMonth() == month) {
        this.date.day = d.getDate()
      } else {
        this.date.day = ""
      }
      this.date.year = this.calendar.year
    }
  }

  get_message() {
    this.socket.on('chat_broadcast', (data) => {
      console.log(data)
      if (data.from_type != 'relative')
        this.message_list.push({
          msg: data.message,
          from: "you"
        })
    });
  }

  send_message() {

    this.message_list.push({
      msg: this.message,
      from: "me"
    })

    this.socket.emit('chat_in', {
      from_id: 1,
      from_type: "relative",
      message: this.message,
      to_id: 1,
      to_type: "manager"
    });

    this.message = ""

  }

}
