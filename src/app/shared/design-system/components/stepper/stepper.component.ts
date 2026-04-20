import { Component, computed, input, output } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { TranslatePipe } from '@ngx-translate/core';
import { StepItem } from '../../models/components.model';

@Component({
  selector: 'sce-stepper',
  standalone: true,
  imports: [NgIcon, TranslatePipe],
  templateUrl: './stepper.component.html',
})
export class StepperComponent {
  /** List of all steps */
  steps = input.required<StepItem[]>();

  /** 1-based index of the active step */
  activeStep = input.required<number>();

  /** Whether to allow clicking a step to navigate to it */
  clickable = input(false);

  /** Emits the 1-based index of the step the user clicked */
  stepChange = output<number>();

  protected isActive = (step: StepItem) => step.index === this.activeStep();
  protected isCompleted = (step: StepItem) => step.completed;
  protected isPending = (step: StepItem) => !step.completed && step.index !== this.activeStep();

  protected stepCls = computed(() => (step: StepItem) => {
    if (this.isCompleted(step)) return 'bg-green-500 text-white';
    if (this.isActive(step))    return 'bg-[#1e3a5f] text-white';
    return 'bg-gray-200 text-gray-500';
  });

  protected labelCls = computed(() => (step: StepItem) => {
    if (this.isActive(step))    return 'text-[#1e3a5f] font-semibold';
    if (this.isCompleted(step)) return 'text-green-600 font-medium';
    return 'text-gray-400';
  });

  protected connectorCls = computed(() => (step: StepItem) => {
    // connector shown after each step except the last
    return step.completed ? 'bg-green-400' : 'bg-gray-200';
  });

  protected handleClick(step: StepItem): void {
    if (this.clickable()) {
      this.stepChange.emit(step.index);
    }
  }
}
