import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Dialog, DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [DialogModule, ButtonModule, CommonModule],
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.css']
})
export class ConfirmDialogComponent {
  @Input() visible: boolean = false;
  @Input() header: string = 'Confirmar Exclusão';
  @Input() message: string = 'Tem certeza que deseja excluir este registro?';
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() confirmDelete = new EventEmitter<void>();

  confirmDeleteSelected() {
    this.confirmDelete.emit();
    this.fecharDialog();
  }

  cancelar() {
    this.fecharDialog();
  }

  private fecharDialog() {
    this.visible = false;
    this.visibleChange.emit(false);
  }
}
