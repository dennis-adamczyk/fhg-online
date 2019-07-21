import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material';

@Component({
  selector: 'app-accept-cancel',
  templateUrl: './accept-cancel.component.html',
  styleUrls: ['./accept-cancel.component.sass']
})
export class AcceptCancelDialog implements OnInit {
  content = this.data.content.replace(new RegExp('\n', 'g'), '<br />');

  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {}

  ngOnInit() {}
}
