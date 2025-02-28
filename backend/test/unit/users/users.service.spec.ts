import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { User } from 'src/users/user.entity';
import { UsersService } from 'src/users/users.service';

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: Repository<User>;

  const mockUser: User = {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    password_hash: 'hashedpassword',
    balance: 100,
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            update: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  it('deve ser definido', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('deve criar um novo usuário', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(userRepository, 'create').mockReturnValue(mockUser);
      jest.spyOn(userRepository, 'save').mockResolvedValue(mockUser);
      (jest.spyOn(bcrypt, 'hash') as jest.Mock).mockResolvedValue('hashedpassword');

      const result = await service.create('John Doe', 'john@example.com', 'password');

      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { email: 'john@example.com' } });
      expect(userRepository.create).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com',
        password_hash: 'hashedpassword',
      });
      expect(userRepository.save).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockUser);
    });

    it('deve lançar ConflictException se o usuário com o email já existir', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);

      await expect(service.create('John Doe', 'john@example.com', 'password')).rejects.toThrow(
        ConflictException,
      );
    });

    it('deve lançar ConflictException se o nome, email ou senha estiverem faltando', async () => {
      await expect(service.create('', 'john@example.com', 'password')).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create('John Doe', '', 'password')).rejects.toThrow(ConflictException);
      await expect(service.create('John Doe', 'john@example.com', '')).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findByEmail', () => {
    it('deve retornar um usuário pelo email', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);

      const result = await service.findByEmail('john@example.com');

      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { email: 'john@example.com' } });
      expect(result).toEqual(mockUser);
    });

    it('deve lançar NotFoundException se o usuário não for encontrado', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      await expect(service.findByEmail('john@example.com')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findById', () => {
    it('deve retornar um usuário pelo id', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);

      const result = await service.findById('1');

      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(result).toEqual(mockUser);
    });

    it('deve lançar NotFoundException se o usuário não for encontrado', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      await expect(service.findById('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('deve retornar todos os usuários', async () => {
      jest.spyOn(userRepository, 'find').mockResolvedValue([mockUser]);

      const result = await service.findAll();

      expect(userRepository.find).toHaveBeenCalled();
      expect(result).toEqual([mockUser]);
    });
  });

  describe('updateBalance', () => {
    it('deve atualizar o saldo do usuário', async () => {
      jest.spyOn(userRepository, 'update').mockResolvedValue({ affected: 1 } as any);

      await service.updateBalance('1', 200);

      expect(userRepository.update).toHaveBeenCalledWith('1', { balance: 200 });
    });
  });
});