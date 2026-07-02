import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';

const UpdatePassword = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen bg-neutral-50 flex">
      <div className="hidden lg:flex lg:w-1/2 bg-black flex-col justify-between p-12">
        <img src="/logo.png" alt="Universo Axium" className="h-10 w-auto object-contain filter brightness-0 invert" />
        <div>
          <h1 className="text-5xl font-black text-white leading-tight tracking-tight mb-4">
            Acelerando<br />o Crescimento.
          </h1>
          <p className="text-neutral-400 text-lg font-medium">
            Sistema de gestão interno para resultados extraordinários.
          </p>
        </div>
        <p className="text-neutral-600 text-sm">© 2026 Universo Axium · v1.0.0</p>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-6 md:mb-10 text-center">
            <img src="/logo.png" alt="Universo Axium" className="h-8 md:h-10 w-auto mx-auto object-contain" />
          </div>

          <button
            onClick={() => navigate('/login')}
            className="flex items-center gap-2 text-neutral-500 hover:text-black transition-colors mb-6 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para login
          </button>

          <div className="mb-6 md:mb-8">
            <h2 className="text-xl md:text-2xl font-black text-black tracking-tight mb-1">Recuperação de Senha</h2>
            <p className="text-neutral-500 text-xs md:text-sm">
              A recuperação de senha será implementada em breve. Entre em contato com o administrador.
            </p>
          </div>

          <div className="p-6 bg-yellow-50 border border-yellow-100 rounded-2xl">
            <p className="text-yellow-800 text-sm font-medium text-center">
              Para redefinir sua senha, solicite um novo link ao administrador do sistema.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdatePassword;
