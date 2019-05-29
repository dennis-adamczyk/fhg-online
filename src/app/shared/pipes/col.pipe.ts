import { Observable } from 'rxjs';
import { FirestoreService } from '../../core/services/firestore.service';
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'col'
})
export class ColPipe implements PipeTransform {
  constructor(private db: FirestoreService) {}

  transform(value: any): Observable<any> {
    return this.db.col$(value);
  }
}
