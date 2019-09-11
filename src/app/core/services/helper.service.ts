import { Injectable } from '@angular/core';
import { constant } from 'src/configs/constants';
import { AuthService } from './auth.service';
import * as firebase from 'firebase/app';

@Injectable({
  providedIn: 'root'
})
export class HelperService {
  constructor(private auth: AuthService) {}

  /**
   * Returns the flatten out array
   *
   * @param {any[]} arr
   * @returns {any[]}
   * @memberof HelperService
   */
  getFlatArray(arr: any[]): any[] {
    let output = [];
    arr.forEach(item => {
      if (Array.isArray(item)) {
        item.forEach(subItem => {
          output.push(subItem);
        });
      } else {
        output.push(item);
      }
    });
    return output;
  }

  /**
   * Returns a generated random id of alphanumeric chars
   *
   * @param {number} [length=4]
   * @returns
   * @memberof HelperService
   */
  generateId(length: number = 4) {
    let result = '';
    let characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }

  /**
   * Returns the hex color of a color code
   *
   * @param {string} code
   * @returns {string}
   * @memberof HelperService
   */
  getColor(code: string): string {
    if (!code) return undefined;
    var color = code.split(' ');
    return constant.colors[color[0]][color[1]];
  }

  /**
   * Returns the contrast hex color (black or white) of a color code
   *
   * @param {string} code
   * @returns {string} hex color
   * @memberof HelperService
   */
  getContrastColor(code: string): string {
    if (!code) return undefined;
    var color = code.split(' ');
    return constant.colorsContrast[color[0]][color[1]];
  }

  /**
   * Returns if string is a class id
   *
   * @param {string} clazz
   * @returns {boolean}
   * @memberof HelperService
   */
  isClass(clazz: string): boolean {
    return !!clazz.charAt(0).match(/\d/);
  }

  /**
   * Returns the class id of a course id
   *
   * @param {string} course
   * @returns {string} class id
   * @memberof HelperService
   */
  getClass(course: string): string {
    let clazz = course.match(/(\w\w)\-[\w]+/)[0];
    if (!clazz || !clazz.length) return;
    if (!this.isClass(clazz)) return;
    return clazz.toLowerCase();
  }

  /**
   * Returns the year of a class id
   *
   * @param {string} [clazz]
   * @returns {string} year
   * @memberof HelperService
   */
  getYear(clazz?: string): string {
    if (!clazz) clazz = this.auth.user.class;
    if (clazz.charAt(0).match(/\d/)) {
      return clazz.charAt(0);
    } else {
      return clazz;
    }
  }

  /**
   * Returns the year of a course id
   *
   * @param {string} course
   * @returns {string}
   * @memberof HelperService
   */
  getYearOfCourse(course: string): string {
    let clazz = course.match(/(\w+)\-[\w]+/)[0];
    if (!clazz) return;
    return this.isClass(clazz) ? this.getYear(clazz) : clazz;
  }

  /**
   * Returns the date of a firestore Timestamp
   *
   * @param {(Date | firebase.firestore.Timestamp)} date
   * @returns {Date}
   * @memberof HelperService
   */
  getDateOf(date: Date | firebase.firestore.Timestamp): Date {
    if (date instanceof firebase.firestore.Timestamp) return date.toDate();
    if (typeof date == 'object')
      return firebase.firestore.Timestamp.fromMillis(
        date['seconds'] * 1000
      ).toDate();
    return date;
  }

  /**
   * Returns the number equivalent to the week day of a date.
   * Monday = 1 (...) Saturday = 7
   *
   * @param {Date} date
   * @returns {number}
   * @memberof HelperService
   */
  getWeekDay(date: Date): number {
    return date.getDay() || 7;
  }

  /**
   * Returns the a array of keys of a object
   *
   * @param {object} obj
   * @returns {string[]}
   * @memberof HelperService
   */
  keysOf(obj: object): string[] {
    return Object.keys(obj);
  }

  /**
   * Returns a array of increacing numbers with the length of max staring at 1
   *
   * @param {number} max
   * @returns {number[]}
   * @memberof HelperService
   */
  arrayOf(max: number): number[] {
    return Array.apply(null, Array(max)).map(function(x, i) {
      return i + 1;
    });
  }
}
