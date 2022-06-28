import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { TaskStatus } from './task.status.enum';
import { CreateClassDto } from './dta/create-task.dto';
import { GetTasksFilterDto } from './dta/get-tasks-filter.dto';
import { QueryBuilder, Repository } from 'typeorm';
import { Task } from './task.entity';

import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/auth/user.entity';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private taskRepositery: Repository<Task>,
  ) {}

  async getTaskById(id: string, user: User): Promise<Task> {
    const found = await this.taskRepositery.findOneBy({ id, user });

    if (!found) {
      throw new NotFoundException(`Task with id ${id} not found`);
    }

    return found;
  }

  async deleteTask(id: string, user: User): Promise<void> {
    const found = this.getTaskById(id, user);
    if (found) {
      await this.taskRepositery.delete(id);
    }
  }

  async createTask(createTaskDto: CreateClassDto, user: User): Promise<Task> {
    const { description, title } = createTaskDto;
    const task = this.taskRepositery.create({
      description: description,
      title: title,
      status: TaskStatus.OPEN,
      user,
    });
    await this.taskRepositery.save(task);
    return task;
  }

  async updateTaskStatus(
    id: string,
    status: TaskStatus,
    user: User,
  ): Promise<Task> {
    const task = await this.getTaskById(id, user);
    task.status = status;
    this.taskRepositery.save(task);
    return task;
  }
  async getTasks(filterDto: GetTasksFilterDto, user: User): Promise<Task[]> {
    const { status, search } = filterDto;
    const query = this.taskRepositery.createQueryBuilder('task');

    query.where({ user });

    if (status) {
      query.andWhere('task.status = :status', { status });
    }
    if (search) {
      query.andWhere(
        '(LOWER(task.title) LIKE LOWER(:search) OR LOWER(task.description) LIKE LOWER(:search))',
        { search: `%${search}%` },
      );
    }

    try {
      const tasks = await query.getMany();
      return tasks;
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }
}
