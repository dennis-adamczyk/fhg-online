import { NgModule, Optional, SkipSelf } from '@angular/core';

import { AngularFireModule } from '@angular/fire';
import { AngularFirePerformanceModule } from '@angular/fire/performance';
import { AngularFireAuthModule } from '@angular/fire/auth';
import { AngularFirestoreModule } from '@angular/fire/firestore';
import {
  AngularFireFunctionsModule,
  FUNCTIONS_ORIGIN
} from '@angular/fire/functions';
import { AngularFireStorageModule } from '@angular/fire/storage';
import * as firebase from 'firebase/app';

import { ServiceWorkerModule } from '@angular/service-worker';
import { RouterModule } from '@angular/router';

import { environment } from '../../environments/environment';
import { NavigationComponent } from './navigation/navigation.component';
import { LayoutModule } from '@angular/cdk/layout';
import { SharedModule } from '../shared/shared.module';
import { AcceptCancelDialog } from './dialogs/accept-cancel/accept-cancel.component';
import { EditLessonsDialog } from './dialogs/edit-lessons/edit-lessons.component';
import { ColorPickerDialog } from './dialogs/color-picker/color-picker.component';
import { SanctionDialog } from './dialogs/sanction/sanction.component';
import { ShareSheet } from './bottomsheets/share/share.component';

// TODO: Add Angular Fire Performance

var providerscoll: any = [];
if (
  window != undefined &&
  window.location.hostname == 'localhost' &&
  window.location.port == '5000'
) {
  providerscoll.push({
    provide: FUNCTIONS_ORIGIN,
    useValue: 'http://localhost:5001'
  });
}

@NgModule({
  declarations: [
    NavigationComponent,
    AcceptCancelDialog,
    EditLessonsDialog,
    ColorPickerDialog,
    SanctionDialog,
    ShareSheet
  ],
  imports: [
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: environment.production
    }),
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireAuthModule,
    AngularFirestoreModule,
    AngularFireFunctionsModule,
    AngularFireStorageModule,
    AngularFirePerformanceModule,
    RouterModule,
    LayoutModule,
    SharedModule
  ],
  entryComponents: [
    AcceptCancelDialog,
    EditLessonsDialog,
    ColorPickerDialog,
    SanctionDialog,
    ShareSheet
  ],
  exports: [NavigationComponent],
  providers: [...providerscoll]
})
export class CoreModule {
  constructor(@Optional() @SkipSelf() parentModule: CoreModule) {
    if (parentModule) {
      throw new Error(
        'CoreModule has already been loaded. You should only import Core modules in the AppModule only.'
      );
    }
  }
}
