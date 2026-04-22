import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ButtonDirective } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { CONST } from '../../helpers/constantes';



@Component({
  selector: 'app-delete-dialog',
  templateUrl: './delete-dialog.component.html',
  standalone: true,
  imports: [DialogModule, CommonModule, ButtonDirective]
})
export class DeleteDialogComponent {

  constantes = CONST

  @Input() visible: boolean = false;
  @Input() header: string = '';
  @Input() message: string = '';
  @Input() item: any = { id: '', nome: '' };
  @Input() id: string = '';

  @Output() onCancel = new EventEmitter();

  @Output() onConfirm = new EventEmitter<any>();

  cancel() {
    this.onCancel.emit();
  }

  confirm() {
    this.onConfirm.emit();
  }
}
