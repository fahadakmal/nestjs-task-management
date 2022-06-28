import { IsEnum } from 'class-validator';
import { TaskStatus } from '../task.status.enum';

export class UpdateClassStatusDto {
  @IsEnum(TaskStatus)
  status: TaskStatus;
}
