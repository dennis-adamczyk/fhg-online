import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { constant } from 'src/configs/constants';
import { AuthService } from './auth.service';
import * as firebase from 'firebase/app';
import { isPlatformServer, isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class HelperService {
  constructor(
    private auth: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

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
  isClass(clazz?: string): boolean {
    if (!clazz) clazz = this.auth.user.class;
    if (!clazz) return;
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
    if (!course) return;
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
    if (!clazz && this.auth.user) clazz = this.auth.user.class;
    if (!clazz) return;
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
    if (!course) return;
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
   * Returns the week day name of a date.
   *
   * @param {Date} date
   * @returns {string}
   * @memberof HelperService
   */
  getWeekDayName(date: Date, length?: number): string {
    const formatter = new Intl.DateTimeFormat('de', { weekday: 'long' });
    let output = formatter.format(date);
    return length ? output.substr(0, length) : output;
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
  arrayOf(max: number, min: number = 1): number[] {
    max = max - (min - 1);
    return Array.apply(null, Array(max)).map(function(x, i) {
      return i + min;
    });
  }

  /**
   * Returns true if the platform is server
   *
   * @returns {boolean}
   * @memberof HelperService
   */
  isServer(): boolean {
    return isPlatformServer(this.platformId);
  }

  /**
   * Returns true if the platform is browser
   *
   * @returns {boolean}
   * @memberof HelperService
   */
  isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  /**
   * Returns a string shortened to a max length without cutting words
   *
   * @param {string} str
   * @param {number} maxLen
   * @param {string} [separator=' ']
   * @returns {string}
   * @memberof HelperService
   */
  shorten(str: string, maxLen: number, separator: string = ' '): string {
    if (str.length <= maxLen) return str;
    return str.substr(0, str.lastIndexOf(separator, maxLen));
  }

  /**
   * Converts a HTML string to plain text (and eg. adds an colon after headlines and period after paragraphs)
   *
   * @param {string} text
   * @returns {string}
   * @memberof HelperService
   */
  htmlToText(html: string): string {
    html = html.replace(/(\w)<\/h2[^>]*>+/gm, '$1: ');
    html = html.replace(/(\w)<\/h3[^>]*>+/gm, '$1: ');
    html = html.replace(/(\w)<\/p[^>]*>+/gm, '$1. ');
    html = html.replace(/<\/p[^>]*>+/gm, ' ');
    html = html.replace(/<\/[^>]*>?/gm, ' ');
    html = html.replace(/<[^>]*>?/gm, '');
    if (html.endsWith(' ')) html = html.substr(0, html.length - 1);
    return html;
  }

  /**
   * Returns the name of the currently used browser
   *
   * @returns {('edge' | 'opera' | 'chrome' | 'ie' | 'firefox' | 'safari' | 'other')}
   * @memberof HelperService
   */
  getBrowserName():
    | 'edge'
    | 'opera'
    | 'chrome'
    | 'ie'
    | 'firefox'
    | 'safari'
    | 'other' {
    if (!isPlatformBrowser(this.platformId) || !window) return;
    const agent = window.navigator.userAgent.toLowerCase();
    switch (true) {
      case agent.indexOf('edge') > -1:
        return 'edge';
      case agent.indexOf('opr') > -1 && !!(<any>window).opr:
        return 'opera';
      case agent.indexOf('chrome') > -1 && !!(<any>window).chrome:
        return 'chrome';
      case agent.indexOf('trident') > -1:
        return 'ie';
      case agent.indexOf('firefox') > -1:
        return 'firefox';
      case agent.indexOf('safari') > -1:
        return 'safari';
      default:
        return 'other';
    }
  }

  /**
   * Returns the bytes the parameter is large
   *
   * @param {*} data
   * @returns {number}
   * @memberof HelperService
   */
  sizeOf(data: any): number {
    data = JSON.stringify(data);
    return new Blob([data]).size;
  }
}
