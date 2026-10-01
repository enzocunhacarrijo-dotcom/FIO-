import { Redirect } from 'expo-router';

// Rota de segurança do deep link `fio://auth/google`: em alguns Androids o link
// abre o app fora da sessão de autenticação. O login em si é concluído em
// `signInWithGoogle` (store/auth); aqui só voltamos para a raiz.
export default function GoogleAuthCallback() {
  return <Redirect href="/" />;
}
