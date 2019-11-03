import { NgModule } from '@angular/core';
import {
  CommonModule,
  isPlatformBrowser,
  registerLocaleData
} from '@angular/common';
import { MaterialModule } from './material.module';
import { DocPipe } from './pipes/doc.pipe';
import { ColPipe } from './pipes/col.pipe';
import { ReactiveFormsModule } from '@angular/forms';
import { NgxTrimDirectiveModule } from 'ngx-trim-directive';
import {
  MAT_DATE_LOCALE,
  DateAdapter,
  MAT_DATE_FORMATS
} from '@angular/material';
import { AppDateAdapter, APP_DATE_FORMATS } from './adapters/app-date-adapters';
import { SpeedDialFabComponent } from './components/speed-dial-fab/speed-dial-fab.component';
import { IntroComponent } from './components/intro/intro.component';
import * as Hammer from 'hammerjs';
import {
  HammerGestureConfig,
  HAMMER_GESTURE_CONFIG
} from '@angular/platform-browser';
import { QuillModule } from 'ngx-quill';
import { NgAisModule } from 'angular-instantsearch';
import { OfflineComponent } from './components/offline/offline.component';

export class MyHammerConfig extends HammerGestureConfig {
  overrides = <any>{
    swipe: { direction: Hammer.DIRECTION_ALL }
  };

  buildHammer(element: HTMLElement): HammerManager {
    return new Hammer.Manager(element, {
      touchAction: 'auto',
      inputClass: Hammer.TouchInput,
      recognizers: [
        [
          Hammer.Swipe,
          {
            direction: Hammer.DIRECTION_HORIZONTAL
          }
        ]
      ]
    });
  }
}

@NgModule({
  declarations: [
    DocPipe,
    ColPipe,
    SpeedDialFabComponent,
    IntroComponent,
    OfflineComponent
  ],
  imports: [
    CommonModule,
    MaterialModule,
    QuillModule.forRoot(),
    NgAisModule.forRoot()
  ],
  exports: [
    CommonModule,
    MaterialModule,
    DocPipe,
    ColPipe,
    ReactiveFormsModule,
    NgxTrimDirectiveModule,
    SpeedDialFabComponent,
    IntroComponent,
    QuillModule,
    NgAisModule,
    OfflineComponent
  ],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'de-DE' },
    { provide: DateAdapter, useClass: AppDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: APP_DATE_FORMATS },
    { provide: HAMMER_GESTURE_CONFIG, useClass: MyHammerConfig }
  ]
})
export class SharedModule {}
