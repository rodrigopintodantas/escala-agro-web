import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ButtonDirective, ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { CONST } from '../../helpers/constantes';

@Component({
  selector: 'app-delete-list-dialog',
  templateUrl: './delete-list-dialog.component.html',
  imports: [DialogModule, ButtonDirective, ButtonModule]
})
export class DeleteListDialogComponent {

  constantes = CONST

  @Input() visible: boolean = false;
  @Input() header: string = '';
  @Input() message: string = '';
  @Input() list: any[] = [];

  @Output() onCancel = new EventEmitter<void>();
  @Output() onConfirm = new EventEmitter<void>();

  cancel() {
    this.onCancel.emit();
  }

  confirm() {
    this.onConfirm.emit();
  }
}
