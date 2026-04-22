import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-aprovacao-dialog',
  standalone: true,
  imports: [DialogModule, ButtonModule, CommonModule],
  templateUrl: './confirm-aprovacao-dialog.component.html',
  styleUrls: ['./confirm-aprovacao-dialog.component.css']
})
export class ConfirmAprovacaoDialogComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() confirmAprovacao = new EventEmitter<void>();

  confirmar() {
    this.confirmAprovacao.emit();
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

