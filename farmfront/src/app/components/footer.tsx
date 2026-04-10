import { Link } from "react-router";
import { Pill, MapPin, Phone, Mail, Clock, Facebook, Instagram, MessageCircle } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-[#0a2e22] text-white/80">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
                <Pill className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl text-white" style={{ fontWeight: 700 }}>FarmaMap</span>
            </Link>
            <p className="text-sm leading-relaxed mb-4">
              A plataforma digital que conecta consumidores a farmácias em Moçambique. Compare preços, encomende
              e receba medicamentos com segurança.
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-9 h-9 rounded-full bg-white/10 hover:bg-primary/80 flex items-center justify-center transition-colors" aria-label="Facebook">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-white/10 hover:bg-primary/80 flex items-center justify-center transition-colors" aria-label="Instagram">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-white/10 hover:bg-primary/80 flex items-center justify-center transition-colors" aria-label="WhatsApp">
                <MessageCircle className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white text-sm mb-4" style={{ fontWeight: 600 }}>Navegação</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/" className="hover:text-primary transition-colors">Início</Link></li>
              <li><Link to="/pesquisa" className="hover:text-primary transition-colors">Pesquisar Medicamentos</Link></li>
              <li><Link to="/consultas" className="hover:text-primary transition-colors">Consultas Médicas</Link></li>
              <li><Link to="/registar" className="hover:text-primary transition-colors">Criar Conta</Link></li>
            </ul>
          </div>

          {/* Pharmacy Portal */}
          <div>
            <h4 className="text-white text-sm mb-4" style={{ fontWeight: 600 }}>Para Farmácias</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/farmacia/entrar" className="hover:text-primary transition-colors">Login Farmácia</Link></li>
              <li><Link to="/farmacia/registar" className="hover:text-primary transition-colors">Registar Farmácia</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white text-sm mb-4" style={{ fontWeight: 600 }}>Suporte</h4>
            <ul className="space-y-2.5 text-sm">
              <li><a href="#" className="hover:text-primary transition-colors">Central de Ajuda</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Termos de Serviço</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Política de Privacidade</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Política de Devoluções</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">FAQ</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white text-sm mb-4" style={{ fontWeight: 600 }}>Contacto</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
                Av. 25 de Setembro, Maputo, Moçambique
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 shrink-0 text-primary" />
                +258 84 000 0000
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 shrink-0 text-primary" />
                suporte@farmamap.co.mz
              </li>
              <li className="flex items-center gap-2">
                <Clock className="w-4 h-4 shrink-0 text-primary" />
                Seg-Dom: 07:00 - 22:00
              </li>
            </ul>
          </div>
        </div>

        {/* Payment methods */}
        <div className="mt-10 pt-8 border-t border-white/10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-xs">
              <span className="text-white/50">Métodos de pagamento:</span>
              <div className="flex gap-2">
                {["M-Pesa", "e-Mola", "VISA", "Mastercard"].map((m) => (
                  <span key={m} className="px-2.5 py-1 rounded-md bg-white/10 text-white/70">{m}</span>
                ))}
              </div>
            </div>
            <p className="text-xs text-white/40">
              &copy; {new Date().getFullYear()} FarmaMap. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
