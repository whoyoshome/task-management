import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { User } from '../entities/user.entity';
import { CreateUserDto, UpdateUserDto } from '@shared/contracts';
import { UserService } from '../services/user.service';

// Errors (e.g. NotFoundException from the service) are converted to the
// shared RPC error format by AllRpcExceptionsFilter.
@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  private excludePassword(user: User): Omit<User, 'password'> {
    const { password: _password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  @MessagePattern({ cmd: 'create_user' })
  async create(@Payload() dto: CreateUserDto) {
    return this.excludePassword(await this.userService.create(dto));
  }

  @MessagePattern({ cmd: 'get_all_users' })
  async findAll() {
    const users = await this.userService.findAll();
    return users.map((user) => this.excludePassword(user));
  }

  @MessagePattern({ cmd: 'get_user_by_id' })
  async findOne(@Payload() id: string) {
    return this.excludePassword(await this.userService.findOne(id));
  }

  @MessagePattern({ cmd: 'update_user' })
  async update(@Payload() data: { id: string; dto: UpdateUserDto }) {
    return this.excludePassword(
      await this.userService.update(data.id, data.dto)
    );
  }

  @MessagePattern({ cmd: 'delete_user' })
  async remove(@Payload() id: string) {
    await this.userService.remove(id);
  }

  @MessagePattern({ cmd: 'get_user_by_email' })
  async getUserByEmail(@Payload() email: string) {
    const user = await this.userService.findByEmail(email);
    return user ? this.excludePassword(user) : null;
  }

  @MessagePattern({ cmd: 'validate_credentials' })
  async validateCredentials(
    @Payload() data: { email: string; password: string }
  ) {
    const user = await this.userService.validateCredentials(
      data.email,
      data.password
    );
    return user ? this.excludePassword(user) : null;
  }

  @MessagePattern({ cmd: 'get_current_user' })
  async getCurrentUser(@Payload() id: string) {
    return this.excludePassword(await this.userService.findOne(id));
  }
}
