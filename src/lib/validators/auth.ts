import { z } from 'zod';

// ==============================================================================
// OMNIFLUX - SCHEMAS DE VALIDAÇÃO ZOD PARA AUTENTICAÇÃO
// ==============================================================================

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'O e-mail é obrigatório.' })
    .email('Informe um endereço de e-mail válido.')
    .trim()
    .toLowerCase(),
  password: z
    .string({ required_error: 'A senha é obrigatória.' })
    .min(6, 'A senha deve conter no mínimo 6 caracteres.'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string({ required_error: 'A senha atual é obrigatória.' })
      .min(1, 'Informe sua senha atual.'),
    newPassword: z
      .string({ required_error: 'A nova senha é obrigatória.' })
      .min(8, 'A nova senha deve ter no mínimo 8 caracteres.'),
    confirmNewPassword: z
      .string({ required_error: 'A confirmação de senha é obrigatória.' })
      .min(8, 'A confirmação de senha deve ter no mínimo 8 caracteres.'),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'As senhas não coincidem.',
    path: ['confirmNewPassword'],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
