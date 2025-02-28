import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { User } from 'src/users/user.entity';
import { UsersController } from 'src/users/users.controller';
import { UsersService } from 'src/users/users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            findAll: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  it('deve ser definido', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('deve criar um novo usuário', async () => {
      const createUserDto: CreateUserDto = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      };

      const mockUser: User = {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        password_hash: 'password123',
        balance: 0.00,
        created_at: new Date(),
        updated_at: new Date(),
      };

      jest.spyOn(service, 'create').mockResolvedValue(mockUser);

      const result = await controller.create(createUserDto);

      expect(service.create).toHaveBeenCalledWith(
        createUserDto.name,
        createUserDto.email,
        createUserDto.password,
      );
      expect(result).toEqual(mockUser);
    });
  });

  describe('findById', () => {
    it('deve retornar um usuário pelo ID', async () => {
      const userId = '1';
      const mockUser: User = {
        id: userId,
        name: 'John Doe',
        email: 'john@example.com',
        password_hash: 'password123',
        balance: 0.0,
        created_at: new Date(),
        updated_at: new Date(),
      };
  
      // Mock the service to return the mock user
      jest.spyOn(service, 'findById').mockResolvedValue(mockUser);
  
      const result = await controller.findById(userId);
  
      expect(service.findById).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockUser);
    });
  
    it('deve lançar NotFoundException se o usuário não for encontrado', async () => {
      const userId = '999';
  
      // Mock the service to throw NotFoundException
      jest.spyOn(service, 'findById').mockRejectedValue(new NotFoundException('Usuário não encontrado.'));
  
      // Expect the controller to throw NotFoundException
      await expect(controller.findById(userId)).rejects.toThrow(NotFoundException);
      await expect(controller.findById(userId)).rejects.toThrow('Usuário não encontrado.');
    });
  });

  describe('findAll', () => {
    it('deve retornar um array de usuários', async () => {
      const mockUsers: User[] = [
        {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          password_hash: 'password123',
          balance: 0.00,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: '2',
          name: 'Jane Doe',
          email: 'jane@example.com',
          password_hash: 'password456',
          balance: 0.00,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      jest.spyOn(service, 'findAll').mockResolvedValue(mockUsers);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockUsers);
    });
  });
});